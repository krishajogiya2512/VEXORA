# Authentication & Authorization Architecture

- Authentication relies on JSON Web Tokens (JWT) signed with HMAC SHA-256.
- Access tokens expire after 24 hours.
- Sensitive passwords are never stored in plaintext; salt rounds default to 10.
- Protected endpoints require an `Authorization: Bearer <token>` header.
