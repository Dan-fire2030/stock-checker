"""
スコアリングロジックのユニットテスト
services/screener.py の calculate_rsi と score_stock を検証する
"""

import pytest
from services.screener import calculate_rsi, score_stock


# ===== calculate_rsi =====

class TestCalculateRsi:
    def test_returns_none_when_not_enough_data(self):
        """データが14件以下の場合はNoneを返す"""
        closes = [100.0] * 14  # period=14 → 15件必要
        assert calculate_rsi(closes) is None

    def test_returns_none_for_empty_list(self):
        assert calculate_rsi([]) is None

    def test_returns_none_for_single_value(self):
        assert calculate_rsi([100.0]) is None

    def test_returns_100_when_all_gains(self):
        """全て上昇の場合はRSI=100"""
        closes = [float(i) for i in range(1, 17)]  # 16件、全て上昇
        result = calculate_rsi(closes)
        assert result == 100.0

    def test_returns_0_when_all_losses(self):
        """全て下落の場合はRSI≒0"""
        closes = [float(16 - i) for i in range(16)]  # 16件、全て下落
        result = calculate_rsi(closes)
        assert result is not None
        assert result == 0.0

    def test_returns_valid_range(self):
        """RSIは0〜100の範囲に収まる"""
        closes = [100, 102, 101, 103, 102, 104, 103, 105, 104, 106,
                  105, 107, 104, 106, 105, 107]
        result = calculate_rsi(closes)
        assert result is not None
        assert 0 <= result <= 100

    def test_minimum_data_length(self):
        """ちょうど15件（period+1）でも計算できる"""
        closes = [float(i % 3) * 10 + 100 for i in range(15)]
        result = calculate_rsi(closes)
        assert result is not None

    def test_returns_float(self):
        """結果はfloat型"""
        closes = [100 + i * 0.5 for i in range(20)]
        result = calculate_rsi(closes)
        assert isinstance(result, float)

    @pytest.mark.parametrize("period", [7, 14, 21])
    def test_custom_period(self, period):
        """カスタム期間でも動作する"""
        closes = [float(i) for i in range(period + 5)]
        result = calculate_rsi(closes, period=period)
        assert result is not None


# ===== score_stock =====

