# Request Validation Rules

All incoming payloads are strictly validated before hitting controller handlers:
- Usernames: Non-empty, alphanumeric with permissible underscores/periods.
- URLs: Validated protocol (HTTP/HTTPS) and domain format.
- Platform: Supported types (instagram, twitter, facebook).
