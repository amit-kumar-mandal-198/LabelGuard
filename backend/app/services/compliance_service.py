import json
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.declaration import Declaration
from app.models.inspection import ComplianceStatus, Inspection
from app.models.rule_condition import RuleCondition
from app.models.rule_version import RuleVersion

from app.repositories.declaration_repository import (
    get_declarations_for_inspection,
)
from app.repositories.inspection_repository import (
    get_inspection,
    update_compliance_status,
)
from app.repositories.rule_repository import (
    get_active_rule_versions,
)
from app.repositories.violation_repository import (
    clear_violations_for_inspection,
    create_violation,
)


SUPPORTED_OPERATORS = {
    "required",
    "required_any",
    "minimum",
}


def _declaration_map(
    declarations: list[Declaration],
) -> dict[str, Declaration]:
    return {
        declaration.field_name: declaration
        for declaration in declarations
    }


def _value_present(
    declaration: Declaration | None,
) -> bool:
    if declaration is None:
        return False

    if not declaration.is_present:
        return False

    value = declaration.normalized_value

    if value is None:
        value = declaration.extracted_value

    if value is None:
        return False

    return bool(str(value).strip())


def _evaluate_condition(
    condition: RuleCondition,
    declarations: dict[str, Declaration],
) -> bool | None:
    declaration = declarations.get(condition.field_name)

    actual_value: Any = None

    if declaration is not None:
        actual_value = declaration.normalized_value

        if actual_value is None:
            actual_value = declaration.extracted_value

    operator = condition.operator.lower().strip()
    expected = condition.expected_value

    if operator == "equals":
        if actual_value is None:
            return None

        actual = str(actual_value).strip().lower()
        expected_normalized = str(expected).strip().lower()

        return actual == expected_normalized

    if operator == "not_equals":
        if actual_value is None:
            return None

        actual = str(actual_value).strip().lower()
        expected_normalized = str(expected).strip().lower()

        return actual != expected_normalized

    if operator == "exists":
        return _value_present(declaration)

    return None


def _evaluate_rule_conditions(
    rule: RuleVersion,
    declarations: dict[str, Declaration],
) -> bool | None:
    if not rule.conditions:
        return True

    grouped: dict[int, list[RuleCondition]] = {}

    for condition in rule.conditions:
        grouped.setdefault(
            condition.logical_group,
            []
        ).append(condition)

    group_results: list[bool | None] = []

    for conditions in grouped.values():
        results = [
            _evaluate_condition(
                condition,
                declarations,
            )
            for condition in sorted(
                conditions,
                key=lambda item: item.condition_order,
            )
        ]

        if any(result is None for result in results):
            group_results.append(None)
        elif all(results):
            group_results.append(True)
        else:
            group_results.append(False)

    if any(result is True for result in group_results):
        return True

    if all(result is False for result in group_results):
        return False

    return None


def _evaluate_check(
    check,
    declarations: dict[str, Declaration],
) -> tuple[str, Declaration | None]:
    operator = check.operator.lower().strip()

    if operator not in SUPPORTED_OPERATORS:
        return "review", declarations.get(check.field_name)

    if operator == "required":
        declaration = declarations.get(check.field_name)

        if _value_present(declaration):
            if declaration.confidence is not None and declaration.confidence < 35.0:
                return "review", declaration
            return "pass", declaration

        return "fail", declaration

    if operator == "required_any":
        field_names = [
            field.strip()
            for field in str(
                check.expected_value or ""
            ).split(",")
            if field.strip()
        ]

        found_low_conf: Declaration | None = None

        for field_name in field_names:
            declaration = declarations.get(field_name)

            if _value_present(declaration):
                if declaration.confidence is not None and declaration.confidence < 35.0:
                    if found_low_conf is None:
                        found_low_conf = declaration
                    continue
                return "pass", declaration

        if found_low_conf is not None:
            return "review", found_low_conf

        return "fail", None

    if operator == "minimum":
        declaration = declarations.get(check.field_name)

        if declaration is None:
            if check.field_name == "declaration_legibility":
                from app.rules.validators.readability_validator import validate_legibility
                leg_res = validate_legibility(declarations)
                verdict = leg_res.get("status")
                if verdict == "pass":
                    return "pass", None
                if verdict == "review":
                    return "review", None
                return "fail", None

            return "fail", None

        value = (
            declaration.normalized_value
            or declaration.extracted_value
        )

        if value is None:
            return "fail", declaration

        expected_str = str(check.expected_value or "").strip().lower()

        # Handle qualitative / categorical thresholds (e.g. "acceptable", "pass", "compliant")
        if expected_str in ("acceptable", "pass", "compliant"):
            actual_str = str(value).strip().lower()

            # Parse JSON payload if value contains serialized legibility dictionary
            if actual_str.startswith("{") and actual_str.endswith("}"):
                try:
                    payload = json.loads(actual_str)
                    actual_str = str(payload.get("status") or "").strip().lower()
                except Exception:
                    pass

            if actual_str in ("pass", "acceptable", "compliant"):
                return "pass", declaration
            if actual_str in ("review", "warning"):
                return "review", declaration
            if actual_str in ("fail", "unacceptable", "non_compliant"):
                return "fail", declaration

            # If value is numeric score or declaration has confidence score
            score_val = None
            try:
                score_val = float(value)
            except (TypeError, ValueError):
                if declaration.confidence is not None:
                    score_val = float(declaration.confidence)

            if score_val is not None:
                if score_val >= 70.0:
                    return "pass", declaration
                if score_val >= 40.0:
                    return "review", declaration
                return "fail", declaration

            return "review", declaration

        # Handle quantitative / numeric thresholds (e.g. "70", "5.0")
        try:
            score_val = None
            try:
                score_val = float(value)
            except (TypeError, ValueError):
                if declaration.confidence is not None:
                    score_val = float(declaration.confidence)

            if score_val is None:
                actual_str = str(value).strip().lower()
                if actual_str in ("pass", "acceptable", "compliant"):
                    return "pass", declaration
                if actual_str in ("review", "warning"):
                    return "review", declaration
                return "fail", declaration

            expected = float(check.expected_value)

            if score_val >= expected:
                return "pass", declaration

            return "fail", declaration

        except (TypeError, ValueError):
            return "review", declaration

    return "review", declarations.get(check.field_name)


