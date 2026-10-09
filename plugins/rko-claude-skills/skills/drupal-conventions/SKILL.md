---
name: drupal-conventions
description: Drupal working rules and procedures — adding or removing a field via config YAML, hand-editing a View's YAML, Twig templates and preprocess hooks, patching contrib or core with Composer, cache metadata, and exploring and slicing Drupal work for a plan. Use when building, planning, or reviewing work on a Drupal site, or when a repository's project-guide routes Drupal work here.
domain: drupal-conventions
stack: drupal
disable-model-invocation: false
---

# Drupal Conventions

Rules that hold on any Drupal site. What is particular to one site — the
local-env prefix (`ddev`, `lando`, or none), its code-style and static-analysis
commands, its frontend build, multisite layout, accessibility bar — lives in
that repository's `project-guide` skill, not here.

## Procedures

Read the matching file before touching what it covers — not after, and only
the one the task needs.

| Task | Read |
|------|------|
| Adding, wiring, or removing a field on a bundle | [adding-fields.md](adding-fields.md) |
| Writing or editing a Twig template or preprocess hook | [writing-twig.md](writing-twig.md) |
| Hand-editing a View's YAML | [editing-views.md](editing-views.md) |
| Fixing a bug in contrib, core, or any Composer-installed file | [create-patch.md](create-patch.md) |

## Testable code

Keep hooks thin. Extract logic into named service methods or static helpers.
Inject dependencies via constructor (services) or parameter (helpers).

## Caching

Use the cache metadata APIs — never inline tag strings like
`$build['#cache']['tags'][] = 'node:' . $id`.

- Services: expose `getCacheMetadata(): CacheableMetadata`
- Consumers: `addCacheableDependency($entity)` then `applyTo($build)`
- Blocks: declare tags in `getCacheTags()` via `Cache::mergeTags()`, not only in `build()`

Missing cache tags or contexts are a correctness bug, not a style point: the
wrong variant gets served, or the page goes stale when an entity changes.

## Composer and contrib

Always use Composer — never a deploy script or a Drush plugin command.

| Scenario | Approach |
|----------|----------|
| Packagist / packages.drupal.org | `composer require vendor/pkg` |
| Private Git repo | `vcs` repository entry + `composer require` |
| JS library (no composer.json) | `package` repository entry |

Commit `composer.json` and `composer.lock` together. Never edit a file under
contrib, core, or `vendor/` in place — Composer overwrites it on the next
install. Patch it per [create-patch.md](create-patch.md).

## Config

Site structure is exported config YAML, committed. Copy a sibling's YAML and
retarget it rather than hand-authoring; omit `uuid:` in new files. After a
config change, import and rebuild caches (`drush cim -y`, `drush cr`, with the
project's env prefix). A field, View, or block placement that exists only in a
database is not done.

Before removing a field, find every reference — preprocess, templates, Views,
services, config YAML, migrations — and confirm the removal with the user.

## Field access in code

Check `hasField()` and `isEmpty()` before reading a field. Render arrays keep
their `#` prefixes; hook implementations match the documented signature and
return type.

## Planning Drupal work

When exploring for a PRD or a plan, look at:

- Existing content types, taxonomies, and fields that overlap
- Views and Search API indices that may be affected
- Custom module code (commonly `docroot/modules/custom/` or `web/modules/custom/`)
- Config sync and any config-split directories
- Theme templates and preprocess hooks in the custom theme

Name the building blocks a feature needs, each as new or modified: entity
types and vocabularies, fields and widgets, Views, Search API indices, custom
services, plugins, or hooks, config entities (block placements, menus,
permissions), templates and preprocess hooks.

Slice vertically through those layers. A natural order, to adapt rather than
follow:

1. Content modeling — entity types, vocabularies, fields, form displays
2. Search infrastructure — indices, processors
3. Display logic — Views, blocks, view modes, block placement
4. Theming — preprocess (logic), Twig (presentation), CSS
5. Cleanup or migration — removing old config, moving data
6. Seed content — manual admin work

Say in each slice which config files it creates or modifies, and whether that
config is authored as YAML or made in the Drupal UI and exported.

## Decision checklist

1. Logic in a small, named, testable unit — not in a hook body or a template?
2. Cache metadata declared for everything the output depends on?
3. Accessible to the bar the project sets?
4. Works across every site instance, if the codebase is multisite?
