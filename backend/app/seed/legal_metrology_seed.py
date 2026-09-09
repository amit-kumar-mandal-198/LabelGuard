from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.regulation import Regulation
from app.models.rule_version import RuleVersion
from app.models.rule_condition import RuleCondition
from app.models.rule_check import RuleCheck
from app.models.rule_source import RuleSource


REGULATION_CODE = "LM-PC-2011"


# ---------------------------------------------------------------------------
# Rule catalogue — add new rules here; _ensure_rules() is idempotent and will
# insert any rule whose rule_code is not yet present in the database.
# ---------------------------------------------------------------------------
_RULES: list[dict] = [
    {
        "rule_code": "LG-MFR",
        "rule_number": "6",
        "version": 1,
        "title": "Manufacturer, Packer or Importer Declaration",
        "requirement": (
            "Applicable manufacturer, packer or importer name "
            "and address must be declared on the package."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "manufacturer",
                "operator": "required_any",
                "expected_value": (
                    "manufacturer,packer,importer"
                ),
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Required manufacturer, packer or importer "
                    "declaration was not identified."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-COMMODITY",
        "rule_number": "6",
        "version": 1,
        "title": "Common or Generic Name",
        "requirement": (
            "The common or generic name of the commodity must "
            "be declared."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "product_name",
                "operator": "required",
                "expected_value": None,
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Common or generic commodity name was not "
                    "identified."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-QTY",
        "rule_number": "6",
        "version": 1,
        "title": "Net Quantity",
        "requirement": (
            "Net quantity must be declared using an appropriate "
            "unit of weight, measure or number as applicable."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "net_quantity",
                "operator": "required",
                "expected_value": None,
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Net quantity declaration was not identified."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-MRP",
        "rule_number": "6",
        "version": 1,
        "title": "Maximum Retail Price",
        "requirement": (
            "Maximum Retail Price inclusive of applicable taxes "
            "must be declared in the prescribed manner."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "mrp",
                "operator": "required",
                "expected_value": None,
                "expected_unit": "INR",
                "severity": "major",
                "failure_message": (
                    "Maximum Retail Price declaration was not "
                    "identified."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-DATE",
        "rule_number": "6",
        "version": 1,
        "title": "Manufacture, Packing or Import Date",
        "requirement": (
            "Applicable month and year declarations relating to "
            "manufacture, packing or import must be provided."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "manufacturing_date",
                "operator": "required_any",
                "expected_value": (
                    "manufacturing_date,packing_date,import_date"
                ),
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Applicable manufacture, packing or import "
                    "date declaration was not identified."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-CARE",
        "rule_number": "6",
        "version": 1,
        "title": "Consumer Care Details",
        "requirement": (
            "Consumer care contact details such as telephone, "
            "email or other prescribed contact information must "
            "be declared."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "consumer_care",
                "operator": "required",
                "expected_value": None,
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Consumer care contact details were not "
                    "identified."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-COO",
        "rule_number": "6",
        "version": 1,
        "title": "Country of Origin",
        "requirement": (
            "Country of origin must be declared for imported "
            "packages where applicable."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [
            {
                "field_name": "imported",
                "operator": "equals",
                "expected_value": "true",
                "logical_group": 0,
                "condition_order": 0,
            },
            {
                "field_name": "country_of_origin",
                "operator": "exists",
                "expected_value": None,
                "logical_group": 1,
                "condition_order": 0,
            },
        ],
        "checks": [
            {
                "field_name": "country_of_origin",
                "operator": "required",
                "expected_value": None,
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Country of origin was not identified for "
                    "an imported commodity."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-BBE",
        "rule_number": "6",
        "version": 1,
        "title": "Best Before or Use By",
        "requirement": (
            "Best-before or use-by declaration must be provided "
            "for commodities where applicable."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [
            {
                "field_name": "date_sensitive_commodity",
                "operator": "equals",
                "expected_value": "true",
                "logical_group": 0,
                "condition_order": 0,
            }
        ],
        "checks": [
            {
                "field_name": "best_before",
                "operator": "required_any",
                "expected_value": (
                    "best_before,expiry_date"
                ),
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Applicable best-before or use-by declaration "
                    "was not identified."
                ),
            }
        ],
    },
    {
        "rule_code": "LG-LEGIBILITY",
        "rule_number": "9",
        "version": 1,
        "title": "Legibility and Prominence",
        "requirement": (
            "Mandatory declarations must be legible, prominent "
            "and presented in the prescribed manner."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "declaration_legibility",
                "operator": "minimum",
                "expected_value": "acceptable",
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Mandatory declaration does not meet the "
                    "required legibility/presentation threshold."
                ),
            }
        ],
    },
    # -----------------------------------------------------------------------
    # LG-BATCH — Rule 6(1)(g)
    # Batch / lot number for traceability.
    # The extractor already captures batch_number; this rule evaluates it.
    # -----------------------------------------------------------------------
    {
        "rule_code": "LG-BATCH",
        "rule_number": "6",
        "version": 1,
        "title": "Batch or Lot Number",
        "requirement": (
            "A batch number, lot number, or code number must be "
            "declared on the package for traceability purposes."
        ),
        "effective_from": date(2011, 4, 1),
        "conditions": [],
        "checks": [
            {
                "field_name": "batch_number",
                "operator": "required",
                "expected_value": None,
                "expected_unit": None,
                "severity": "major",
                "failure_message": (
                    "Batch or lot number declaration was not "
                    "identified on the package."
                ),
            }
        ],
    },
]

_RULE_SOURCE: dict = {
    "source_type": "OFFICIAL_RULE",
    "source_reference": "Legal Metrology (Packaged Commodities) Rules, 2011",
    "source_title": (
        "Legal Metrology (Packaged Commodities) Rules, 2011"
    ),
    "source_url": (
        "https://consumeraffairs.nic.in/"
    ),
    "published_at": date(2011, 3, 31),
    "effective_from": date(2011, 4, 1),
}


def _insert_rule(
    db: Session,
    regulation_id: int,
    rule_data: dict,
    source: dict,
) -> None:
    """Insert a single rule with its conditions, checks, and source."""
    rule = RuleVersion(
        regulation_id=regulation_id,
        rule_code=rule_data["rule_code"],
        rule_number=rule_data["rule_number"],
        version=rule_data["version"],
        title=rule_data["title"],
        requirement=rule_data["requirement"],
        effective_from=rule_data["effective_from"],
        effective_to=None,
        status="active",
        approval_status="approved",
    )

    db.add(rule)
    db.flush()

    for condition_data in rule_data["conditions"]:
        db.add(
            RuleCondition(
                rule_version_id=rule.id,
                **condition_data,
            )
        )

    for check_data in rule_data["checks"]:
        db.add(
            RuleCheck(
                rule_version_id=rule.id,
                **check_data,
            )
        )

    db.add(
        RuleSource(
            rule_version_id=rule.id,
            **source,
        )
    )


def _ensure_rules(
    db: Session,
    regulation_id: int,
) -> int:
    """
    Idempotent: insert any rule from _RULES whose rule_code is not yet
    present for this regulation.  Returns the count of newly inserted rules.
    """
    existing_codes = set(
        db.scalars(
            select(RuleVersion.rule_code).where(
                RuleVersion.regulation_id == regulation_id
            )
        ).all()
    )

    inserted = 0

    for rule_data in _RULES:
        if rule_data["rule_code"] not in existing_codes:
            _insert_rule(
                db,
                regulation_id,
                rule_data,
                _RULE_SOURCE,
            )
            inserted += 1

    if inserted:
        db.commit()

    return inserted


def seed_legal_metrology_rules(db: Session) -> Regulation:
    regulation = db.scalars(
        select(Regulation).where(
            Regulation.code == REGULATION_CODE
        )
    ).first()

    if regulation is None:
        regulation = Regulation(
            code=REGULATION_CODE,
            name="Legal Metrology (Packaged Commodities) Rules, 2011",
            jurisdiction="India",
            authority="Department of Consumer Affairs",
            description=(
                "Versioned rule repository for packaged commodity "
                "declarations, presentation and compliance checks."
            ),
            status="active",
        )

        db.add(regulation)
        db.flush()

    # Always call _ensure_rules — it is idempotent and will insert any rule
    # missing from the database (e.g. LG-BATCH added after initial seeding).
    _ensure_rules(db, regulation.id)

    db.refresh(regulation)
    return regulation
