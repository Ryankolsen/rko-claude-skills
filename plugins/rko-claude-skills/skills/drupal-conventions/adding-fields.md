# Adding a Field to a Bundle

> Commands below use `ddev`. Use the `envPrefix` that `detect-stack` reported instead — `lando`, or none when it was `null`.

`{entity}` = entity type machine name, singular (`node`, `taxonomy_term`, `media`, …). `{bundle}` = bundle machine name.
Copy a sibling field's YAML and retarget `id:` / `bundle:` — don't hand-author.

If the entity type comes from a contrib/custom module, check how its bundles and displays are named before copying (`ls config/*/core.entity_view_display.{entity}.{bundle}.*.yml`) and never edit that module's code to suit one field.

## Where files go

Check whether this repo uses config split:
```
fd -t f 'config_split\.config_split\..*\.yml' config/
```

- **No `config_split.*` files found** → put everything in the repo's single
  config sync directory (commonly `config/sync/` or `config/default/`).
- **Config split is in use** → default to the base/shared directory
  (e.g. `config/base/`). Only move a file to a site-specific directory
  (`config/{site}/`) if that site truly renders the bundle differently, and
  in that case **also** add the file name to that site's
  `config_split.config_split.{site}.yml` `complete_list:` — without that
  entry the file won't import. Before assuming site-specific, sanity-check
  whether the bundle's displays are already split:
  ```
  rg 'entity_(form|view)_display\.{entity}\.{bundle}' config/*/config_split.config_split.*.yml
  ```

## Checklist

For `field_foo` on `{bundle}`:

- [ ] `field.storage.{entity}.field_foo.yml` — **only if new storage**; reuse
      existing storage when the field already exists on another bundle
- [ ] `field.field.{entity}.{bundle}.field_foo.yml` — instance
- [ ] `core.entity_form_display.{entity}.{bundle}.default.yml` — widget + dep
- [ ] **Every** `core.entity_view_display.{entity}.{bundle}.*.yml` — add dep
      and either render under `content:` or list under `hidden:`. Miss one
      and the field silently won't appear there.
- [ ] If config split is in use, mirror the change in any site-specific
      override directory that already carries a version of the file
- [ ] `rg 'field_foo' docroot/modules/custom` — adding an instance can turn
      on dormant form alters / preprocess logic

Find all displays for a bundle:
```
ls config/base/core.entity_{form,view}_display.{entity}.{bundle}.*.yml
```

## Pattern — copy, don't compose

1. Find a sibling field of the same type/cardinality on the same (or peer)
   bundle. For an entity reference to taxonomy terms: `field.field.node.article.field_tags.yml`.
2. Copy its storage (if needed), instance, and every display entry.
3. Retarget `id:`, `bundle:`, `field_name:`, `label:`.
4. Mirror its render/hide decision in each display mode.

## Project-specific bits

- **Omit `uuid:`** in new files. Never copy a UUID from a sibling.
- **Storage is shared across bundles.** Don't change cardinality / target_type
  on existing storage to suit one bundle; create a new field instead.
- **Translatable convention:** storage `translatable: true`, instance
  `translatable: false`. Mirror the peer.

## Post-steps

```
ddev drush cim -y
ddev drush cr
```


QA: edit form shows the widget, save persists, full view and any listing
modes (teaser / search_result / custom) render or hide as intended, and any
hooks keyed on the field name behave correctly.
