---
"@arancini/core": patch
---

feat(System): add support for retrieving singleton components

Adds a protected method `singleton` to the System class, which creates a query for a single component, and sets the property on the system to the given component from the first matching entity.

```ts
class ExampleSystem extends System {
    settings = this.singleton(SettingsComponent)

    // ...
}
```