---
'@recast-navigation/core': minor
'recast-navigation': minor
---

feat: remove FinalizationRegistry functionality

This was added to catch situations where `destroy()` is not called to free memory. It's current implementation isn't ideal and it adds a fair amount of complexity to the library, so it's being removed for now.
