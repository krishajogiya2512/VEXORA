# Risk Scoring Model & Weights

| Metric | Weight | Description |
|---|---|---|
| Account Age | 20% | Newly created profiles have higher suspicion flags. |
| Follower Ratio | 25% | Skewed follower-to-following proportions indicate bot activity. |
| Bio Completeness | 15% | Missing profile details and default avatar. |
| Activity Pattern | 40% | Repetitive content cadence, burst posting, or zero interactions. |

## Risk Tier Thresholds
- **0 - 29**: Low Risk (Normal user profile characteristics)
- **30 - 59**: Medium Risk (Certain flags present, requires review)
- **60 - 79**: High Risk (Multiple automated behavior indicators detected)
- **80 - 100**: Critical Risk (Strong probability of bot or fraudulent account)
