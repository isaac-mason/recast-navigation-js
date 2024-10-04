---
'recast-navigation': minor
---

feat: remove 'three' entrypoint from 'recast-navigation/three'

To make way for adding other integration packages without bloating the `recast-navigation` package, the `recast-navigation/three` entrypoint has been removed.

If you are importing from `recast-navigation/three`, simply install and import from `@recast/navigation-three` instead.
