from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.regulation import Regulation
from app.models.rule_version import RuleVersion


def create_regulation(
    db: Session,
    data: dict,
) -> Regulation:
    regulation = Regulation(**data)

    db.add(regulation)
    db.commit()
    db.refresh(regulation)

    return regulation


def get_regulation(
    db: Session,
    regulation_code: str,
) -> Regulation | None:
    statement = (
        select(Regulation)
        .where(
            Regulation.code == regulation_code
        )
        .limit(1)
    )

    return db.scalars(statement).first()


def create_rule_version(
    db: Session,
    data: dict,
) -> RuleVersion:
    rule = RuleVersion(**data)

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


def get_rule_version(
    db: Session,
    regulation_id: int,
    rule_code: str,
    version: int,
) -> RuleVersion | None:
    statement = (
        select(RuleVersion)
        .where(
            RuleVersion.regulation_id == regulation_id,
            RuleVersion.rule_code == rule_code,
            RuleVersion.version == version,
        )
        .limit(1)
    )

    return db.scalars(statement).first()


def get_active_rule_versions(
    db: Session,
    regulation_id: int,
    inspection_date: date,
) -> list[RuleVersion]:
    statement = (
        select(RuleVersion)
        .where(
            RuleVersion.regulation_id == regulation_id,
            RuleVersion.status == "active",
            RuleVersion.approval_status == "approved",
            RuleVersion.effective_from <= inspection_date,
            (
                RuleVersion.effective_to.is_(None)
                | (RuleVersion.effective_to >= inspection_date)
            ),
        )
        .order_by(
            RuleVersion.rule_number.asc(),
            RuleVersion.rule_code.asc(),
        )
    )

    return list(db.scalars(statement).all())


def get_all_rule_versions(
    db: Session,
    regulation_id: int,
) -> list[RuleVersion]:
    statement = (
        select(RuleVersion)
        .where(
            RuleVersion.regulation_id == regulation_id
        )
        .order_by(
            RuleVersion.rule_number.asc(),
            RuleVersion.version.asc(),
        )
    )

    return list(db.scalars(statement).all())
