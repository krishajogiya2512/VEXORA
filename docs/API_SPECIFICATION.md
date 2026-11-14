# API Specification

### Authentication Endpoints
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate credentials and retrieve JWT.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Profile Analysis Endpoints
- `POST /api/detection/analyze` - Submit a profile for real-time risk assessment.
- `GET /api/detection/history` - Retrieve previously evaluated profile reports.

### Response Format Example
```json
{
  "success": true,
  "data": {
    "profileId": "654c123...",
    "riskScore": 72,
    "riskLevel": "High Risk",
    "indicators": ["unusual_ratio", "default_avatar"]
  }
}
```
