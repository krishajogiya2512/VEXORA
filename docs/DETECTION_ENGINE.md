# Detection Engine Documentation

The VEXORA Detection Engine evaluates public social media profile attributes against weighted heuristic rules to identify suspicious and automated accounts.

## Evaluation Pipeline
1. Metadata normalization (usernames, bio length, timestamps).
2. Behavioral indicators evaluation (activity cadence, follower-following ratio).
3. Risk aggregate calculation across configured weight tables.
