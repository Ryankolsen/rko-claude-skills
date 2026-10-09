---
name: project-guide
description: This repository's stack guide — it is a Drupal site; routes Drupal work to drupal-conventions and states this site's own commands and constraints. Invoked by generic skills and agents before they plan, build, or review.
disable-model-invocation: false
---

# Project guide

This is a **Drupal** site. Before planning, building, or reviewing anything,
invoke the `drupal-conventions` skill and follow it — its procedures table says
what to read for fields, Views, Twig and preprocess, and contrib patches.

## This site

<!-- Fill in from what this repository actually does. Delete any line that does not apply. -->

- **Environment prefix:** `{ddev | lando | none}` — prefix Drush and Composer commands with it.
- **Code style:** `{command}` before committing PHP.
- **Static analysis:** `{command}` before a PR.
- **Frontend build:** `{command}`. Never install or build frontend dependencies by hand; compiled assets are not committed.
- **Config layout:** `{config/sync | config/base + config-split per site}`.
- **Multisite:** `{yes — list the sites | no}`.
- **Accessibility bar:** `{WCAG AA}`.
