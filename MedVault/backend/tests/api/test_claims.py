from tests.conftest import ADA


class TestClaims:
    async def _submit(self, client, ap, amount=100 * ADA, commitment=None):
        return await client.post(
            "/api/v1/claims",
            json={
                "policy_id": ap["policy"]["id"],
                "amount_lovelace": amount,
                "proof_payload": {
                    "commitment": commitment or ap["policy"]["commitment_hash"]
                },
            },
            headers=ap["headers"],
        )

    async def test_valid_claim_is_proof_verified(self, client, active_policy):
        r = await self._submit(client, active_policy)
        assert r.status_code == 201
        assert r.json()["status"] == "proof_verified"
        assert r.json()["claim_reference"].startswith("CLM-")

    async def test_invalid_proof_rejected(self, client, active_policy):
        r = await self._submit(client, active_policy, commitment="0xwrong")
        assert r.status_code == 422

    async def test_over_coverage_rejected(self, client, active_policy):
        r = await self._submit(client, active_policy, amount=999_999_999 * ADA)
        assert r.status_code == 400

    async def test_yearly_limit_enforced(self, client, active_policy):
        assert (await self._submit(client, active_policy)).status_code == 201
        assert (await self._submit(client, active_policy)).status_code == 201
        r = await self._submit(client, active_policy)  # plan allows 2/year
        assert r.status_code == 400

    async def test_full_admin_lifecycle(self, client, active_policy, admin):
        claim = (await self._submit(client, active_policy, amount=10 * ADA)).json()

        r = await client.post(f"/api/v1/claims/{claim['id']}/payout", headers=admin["headers"])
        assert r.status_code == 403  # not approved yet

        r = await client.post(f"/api/v1/claims/{claim['id']}/approve", headers=admin["headers"])
        assert r.json()["status"] == "approved"

        r = await client.post(f"/api/v1/claims/{claim['id']}/payout", headers=admin["headers"])
        assert r.json()["status"] == "paid"
        assert r.json()["payout_tx_hash"]

    async def test_admin_endpoints_forbidden_for_users(self, client, active_policy):
        r = await client.get("/api/v1/claims", headers=active_policy["headers"])
        assert r.status_code == 403
