from tests.conftest import ADA


class TestPool:
    async def test_status_is_public(self, client):
        r = await client.get("/api/v1/pool/status")
        assert r.status_code == 200
        assert r.json()["total_pool_lovelace"] == 0

    async def test_premium_fills_pool(self, client, active_policy):
        s = (await client.get("/api/v1/pool/status")).json()
        assert s["total_pool_lovelace"] == 45 * ADA
        assert s["liquid_lovelace"] == 45 * ADA

    async def test_allocation_cap_enforced(self, client, active_policy, admin):
        r = await client.post(
            "/api/v1/pool/allocations",
            json={"strategy": "Lending", "amount_lovelace": 40 * ADA},  # 88% > cap
            headers=admin["headers"],
        )
        assert r.status_code == 400
        assert r.json()["error"]["code"] == "allocation_cap_exceeded"

        r = await client.post(
            "/api/v1/pool/allocations",
            json={"strategy": "Lending", "amount_lovelace": 30 * ADA},  # 66%
            headers=admin["headers"],
        )
        assert r.status_code == 201

    async def test_payout_blocked_without_liquidity(self, client, active_policy, admin):
        ah = admin["headers"]
        await client.post(
            "/api/v1/pool/allocations",
            json={"strategy": "Lending", "amount_lovelace": 35 * ADA},
            headers=ah,
        )
        claim = (
            await client.post(
                "/api/v1/claims",
                json={
                    "policy_id": active_policy["policy"]["id"],
                    "amount_lovelace": 20 * ADA,  # only 10 liquid
                    "proof_payload": {"commitment": active_policy["policy"]["commitment_hash"]},
                },
                headers=active_policy["headers"],
            )
        ).json()
        await client.post(f"/api/v1/claims/{claim['id']}/approve", headers=ah)
        r = await client.post(f"/api/v1/claims/{claim['id']}/payout", headers=ah)
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "insufficient_liquidity"

    async def test_allocation_requires_admin(self, client, user):
        r = await client.post(
            "/api/v1/pool/allocations",
            json={"strategy": "Lending", "amount_lovelace": 1},
            headers=user["headers"],
        )
        assert r.status_code == 403
