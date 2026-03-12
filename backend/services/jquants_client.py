import os
import httpx
import time
from datetime import datetime, timedelta

_id_token: str | None = None
_token_expiry: float = 0
_cache: dict = {}
CACHE_TTL = 900  # 15分

JQUANTS_BASE = "https://api.jquants.com/v1"


async def _get_id_token() -> str:
    global _id_token, _token_expiry
    if _id_token and time.time() < _token_expiry:
        return _id_token

    refresh_token = os.getenv("JQUANTS_REFRESH_TOKEN")
    if not refresh_token:
        raise ValueError("JQUANTS_REFRESH_TOKEN が設定されていません")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{JQUANTS_BASE}/token/auth_refresh",
            params={"refreshtoken": refresh_token},
        )
        resp.raise_for_status()
        data = resp.json()
        _id_token = data["idToken"]
        _token_expiry = time.time() + 3600 * 23  # 23時間有効
        return _id_token


async def get_stock_info(code: str) -> dict | None:
    key = f"jp_info:{code}"
    if key in _cache:
        value, ts = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return value

    token = await _get_id_token()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{JQUANTS_BASE}/listed/info",
            params={"code": code},
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        items = data.get("info", [])
        result = items[0] if items else None
        _cache[key] = (result, time.time())
        return result


async def get_daily_quotes(code: str) -> list[dict]:
    key = f"jp_quotes:{code}"
    if key in _cache:
        value, ts = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return value

    token = await _get_id_token()
    date_from = (datetime.now() - timedelta(days=90)).strftime("%Y%m%d")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{JQUANTS_BASE}/prices/daily_quotes",
            params={"code": code, "dateFrom": date_from},
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            return []
        data = resp.json()
        result = data.get("daily_quotes", [])
        _cache[key] = (result, time.time())
        return result
