# Error Handling Guidelines

API responses adhere to standard HTTP status codes:
- `400 Bad Request`: Payload validation failure or missing mandatory parameters.
- `401 Unauthorized`: Missing, expired, or invalid authorization bearer token.
- `403 Forbidden`: Authenticated user lacks sufficient permissions.
- `404 Not Found`: Requested resource does not exist.
- `500 Internal Error`: Unhandled server exception with redacted stack traces in production.
