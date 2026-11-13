# Database Schema & Indexing

### Collections
- `users`: Stores user identity, credentials (hashed via bcrypt), and analyst role.
- `profiles`: Caches scraped / submitted social media profile metadata.
- `reports`: Tracks generated risk scores, evidence files, and case details.

### Recommended Indexes
- `users.email` (unique)
- `profiles.platform_handle` (compound)
- `reports.createdAt` (descending for chronological feeds)
