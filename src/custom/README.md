# Custom Page Overrides

This folder contains custom page components that override the standard templates.

## Structure

```
src/custom/
  ├── grewal/
  │   └── VanitaPage.jsx      # Custom page for grewal.apna.family/vanita
  └── wong/
      └── LandingPage.jsx     # Custom landing page for wong.apna.family
```

## How It Works

1. **Standard pages** use templates in `src/templates/`
2. **Custom pages** go in `src/custom/{familyId}/` and are registered in `src/overrideRegistry.js`
3. **Router logic** checks the registry first, falls back to template if no override exists

## Examples

- `grewal.apna.family/baljit` → Uses `MemorialProfile` template (no override)
- `grewal.apna.family/vanita` → Uses custom `VanitaPage.jsx` (registered in overrideRegistry)
- `grewal.apna.family` → Uses `FamilyPortal` template (no override)
- `wong.apna.family` → Uses custom `LandingPage.jsx` (registered in overrideRegistry)
- `wong.apna.family/steve` → Uses `MemorialProfile` template (no override)

## Adding a Custom Page

1. Create your custom component in `src/custom/{familyId}/{ComponentName}.jsx`
2. Import it in `src/overrideRegistry.js`
3. Add it to the appropriate section (families or people)
4. The router will automatically use it instead of the template
