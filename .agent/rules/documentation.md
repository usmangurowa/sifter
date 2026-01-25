---
trigger: always_on
---

# Documentation Guidelines

## Walkthrough Requirements

When completing work and creating a walkthrough, follow these guidelines:

### Major Code Removals

When code is **removed entirely** (not refactored), the walkthrough MUST explicitly document:

1. **What was removed** - Specific functions, files, or features deleted
2. **Why it was removed** - The reasoning behind the decision
3. **What it was replaced with** (if applicable)
4. **Impact** - Behavioral changes and affected functionality

### Example Format

#### Removed Code

cleanupStaleMaps() function

What: Periodic cleanup function that ran every 10 minutes
Why: Maps are naturally bounded (1 entry per unique file)
Impact: None - memory unchanged, fewer background processes