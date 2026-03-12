"""
ルールベーススコアリング (0〜100点)

テクニカル (50点):
  - RSI 30〜70適正範囲 → 20点
  - MA50 > MA200 (ゴールデンクロス) → 15点
  - 出来高増加傾向 → 15点

ファンダメンタル (50点):
  - PER 業種平均以下 → 20点
  - PBR 1.0以下 → 15点
  - ROE 10%以上 → 15点
"""

from typing import Optional


def calculate_rsi(closes: list[float], period: int = 14) -> Optional[float]:
    if len(closes) < period + 1:
        return None
    gains, losses = [], []
    for i in range(1, len(closes)):
        delta = closes[i] - closes[i - 1]
        gains.append(max(delta, 0))
        losses.append(max(-delta, 0))

    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def score_stock(
    rsi: Optional[float],
    ma50: Optional[float],
    ma200: Optional[float],
    volume_trend: Optional[float],
    pe_ratio: Optional[float],
    pb_ratio: Optional[float],
    roe: Optional[float],
) -> dict:
    score = 0
    breakdown = {}

    # --- テクニカル ---
    # RSI: 30〜70が適正。40〜60は満点、30〜40/60〜70は半点
    if rsi is not None:
        if 40 <= rsi <= 60:
            pts = 20
        elif 30 <= rsi <= 70:
            pts = 10
        else:
            pts = 0
        score += pts
        breakdown["rsi"] = {"value": rsi, "score": pts, "max": 20}
    else:
        breakdown["rsi"] = {"value": None, "score": 0, "max": 20}

    # MA50 > MA200 (ゴールデンクロス)
    if ma50 is not None and ma200 is not None:
        pts = 15 if ma50 > ma200 else 0
        score += pts
        breakdown["golden_cross"] = {"value": ma50 > ma200, "score": pts, "max": 15}
    else:
        breakdown["golden_cross"] = {"value": None, "score": 0, "max": 15}

    # 出来高トレンド: +10%以上増加で満点、増加傾向で半点
    if volume_trend is not None:
        if volume_trend >= 0.10:
            pts = 15
        elif volume_trend >= 0:
            pts = 8
        else:
            pts = 0
        score += pts
        breakdown["volume_trend"] = {"value": round(volume_trend * 100, 1), "score": pts, "max": 15}
    else:
        breakdown["volume_trend"] = {"value": None, "score": 0, "max": 15}

    # --- ファンダメンタル ---
    # PER: 0〜15満点、15〜25半点、それ以外0点（負は除外）
    if pe_ratio is not None and pe_ratio > 0:
        if pe_ratio <= 15:
            pts = 20
        elif pe_ratio <= 25:
            pts = 10
        else:
            pts = 0
        score += pts
        breakdown["per"] = {"value": round(pe_ratio, 2), "score": pts, "max": 20}
    else:
        breakdown["per"] = {"value": pe_ratio, "score": 0, "max": 20}

    # PBR: 1.0以下満点、1.0〜2.0半点
    if pb_ratio is not None and pb_ratio > 0:
        if pb_ratio <= 1.0:
            pts = 15
        elif pb_ratio <= 2.0:
            pts = 8
        else:
            pts = 0
        score += pts
        breakdown["pbr"] = {"value": round(pb_ratio, 2), "score": pts, "max": 15}
    else:
        breakdown["pbr"] = {"value": pb_ratio, "score": 0, "max": 15}

    # ROE: 20%以上満点、10〜20%半点
    if roe is not None:
        roe_pct = roe * 100 if abs(roe) < 10 else roe  # 小数/パーセント両対応
        if roe_pct >= 20:
            pts = 15
        elif roe_pct >= 10:
            pts = 8
        else:
            pts = 0
        score += pts
        breakdown["roe"] = {"value": round(roe_pct, 2), "score": pts, "max": 15}
    else:
        breakdown["roe"] = {"value": None, "score": 0, "max": 15}

    return {"total": score, "max": 100, "breakdown": breakdown}
