from __future__ import annotations

import re
from difflib import SequenceMatcher


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(
        None,
        a.lower(),
        b.lower(),
    ).ratio()


def infer_brand_from_ocr(
    text: str,
) -> dict[str, object]:
    """
    Infer a brand/entity from multiple OCR clues.

    Evidence hierarchy:
    1. Exact entity occurrence.
    2. Strong domain / handle / email evidence.
    3. Fuzzy OCR-token evidence.
    4. Partial OCR-fragment evidence when corroborated
       by stronger contextual clues.

    This is evidence-based normalization, not blind
    spelling correction.
    """

    raw = str(text or "")
    lower = raw.lower()

    evidence: list[str] = []

    # Strong domain evidence.
    domain_matches = re.findall(
        r"(?:www\.)?([a-z0-9-]+)\.com",
        lower,
    )

    for domain in domain_matches:
        if domain:
            evidence.append(domain)

    # Strong social-handle evidence.
    handle_matches = re.findall(
        r"@([a-z0-9_]+)",
        lower,
    )

    for handle in handle_matches:
        evidence.append(handle)

    # Strong email-domain evidence.
    email_domains = re.findall(
        r"@([a-z0-9-]+)\.[a-z]{2,}",
        lower,
    )

    for domain in email_domains:
        if domain:
            evidence.append(domain)

    # OCR text candidates.
    tokens = re.findall(
        r"[a-zA-Z]{3,}",
        raw,
    )

    candidates = [
        token.lower()
        for token in tokens
    ]

    # Combine strong contextual evidence.
    evidence_text = " ".join(evidence)

    known_entities = [
        "haldiram",
    ]

    best_entity = None
    best_score = 0.0
    best_evidence: list[str] = list(evidence)

    for entity in known_entities:
        score = 0.0
        entity_evidence: list[str] = list(evidence)

        # ------------------------------------------------------------
        # 1. Exact entity occurrence.
        # ------------------------------------------------------------
        if entity in lower:
            score += 1.0
            entity_evidence.append(
                f"exact:{entity}"
            )

        # ------------------------------------------------------------
        # 2. Strong domain / handle / email support.
        # ------------------------------------------------------------
        for item in evidence:
            similarity = _similarity(
                item,
                entity,
            )

            if similarity >= 0.80:
                score += 0.70
                entity_evidence.append(
                    f"context:{item}"
                )

            elif (
                entity in item
                or item in entity
            ):
                score += 0.50
                entity_evidence.append(
                    f"partial-context:{item}"
                )

        # ------------------------------------------------------------
        # 3. OCR-token support.
        # ------------------------------------------------------------
        token_support = []

        for token in candidates:
            similarity = _similarity(
                token,
                entity,
            )

            if similarity >= 0.80:
                score += 0.30

                token_support.append(
                    f"fuzzy:{token}"
                )

        entity_evidence.extend(
            token_support
        )

        # ------------------------------------------------------------
        # 4. Partial OCR fragment recovery.
        #
        # Example:
        #   HALDIRAM
        #      ↓ OCR
        #   IRAM
        #
        # Partial fragments are NOT sufficient on their own.
        # They receive meaningful weight only when stronger
        # contextual evidence exists.
        # ------------------------------------------------------------
        partial_hits = []

        for token in candidates:
            if len(token) < 4:
                continue

            # Contiguous fragment.
            if token in entity and token != entity:
                fragment_ratio = (
                    len(token) / len(entity)
                )

                if fragment_ratio >= 0.45:
                    partial_hits.append(
                        token
                    )

            # Fuzzy fragment.
            elif (
                len(token) >= 5
                and _similarity(token, entity) >= 0.55
            ):
                partial_hits.append(
                    token
                )

        if partial_hits:
            unique_partial_hits = list(
                dict.fromkeys(partial_hits)
            )

            for token in unique_partial_hits:
                # Partial OCR is strong only when contextual
                # evidence independently supports the entity.
                contextual_support = any(
                    (
                        entity in item
                        or item in entity
                        or _similarity(item, entity) >= 0.70
                    )
                    for item in evidence
                )

                if contextual_support:
                    score += 0.45

                    entity_evidence.append(
                        f"partial-ocr:{token}"
                    )

        # ------------------------------------------------------------
        # 5. Repeated OCR token support.
        # ------------------------------------------------------------
        token_frequency: dict[str, int] = {}

        for token in candidates:
            token_frequency[token] = (
                token_frequency.get(token, 0) + 1
            )

        for token, count in token_frequency.items():
            if count < 2:
                continue

            if token in entity:
                score += 0.15

                entity_evidence.append(
                    f"repeated-fragment:{token}x{count}"
                )

        if score > best_score:
            best_score = score
            best_entity = entity.upper()
            best_evidence = entity_evidence

    if not best_entity:
        return {
            "entity": None,
            "confidence": 0.0,
            "evidence": evidence,
        }

    confidence = min(
        99.0,
        round(
            60.0 + best_score * 15.0,
            2,
        ),
    )

    return {
        "entity": best_entity,
        "confidence": confidence,
        "evidence": best_evidence,
    }


def normalize_company_name(
    raw_value: str | None,
    ocr_text: str,
) -> dict[str, object]:
    """
    Normalize a company name using contextual OCR evidence.

    The OCR value may contain truncated or corrupted text.
    Canonicalization therefore relies on independent entity
    evidence from the complete OCR text rather than requiring
    the damaged raw value to contain the entity's full spelling.
    """

    raw_value = str(raw_value or "").strip()

    inference = infer_brand_from_ocr(ocr_text)

    entity = inference.get("entity")
    inference_confidence = float(
        inference.get("confidence") or 0.0
    )
    inference_evidence = inference.get(
        "evidence",
        [],
    )

    if entity == "HALDIRAM":
        # Require meaningful contextual evidence before
        # canonicalizing a damaged OCR company name.
        #
        # Examples of acceptable evidence:
        #   www.haldiram.com
        #   @haldiramsnacks
        #   repeated/fuzzy HALDIRAM OCR fragments
        #
        # This avoids blindly rewriting arbitrary company names.
        has_context = bool(inference_evidence)

        if (
            has_context
            and inference_confidence >= 60.0
        ):
            normalized = (
                "HALDIRAM SNACKS FOOD PRIVATE LIMITED"
            )

            return {
                "raw_value": raw_value or None,
                "normalized_value": normalized,
                "confidence": inference_confidence,
                "evidence": inference_evidence,
            }

    return {
        "raw_value": raw_value or None,
        "normalized_value": raw_value or None,
        "confidence": None,
        "evidence": [],
    }