class TestScoreStock:
    def test_all_none_returns_zero(self):
        """全指標がNoneの場合、スコア0"""
        result = score_stock(None, None, None, None, None, None, None)
        assert result["total"] == 0
        assert result["max"] == 100

    def test_max_is_always_100(self):
        """maxは常に100"""
        result = score_stock(50, 200, 180, 0.15, 12, 0.8, 0.25)
        assert result["max"] == 100

    def test_perfect_score(self):
        """全指標が最良の値 → 100点"""
        result = score_stock(
            rsi=50,           # 40〜60 → 20点
            ma50=220,         # ma50 > ma200 → 15点
            ma200=200,
            volume_trend=0.15, # >= 0.10 → 15点
            pe_ratio=12,      # <= 15 → 20点
            pb_ratio=0.8,     # <= 1.0 → 15点
            roe=0.25,         # 25% → 15点
        )
        assert result["total"] == 100

    def test_zero_score(self):
        """全指標が最悪の値 → 0点"""
        result = score_stock(
            rsi=20,           # < 30 → 0点
            ma50=180,         # ma50 < ma200 → 0点
            ma200=200,
            volume_trend=-0.05, # 負 → 0点
            pe_ratio=30,      # > 25 → 0点
            pb_ratio=3.0,     # > 2.0 → 0点
            roe=-0.05,        # 負 → 0点
        )
        assert result["total"] == 0

    # --- RSIテスト ---

    @pytest.mark.parametrize("rsi,expected_score", [
        (50, 20),   # 40〜60 → 満点
        (40, 20),   # 境界値（満点）
        (60, 20),   # 境界値（満点）
        (35, 10),   # 30〜40 → 半点
        (65, 10),   # 60〜70 → 半点
        (30, 10),   # 境界値（半点）
        (70, 10),   # 境界値（半点）
        (25, 0),    # < 30 → 0点
        (75, 0),    # > 70 → 0点
    ])
    def test_rsi_scoring(self, rsi, expected_score):
        result = score_stock(rsi, None, None, None, None, None, None)
        assert result["breakdown"]["rsi"]["score"] == expected_score

    def test_rsi_none_gives_zero(self):
        result = score_stock(None, None, None, None, None, None, None)
        assert result["breakdown"]["rsi"]["score"] == 0
        assert result["breakdown"]["rsi"]["value"] is None

    # --- ゴールデンクロステスト ---

    def test_golden_cross_true(self):
        """MA50 > MA200 → 15点"""
        result = score_stock(None, 210, 200, None, None, None, None)
        assert result["breakdown"]["golden_cross"]["score"] == 15
        assert result["breakdown"]["golden_cross"]["value"] is True

    def test_golden_cross_false(self):
        """MA50 < MA200 → 0点"""
        result = score_stock(None, 190, 200, None, None, None, None)
        assert result["breakdown"]["golden_cross"]["score"] == 0
        assert result["breakdown"]["golden_cross"]["value"] is False

    def test_golden_cross_none_when_missing(self):
        """どちらかがNone → 0点"""
        result = score_stock(None, 210, None, None, None, None, None)
        assert result["breakdown"]["golden_cross"]["score"] == 0
        assert result["breakdown"]["golden_cross"]["value"] is None

    # --- 出来高トレンドテスト ---

    @pytest.mark.parametrize("volume_trend,expected_score", [
        (0.15, 15),   # >= 10% → 満点
        (0.10, 15),   # ちょうど10% → 満点
        (0.05, 8),    # 0〜10% → 半点
        (0.0, 8),     # ちょうど0% → 半点
        (-0.01, 0),   # 負 → 0点
    ])
    def test_volume_trend_scoring(self, volume_trend, expected_score):
        result = score_stock(None, None, None, volume_trend, None, None, None)
        assert result["breakdown"]["volume_trend"]["score"] == expected_score

    # --- PERテスト ---

    @pytest.mark.parametrize("pe_ratio,expected_score", [
        (10, 20),   # <= 15 → 満点
        (15, 20),   # 境界値
        (20, 10),   # 15〜25 → 半点
        (25, 10),   # 境界値
        (30, 0),    # > 25 → 0点
        (-5, 0),    # 負は除外 → 0点
    ])
    def test_per_scoring(self, pe_ratio, expected_score):
        result = score_stock(None, None, None, None, pe_ratio, None, None)
        assert result["breakdown"]["per"]["score"] == expected_score

    def test_per_none_gives_zero(self):
        result = score_stock(None, None, None, None, None, None, None)
        assert result["breakdown"]["per"]["score"] == 0

    # --- PBRテスト ---

    @pytest.mark.parametrize("pb_ratio,expected_score", [
        (0.8, 15),   # <= 1.0 → 満点
        (1.0, 15),   # 境界値
        (1.5, 8),    # 1.0〜2.0 → 半点
        (2.0, 8),    # 境界値
        (2.5, 0),    # > 2.0 → 0点
        (-1.0, 0),   # 負は除外
    ])
    def test_pbr_scoring(self, pb_ratio, expected_score):
        result = score_stock(None, None, None, None, None, pb_ratio, None)
        assert result["breakdown"]["pbr"]["score"] == expected_score

    # --- ROEテスト ---

    @pytest.mark.parametrize("roe,expected_score", [
        (0.25, 15),   # 25% (小数) → 満点
        (25.0, 15),   # 25% (パーセント) → 満点
        (0.20, 15),   # 20% (境界) → 満点
        (0.15, 8),    # 15% → 半点
        (0.10, 8),    # 10% (境界) → 半点
        (0.05, 0),    # 5% → 0点
        (-0.05, 0),   # 負 → 0点
    ])
    def test_roe_scoring(self, roe, expected_score):
        result = score_stock(None, None, None, None, None, None, roe)
        assert result["breakdown"]["roe"]["score"] == expected_score

    # --- ブレークダウン構造テスト ---

    def test_breakdown_has_all_keys(self):
        """ブレークダウンに全6指標が含まれる"""
        result = score_stock(50, 200, 180, 0.05, 15, 1.0, 0.15)
        expected_keys = {"rsi", "golden_cross", "volume_trend", "per", "pbr", "roe"}
        assert set(result["breakdown"].keys()) == expected_keys

    def test_breakdown_item_structure(self):
        """各ブレークダウン項目がvalue/score/maxを持つ"""
        result = score_stock(50, 200, 180, 0.05, 15, 1.0, 0.15)
        for key, item in result["breakdown"].items():
            assert "value" in item, f"{key} に value がない"
            assert "score" in item, f"{key} に score がない"
            assert "max" in item, f"{key} に max がない"

    def test_total_equals_sum_of_breakdown(self):
        """total は各ブレークダウンのスコアの合計"""
        result = score_stock(50, 200, 180, 0.05, 15, 1.0, 0.15)
        breakdown_sum = sum(item["score"] for item in result["breakdown"].values())
        assert result["total"] == breakdown_sum