def _evidence_for(
    declaration: Declaration | None,
) -> str | None:
    if declaration is None:
        return None

    payload = {
        "declaration_id": declaration.id,
        "field_name": declaration.field_name,
        "confidence": declaration.confidence,
    }

    return json.dumps(
        payload,
        ensure_ascii=True,
    )


def evaluate_inspection(
    db: Session,
    inspection_id: int,
) -> dict[str, Any]:
    inspection = get_inspection(
        db,
        inspection_id,
    )

    if inspection is None:
        raise ValueError(
            f"Inspection {inspection_id} not found"
        )

    declarations = get_declarations_for_inspection(
        db,
        inspection_id,
    )

    declaration_map = _declaration_map(
        declarations
    )

    inspection_date: date = (
        inspection.created_at.date()
    )

    regulation_id = _get_regulation_id(
        db
    )

    rules = get_active_rule_versions(
        db,
        regulation_id,
        inspection_date,
    )

    clear_violations_for_inspection(
        db,
        inspection_id,
    )

    rule_results: list[dict[str, Any]] = []
    has_failure = False
    has_review = False

    for rule in rules:
        condition_result = _evaluate_rule_conditions(
            rule,
            declaration_map,
        )

        if condition_result is False:
            rule_results.append(
                {
                    "rule_code": rule.rule_code,
                    "status": "not_applicable",
                }
            )
            continue

        if condition_result is None:
            has_review = True

            rule_results.append(
                {
                    "rule_code": rule.rule_code,
                    "status": "review",
                }
            )
            continue

        check_results = []

        for check in rule.checks:
            result, declaration = _evaluate_check(
                check,
                declaration_map,
            )

            check_results.append(
                {
                    "field_name": check.field_name,
                    "status": result,
                }
            )

            if result == "fail":
                has_failure = True

                create_violation(
                    db,
                    {
                        "inspection_id": inspection_id,
                        "rule_version_id": rule.id,
                        "field_name": check.field_name,
                        "severity": check.severity,
                        "status": "open",
                        "message": check.failure_message,
                        "detected_value": (
                            (
                                declaration.normalized_value
                                or declaration.extracted_value
                            )
                            if declaration
                            else None
                        ),
                        "expected_value": check.expected_value,
                        "confidence": (
                            declaration.confidence
                            if declaration
                            else None
                        ),
                        "evidence": _evidence_for(
                            declaration
                        ),
                    },
                )

            elif result == "review":
                has_review = True

                create_violation(
                    db,
                    {
                        "inspection_id": inspection_id,
                        "rule_version_id": rule.id,
                        "field_name": check.field_name,
                        "severity": check.severity,
                        "status": "review",
                        "message": (
                            "Compliance could not be "
                            "determined automatically: "
                            + check.failure_message
                        ),
                        "detected_value": (
                            (
                                declaration.normalized_value
                                or declaration.extracted_value
                            )
                            if declaration
                            else None
                        ),
                        "expected_value": check.expected_value,
                        "confidence": (
                            declaration.confidence
                            if declaration
                            else None
                        ),
                        "evidence": _evidence_for(
                            declaration
                        ),
                    },
                )

        rule_results.append(
            {
                "rule_code": rule.rule_code,
                "status": (
                    "fail"
                    if any(
                        result["status"] == "fail"
                        for result in check_results
                    )
                    else (
                        "review"
                        if any(
                            result["status"] == "review"
                            for result in check_results
                        )
                        else "pass"
                    )
                ),
                "checks": check_results,
            }
        )

    if has_failure:
        final_status = ComplianceStatus.NON_COMPLIANT
    elif has_review:
        final_status = ComplianceStatus.REVIEW
    else:
        final_status = ComplianceStatus.COMPLIANT

    update_compliance_status(
        db,
        inspection,
        final_status,
    )

    return {
        "inspection_id": inspection_id,
        "status": final_status.value,
        "rules_evaluated": len(rules),
        "results": rule_results,
    }


def _get_regulation_id(
    db: Session,
) -> int:
    statement = (
        select(RuleVersion.regulation_id)
        .where(
            RuleVersion.status == "active",
            RuleVersion.approval_status == "approved",
        )
        .order_by(
            RuleVersion.regulation_id.asc()
        )
        .limit(1)
    )

    regulation_id = db.scalar(statement)

    if regulation_id is None:
        raise ValueError(
            "No active approved regulation found"
        )

    return regulation_id
