"""
CreditPulse - Pytest unit tests for the scoring engine (Phase 2).
Run with: pytest tests/test_scoring.py -v
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "ml"))
from scoring_engine import compute_deterministic_score, assign_risk_tier, compute_score


# ─── Bounds tests ──────────────────────────────────────────────────────────

class TestScoreBounds:
    def test_perfect_scores(self):
        s = compute_deterministic_score(100, 100, 100, 100, 100)
        assert s == 100.0

    def test_zero_scores(self):
        s = compute_deterministic_score(0, 0, 0, 0, 0)
        assert s == 0.0

    def test_mid_scores(self):
        s = compute_deterministic_score(50, 50, 50, 50, 50)
        assert abs(s - 50.0) < 0.01

    def test_output_clamped_above(self):
        # Even with over-100 input (shouldn't happen but let's be safe)
        s = compute_deterministic_score(110, 110, 110, 110, 110)
        assert s <= 100.0

    def test_output_clamped_below(self):
        s = compute_deterministic_score(-10, -10, -10, -10, -10)
        assert s >= 0.0

    def test_weights_sum_to_one(self):
        # Verify that equal inputs give equal output regardless of weights
        s = compute_deterministic_score(60, 60, 60, 60, 60)
        assert abs(s - 60.0) < 0.01


# ─── Risk Tier boundary tests ──────────────────────────────────────────────

class TestRiskTierBoundaries:
    @pytest.mark.parametrize("score,expected", [
        (100.0, "Prime"),
        (75.0, "Prime"),
        (74.9, "Near-Prime"),
        (55.0, "Near-Prime"),
        (54.9, "Sub-Prime"),
        (35.0, "Sub-Prime"),
        (34.9, "Decline"),
        (0.0, "Decline"),
    ])
    def test_tier_boundaries(self, score, expected):
        assert assign_risk_tier(score) == expected


# ─── Full compute_score integration tests (without ML) ────────────────────

class TestComputeScore:
    def test_returns_score_result(self):
        result = compute_score(1, 80, 70, 60, 90, 75)
        assert result.applicant_id == 1
        assert 0 <= result.blended_score <= 100
        assert result.risk_tier in ["Prime", "Near-Prime", "Sub-Prime", "Decline"]

    def test_deterministic_score_correct(self):
        result = compute_score(999, 80, 70, 60, 90, 75)
        expected = (0.25*80 + 0.25*70 + 0.20*60 + 0.15*90 + 0.15*75)
        assert abs(result.deterministic_score - expected) < 0.01

    def test_to_dict_has_required_keys(self):
        result = compute_score(2, 50, 50, 50, 50, 50)
        d = result.to_dict()
        required = [
            "applicant_id", "revenue_stability_score", "cashflow_health_score",
            "banking_discipline_score", "compliance_score", "employment_stability_score",
            "deterministic_score", "blended_score", "risk_tier",
        ]
        for k in required:
            assert k in d, f"Missing key: {k}"
