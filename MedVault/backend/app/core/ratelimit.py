from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

# Keyed by client IP. Brute-forcing a login means guessing thousands of
# passwords per minute - a 10/minute ceiling makes that impractical
# while a human retrying a typo never notices.
# Disabled in the test environment: tests hammer auth endpoints by design.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=get_settings().environment != "test",
)

AUTH_LIMIT = "10/minute"
