from tests.conftest import TEST_WALLET


class TestWallets:
    async def test_link_flow_with_mock_signature(self, client, user):
        h = user["headers"]
        r = await client.post(
            "/api/v1/wallets/challenge", json={"address": TEST_WALLET}, headers=h
        )
        assert r.status_code == 200
        assert r.json()["nonce"].startswith("medivault-link-")

        r = await client.post(
            "/api/v1/wallets/verify",
            json={"address": TEST_WALLET, "signature": f"mock:{TEST_WALLET}", "key": ""},
            headers=h,
        )
        assert r.status_code == 201
        assert r.json()["is_verified"] is True

    async def test_bad_signature_rejected(self, client, user):
        h = user["headers"]
        await client.post(
            "/api/v1/wallets/challenge", json={"address": TEST_WALLET}, headers=h
        )
        r = await client.post(
            "/api/v1/wallets/verify",
            json={"address": TEST_WALLET, "signature": "garbage", "key": ""},
            headers=h,
        )
        assert r.status_code == 401

    async def test_verify_without_challenge_rejected(self, client, user):
        r = await client.post(
            "/api/v1/wallets/verify",
            json={"address": TEST_WALLET, "signature": f"mock:{TEST_WALLET}", "key": ""},
            headers=user["headers"],
        )
        assert r.status_code == 401
