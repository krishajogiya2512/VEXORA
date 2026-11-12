# Project Code Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Environment and DB connectors
│   │   ├── controllers/   # Request/response handlers
│   │   ├── middleware/    # Auth, validation, rate limiting
│   │   ├── models/        # Mongoose schema definitions
│   │   ├── routes/        # Express API route endpoints
│   │   └── services/      # Business & detection logic
└── frontend/              # Electron & React user interface
```

## Module Conventions
- Use async/await for asynchronous database operations.
- Centralize error responses through custom middleware.
- Encapsulate detection heuristics within dedicated service modules.
