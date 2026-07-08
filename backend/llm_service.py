"""
CreditPulse - LLM Service (Phase 6)
Supports OpenAI, Anthropic, and Google Gemini API.
Set LLM_PROVIDER env var to "openai", "anthropic", or "gemini".
"""

import os
import logging
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
# Support both GEMINI_API_KEY and GEMINI_API_KEY_COMMITTEE (committee-specific key takes priority if set)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY_COMMITTEE", "") or os.getenv("GEMINI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


# ═══════════════════════════════════════════════════════════════════════════
#  LLM CALL WRAPPER
# ═══════════════════════════════════════════════════════════════════════════

def _call_llm(prompt: str, max_tokens: int = 500) -> Optional[str]:
    """
    Call the configured LLM provider. Returns None on failure.
    Gemini is called via REST (httpx) instead of the google-generativeai SDK
    to avoid bundling grpcio/protobuf compiled extensions (~150 MB) on Vercel.
    """
    try:
        if LLM_PROVIDER == "gemini" and GEMINI_API_KEY:
            # Direct REST call — no grpcio/protobuf needed
            import httpx
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": 0.7,
                },
            }
            resp = httpx.post(url, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

        elif LLM_PROVIDER == "openai" and OPENAI_API_KEY:
            import openai
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            resp = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.7,
            )
            return resp.choices[0].message.content.strip()

        elif LLM_PROVIDER == "anthropic" and ANTHROPIC_API_KEY:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            resp = client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.content[0].text.strip()

        else:
            logger.warning(
                f"No API key configured for provider '{LLM_PROVIDER}'. "
                "Using fallback template. Set GEMINI_API_KEY in your .env file."
            )
            return None

    except Exception as e:
        logger.error(f"LLM call failed ({LLM_PROVIDER}): {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════
#  FALLBACK TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════

def _fallback_explanation(data: dict) -> str:
    tier = data.get("risk_tier", "Unknown")
    score = data.get("final_score", "N/A")
    biz = data.get("business_name", "This business")
    sector = data.get("sector", "")
    strength = _identify_strength(data)
    risk = _identify_risk(data)
    return (
        f"{biz} ({sector}) has a CreditPulse score of {score}, placing it in the "
        f"**{tier}** risk tier. "
        f"The strongest area is **{strength}**, indicating solid performance in that dimension. "
        f"The primary risk factor is **{risk}**, which the lender should scrutinize closely. "
        f"Overall, the applicant's alternate data profile suggests "
        f"{'a viable credit candidate worth further diligence' if tier in ['Prime', 'Near-Prime'] else 'elevated risk requiring additional collateral or guarantees'}."
    )


def _fallback_improvement_tips(data: dict) -> str:
    score = data.get("final_score", "N/A")
    risk = _identify_risk(data)
    return (
        f"Hi! Your CreditPulse score is **{score}** - you're making good progress! "
        f"Here are **3 things you can do in the next 90 days** to improve it:\n\n"
        f"1. **File your GST returns on time** - even a few days early makes a big difference to your compliance score.\n"
        f"2. **Maintain a positive cash balance** - try to keep at least 1 month of expenses in your account to avoid overdrafts.\n"
        f"3. **Deposit EPFO contributions by the 15th** - timely PF payments signal a stable, growing business to lenders.\n\n"
        f"Focus on **{risk}** first - it's the area with the most room for quick improvement!"
    )


def _fallback_whatif(data: dict) -> str:
    delta = data.get("delta", 0)
    changed_feature = data.get("changed_feature", "a key metric")
    new_value = data.get("new_value", "")
    direction = "improve" if delta > 0 else "decrease"
    return (
        f"Changing **{changed_feature}** to **{new_value}** would {direction} your score "
        f"by approximately **{abs(delta):.1f} points**. "
        f"{'This improvement would strengthen your credit profile.' if delta > 0 else 'This change would weaken your credit profile.'}"
    )


def _fallback_chat(data: dict, question: str) -> str:
    biz = data.get("business_name", "this applicant")
    return (
        f"Based on the available data for **{biz}**, I can see their CreditPulse score is "
        f"{data.get('final_score', 'N/A')} ({data.get('risk_tier', 'Unknown')} tier). "
        f"For your specific question - '{question}' - I'd recommend reviewing the detailed "
        f"sub-scores for a complete answer. The data I have covers GST compliance, UPI cashflow, "
        f"banking behaviour, and EPFO records for the past 12 months."
    )


def _identify_strength(data: dict) -> str:
    scores = {
        "revenue stability": data.get("revenue_stability_score", 50),
        "cashflow health": data.get("cashflow_health_score", 50),
        "banking discipline": data.get("banking_discipline_score", 50),
        "GST compliance": data.get("compliance_score", 50),
        "employment stability": data.get("employment_stability_score", 50),
    }
    return max(scores, key=scores.get)


def _identify_risk(data: dict) -> str:
    scores = {
        "revenue stability": data.get("revenue_stability_score", 50),
        "cashflow health": data.get("cashflow_health_score", 50),
        "banking discipline": data.get("banking_discipline_score", 50),
        "GST compliance": data.get("compliance_score", 50),
        "employment stability": data.get("employment_stability_score", 50),
    }
    return min(scores, key=scores.get)


# ═══════════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════

def explain_for_loan_officer(data: dict) -> str:
    prompt = f"""You are a credit risk analyst assistant for an Indian bank evaluating MSME loan applications. 
Given the applicant's alternate data metrics below, write a 4-6 sentence plain-English credit narrative. 
Reference specific numbers. Note the single biggest risk factor and the single biggest strength. 
Be concise and professional. Do not invent data not provided.

Business: {data.get('business_name')}, Sector: {data.get('sector')}, Years active: {data.get('years_in_business')}
GST filing delay avg: {data.get('gst_avg_delay_days')} days
UPI inflow volatility: {data.get('upi_inflow_volatility')}
Overdraft days/month: {data.get('aa_avg_overdraft_days')}
EPFO contribution regularity: {data.get('epfo_on_time_pct')}%
Final score: {data.get('final_score')}/100, Risk tier: {data.get('risk_tier')}"""

    result = _call_llm(prompt, max_tokens=400)
    return result if result else _fallback_explanation(data)


def improvement_tips_for_owner(data: dict) -> str:
    prompt = f"""You are a friendly financial coach speaking to a small Indian business owner with no finance background. 
In simple language (no jargon), explain their score in 2 sentences, then give exactly 3 specific, actionable steps 
they can take in the next 90 days to improve their creditworthiness. Be encouraging, not judgmental.
Format each tip as a numbered list starting with a bold action title.

Business: {data.get('business_name')}, Sector: {data.get('sector')}, Years active: {data.get('years_in_business')}
GST filing delay avg: {data.get('gst_avg_delay_days')} days
UPI inflow volatility: {data.get('upi_inflow_volatility')}
Overdraft days/month: {data.get('aa_avg_overdraft_days')}
EPFO contribution regularity: {data.get('epfo_on_time_pct')}%
Final score: {data.get('final_score')}/100, Risk tier: {data.get('risk_tier')}"""

    result = _call_llm(prompt, max_tokens=400)
    return result if result else _fallback_improvement_tips(data)


def whatif_explanation(data: dict) -> str:
    prompt = f"""Given the original feature values and the simulated changes below, briefly state in 2 sentences 
how the credit score would change and why. Be specific about which dimension is affected.

Original features: {data.get('original_features')}
Simulated change: {data.get('changed_feature')} → {data.get('new_value')}
Score delta: {data.get('delta'):+.1f} points"""

    result = _call_llm(prompt, max_tokens=200)
    return result if result else _fallback_whatif(data)


def grounded_chat(applicant_data: dict, question: str) -> str:
    import json
    prompt = f"""You are CreditPulse's AI assistant helping a loan officer analyse an MSME applicant. 
Answer the question using ONLY the provided applicant data. If the answer isn't in the data, say so clearly. 
Never fabricate numbers. Keep the answer concise (2-4 sentences).

Applicant data: {json.dumps(applicant_data, default=str)}

Question: {question}"""

    result = _call_llm(prompt, max_tokens=300)
    return result if result else _fallback_chat(applicant_data, question)


# ═══════════════════════════════════════════════════════════════════════════
#  AI CREDIT COMMITTEE — 4 AGENTS
# ═══════════════════════════════════════════════════════════════════════════

def _committee_fallback(data: dict) -> dict:
    """Generate realistic committee positions without an LLM."""
    biz = data.get("business_name", "This business")
    score = data.get("final_score", 50)
    tier = data.get("risk_tier", "Sub-Prime")
    overdraft = data.get("aa_avg_overdraft_days", 0)
    bounces = data.get("aa_total_emi_bounces", 0)
    delay = data.get("gst_avg_delay_days", 5)
    epfo = data.get("epfo_on_time_pct", 80)
    vol = data.get("upi_inflow_volatility", 0.1)
    rev_score = data.get("revenue_stability_score", 50)
    emp_score = data.get("employment_stability_score", 50)

    risk_concerns = []
    if overdraft > 5:
        risk_concerns.append(f"{overdraft:.0f} overdraft days/month signals liquidity stress")
    if bounces > 2:
        risk_concerns.append(f"{bounces} EMI bounces over 12 months is a significant red flag")
    if delay > 15:
        risk_concerns.append(f"GST filing delays averaging {delay:.0f} days suggest operational disorganisation")
    if vol > 0.3:
        risk_concerns.append(f"cashflow volatility of {vol*100:.0f}% is above our acceptable threshold")
    if not risk_concerns:
        risk_concerns.append("risk indicators are within acceptable ranges, though we must monitor closely")

    growth_positives = []
    if rev_score > 65:
        growth_positives.append(f"revenue stability score of {rev_score:.0f} indicates a business with predictable income")
    if emp_score > 60:
        growth_positives.append(f"employment stability at {emp_score:.0f}/100 shows the business is retaining its workforce")
    if epfo > 85:
        growth_positives.append(f"EPFO contributions on-time {epfo:.0f}% of the time — a hallmark of financially disciplined employers")
    if not growth_positives:
        growth_positives.append("the applicant operates in a sector with near-term growth tailwinds")

    risk_pos = (
        f"I flag significant concerns: {risk_concerns[0]}. "
        f"{'Additionally, ' + risk_concerns[1] + '.' if len(risk_concerns) > 1 else ''} "
        f"With a CreditPulse score of {score:.0f}, I recommend caution — "
        f"{'decline or require substantial collateral' if score < 45 else 'conditional approval with enhanced monitoring'}."
    ).strip()

    growth_pos = (
        f"I see real opportunity here: {growth_positives[0]}. "
        f"{'Furthermore, ' + growth_positives[1] + '.' if len(growth_positives) > 1 else ''} "
        f"The underlying business fundamentals suggest {biz} can service its obligations — "
        f"{'I support approval with standard covenants' if score > 50 else 'a smaller initial facility could mitigate risk while establishing repayment history'}."
    ).strip()

    compliance_pos = (
        f"From a regulatory and fairness standpoint, this applicant's profile is "
        f"{f'consistent with similar {tier} applicants in our portfolio — no bias flags detected' if score > 45 else 'at the lower end of our approval band'}. "
        f"GST compliance {'needs attention' if delay > 10 else 'is satisfactory'}. "
        f"I recommend the decision be documented with explicit reference to the quantitative thresholds used, "
        f"ensuring auditability under RBI MSME lending guidelines."
    ).strip()

    if score >= 65:
        chair_decision = (
            f"The committee is largely aligned. The Growth Officer's optimism is well-supported by the data, "
            f"and the Risk Officer's concerns — while valid — are within manageable bounds for this tier. "
            f"The Compliance Officer confirms no procedural issues. "
            f"**Final recommendation: APPROVE** with standard monitoring covenants. "
            f"CreditPulse score {score:.0f} ({tier}) warrants a facility at standard pricing."
        )
    elif score >= 45:
        chair_decision = (
            f"The committee is split. The Risk Officer raises legitimate concerns about "
            f"{'liquidity discipline' if overdraft > 5 else 'cashflow volatility'}, "
            f"while the Growth Officer points to positive indicators in revenue and employment trends. "
            f"The Compliance Officer notes no regulatory barriers. "
            f"**Final recommendation: CONDITIONAL APPROVAL** — reduced facility (60-70% of requested amount), "
            f"quarterly review covenant, and GST filing compliance as a condition precedent."
        )
    else:
        chair_decision = (
            f"The Risk Officer's position carries the most weight here given the multiple concurrent stress signals. "
            f"While the Growth Officer sees sector potential, the current financial hygiene at {score:.0f}/100 "
            f"does not meet our minimum threshold. The Compliance Officer confirms the decline is defensible. "
            f"**Final recommendation: DECLINE** at this time. "
            f"We recommend the applicant engage our financial coaching service and reapply in 6 months."
        )

    return {
        "risk_officer": risk_pos,
        "growth_officer": growth_pos,
        "compliance_officer": compliance_pos,
        "chair_decision": chair_decision,
    }


def credit_committee(data: dict) -> dict:
    """
    Convene an AI Credit Committee of 4 specialized agents.
    Returns positions from Risk Officer, Growth Officer, Compliance Officer,
    and a final Chair's decision noting any disagreements.
    """
    import json

    applicant_summary = f"""
Business: {data.get('business_name')}, Sector: {data.get('sector')}, Region: {data.get('region')}
Years active: {data.get('years_in_business')} | Entity: {data.get('entity_type')}
CreditPulse Score: {data.get('final_score')}/100 | Risk Tier: {data.get('risk_tier')}
Revenue Stability: {data.get('revenue_stability_score', 50):.0f}/100
Cashflow Health: {data.get('cashflow_health_score', 50):.0f}/100
Banking Discipline: {data.get('banking_discipline_score', 50):.0f}/100
GST Compliance: {data.get('compliance_score', 50):.0f}/100
Employment Stability: {data.get('employment_stability_score', 50):.0f}/100
GST Avg Filing Delay: {data.get('gst_avg_delay_days', 'N/A')} days
UPI Cashflow Volatility: {data.get('upi_inflow_volatility', 'N/A')}
Avg Overdraft Days/Month: {data.get('aa_avg_overdraft_days', 'N/A')}
EMI Bounces (12m): {data.get('aa_total_emi_bounces', 'N/A')}
EPFO On-Time Contributions: {data.get('epfo_on_time_pct', 'N/A')}%
UPI Avg Monthly Inflow: Rs {data.get('upi_avg_inflow', 'N/A')}
""".strip()

    risk_prompt = f"""You are the Risk Officer on a bank's AI credit committee reviewing an MSME loan applicant.
State your position in 2-3 sentences from your role's perspective. Focus on red flags: overdraft days, EMI bounces, filing delays, cashflow volatility, anomaly signals. Be direct and argue your role's priority — you don't need to be balanced.

Applicant Data:
{applicant_summary}

Your position (2-3 sentences only):"""

    growth_prompt = f"""You are the Growth Officer on a bank's AI credit committee reviewing an MSME loan applicant.
State your position in 2-3 sentences from your role's perspective. Focus on upside: revenue trend, employment growth, sector momentum, inflow volumes, peer benchmarking. Be direct and argue your role's priority — you don't need to be balanced.

Applicant Data:
{applicant_summary}

Your position (2-3 sentences only):"""

    compliance_prompt = f"""You are the Compliance Officer on a bank's AI credit committee reviewing an MSME loan applicant.
State your position in 2-3 sentences from your role's perspective. Focus on: consistency with similar applicants, any bias flags, regulatory defensibility under RBI MSME guidelines, auditability of the decision. Be direct and argue your role's priority.

Applicant Data:
{applicant_summary}

Your position (2-3 sentences only):"""

    # ── Fire all 3 specialist agents CONCURRENTLY ─────────────────────────
    specialist_prompts = {
        "risk_officer": (risk_prompt, 180),
        "growth_officer": (growth_prompt, 180),
        "compliance_officer": (compliance_prompt, 180),
    }

    specialist_results = {}
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_map = {
            executor.submit(_call_llm, prompt, tokens): key
            for key, (prompt, tokens) in specialist_prompts.items()
        }
        for future in as_completed(future_map):
            key = future_map[future]
            try:
                specialist_results[key] = future.result()
            except Exception as exc:
                logger.error(f"Specialist {key} raised: {exc}")
                specialist_results[key] = None

    # Fall back to templates for any failed specialist
    fallback = _committee_fallback(data)
    risk_pos = specialist_results.get("risk_officer") or fallback["risk_officer"]
    growth_pos = specialist_results.get("growth_officer") or fallback["growth_officer"]
    compliance_pos = specialist_results.get("compliance_officer") or fallback["compliance_officer"]

    chair_prompt = f"""You are the Chair of a bank's AI credit committee. Given the three committee members' positions below, write a 3-4 sentence final recommendation. Explicitly name any disagreement between members and explain why you're siding with one view or proposing a middle path (e.g., approve with conditions). End with a clear APPROVE / CONDITIONAL APPROVE / DECLINE recommendation.

Applicant Score: {data.get('final_score')}/100 ({data.get('risk_tier')} tier)

Risk Officer said: {risk_pos}

Growth Officer said: {growth_pos}

Compliance Officer said: {compliance_pos}

Chair's final decision (3-4 sentences, end with explicit APPROVE/CONDITIONAL APPROVE/DECLINE):"""

    chair_pos = _call_llm(chair_prompt, max_tokens=250)
    chair_pos = chair_pos or fallback["chair_decision"]

    return {
        "risk_officer": risk_pos,
        "growth_officer": growth_pos,
        "compliance_officer": compliance_pos,
        "chair_decision": chair_pos,
    }

