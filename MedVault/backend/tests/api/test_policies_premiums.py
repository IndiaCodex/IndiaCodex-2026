from tests.conftest import ADA, TEST_WALLET


class TestPoliciesAndPremiums:
    async def test_enroll_creates_commitment(self, client, active_policy):
        policy = active_policy["policy"]
        assert policy["commitment_hash"].startswith("0x")
        assert policy["status"] == "active"

    async def test_plan_creation_requires_admin(self, client, user):
        r = await client.post(
            "/api/v1/plans",
            json={"name": "Nope", "coverage_lovelace": 1, "premium_lovelace": 1},
            headers=user["headers"],
        )
        assert r.status_code == 403

    async def test_underpaid_deposit_rejected(self, client, active_policy):
        r = await client.post(
            "/api/v1/premiums/deposit",
            json={
                "policy_id": active_policy["policy"]["id"],
                "tx_hash": f"mocktx:{TEST_WALLET}:{1 * ADA}",
            },
            headers=active_policy["headers"],
        )
        assert r.status_code == 400

    async def test_deposit_from_unowned_wallet_rejected(self, client, active_policy):
        r = await client.post(
            "/api/v1/premiums/deposit",
            json={
                "policy_id": active_policy["policy"]["id"],
                "tx_hash": f"mocktx:addr_test1qattacker:{45 * ADA}",
            },
            headers=active_policy["headers"],
        )
        assert r.status_code == 400

    async def test_deposit_replay_rejected(self, client, active_policy):
        tx = f"mocktx:{TEST_WALLET}:{45 * ADA}"
        # the fixture already used this exact hash for activation
        r = await client.post(
            "/api/v1/premiums/deposit",
            json={"policy_id": active_policy["policy"]["id"], "tx_hash": tx},
            headers=active_policy["headers"],
        )
        assert r.status_code == 409
