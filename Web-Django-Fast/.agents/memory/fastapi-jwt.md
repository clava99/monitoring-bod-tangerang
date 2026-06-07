---
name: FastAPI JWT and bcrypt quirks
description: JWT sub must be string; bcrypt must be used directly (not passlib) in Python 3.11
---

## JWT sub field

python-jose raises `JWTClaimsError: Subject must be a string.` if `sub` is an integer.

**Rule:** Always convert user ID to string: `create_access_token({"sub": str(user.id)})`  
When decoding: `user_id = int(payload.get("sub"))`

**Why:** RFC 7519 requires sub to be a string; python-jose enforces this strictly.

## bcrypt vs passlib

passlib with bcrypt >= 4.0 raises `ValueError: password cannot be longer than 72 bytes` during backend detection (an internal test passlib runs).

**Rule:** Use bcrypt directly, NOT passlib CryptContext:
```python
import bcrypt
def verify_password(plain, hashed): return bcrypt.checkpw(plain.encode(), hashed.encode())
def get_password_hash(pw): return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
```

**Why:** passlib's bcrypt backend detection runs a 73-byte test string which newer bcrypt rejects.
