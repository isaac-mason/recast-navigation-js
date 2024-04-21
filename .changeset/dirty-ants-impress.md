---
"recast-navigation": minor
"@recast-navigation/core": minor
---

feat: replace getRandomPointAround with improved findRandomPointAroundCircle

Renamed `getRandomPointAround` to `findRandomPointAroundCircle` to align the naming with the c++ api and other methods.

`findRandomPointAroundCircle` now returns a `success` and `status` property. Previously if the operation was unsuccessful, a zero vector was returned. Now, the `success` property will be `false` and the `status` property will contain a dtStatus describing the reason for failure.
