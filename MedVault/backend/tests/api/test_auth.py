class TestAuth:
    async def test_register_login_me(self, client):
        r = await client.post(
            "/api/v1/auth/register",
            json={"email": "a@test.com", "password": "supersecret1"},
        )
        assert r.status_code == 201
        assert r.json()["role"] == "user"

        r = await client.post(
            "/api/v1/auth/login",
            json={"email": "a@test.com", "password": "supersecret1"},
        )
        assert r.status_code == 200
        token = r.json()["access_token"]

        r = await client.get(
            "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert r.status_code == 200
        assert r.json()["email"] == "a@test.com"

    async def test_duplicate_email_conflict(self, client):
        body = {"email": "dup@test.com", "password": "supersecret1"}
        await client.post("/api/v1/auth/register", json=body)
        r = await client.post("/api/v1/auth/register", json=body)
        assert r.status_code == 409

    async def test_wrong_password_unauthorized(self, client, user):
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": user["email"], "password": "WRONG-PASSWORD"},
        )
        assert r.status_code == 401

    async def test_me_requires_token(self, client):
        r = await client.get("/api/v1/users/me")
        assert r.status_code == 401

    async def test_refresh_rotates_and_burns(self, client, user):
        old_refresh = user["tokens"]["refresh_token"]
        r = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
        assert r.status_code == 200
        assert r.json()["refresh_token"] != old_refresh

        r = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
        assert r.status_code == 401

    async def test_short_password_rejected(self, client):
        r = await client.post(
            "/api/v1/auth/register", json={"email": "x@test.com", "password": "short"}
        )
        assert r.status_code == 422
