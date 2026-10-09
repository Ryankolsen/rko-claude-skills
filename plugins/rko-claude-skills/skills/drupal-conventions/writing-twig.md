# Writing Twig Templates

**Twig = presentation only. Logic → preprocess.**

Templates may show/hide, iterate, and set classes. Everything else — data extraction, field access, fallback logic, formatting, variable preparation — belongs in a preprocess hook in the theme's `.theme` file (or a module's `.module`).

Why this line exists: templates can't be unit tested, and logic in a template silently produces the wrong cache contexts — the page gets cached under a variation the template's branching doesn't account for, and the wrong variant is served.

## Rules

1. **Render complete fields.** Never drill into `content.field_foo[0]['#markup']` — it bypasses the render pipeline's cache metadata and field access checks. Output `{{ content.field_foo }}`.

2. **Use `|without` when excluding fields.** `{{ content|without('body') }}` renders everything else while preserving cache metadata. Printing fields one at a time to "leave one out" drops the metadata that wasn't printed.

3. **Never use `|raw`.** It disables autoescaping → XSS. Use `{{ content.field_text }}` rather than `{{ node.field_text.value|raw }}` — the rendered field already applies the correct text format and filtering.

4. **No logic in templates.** Move it to preprocess, and declare what the logic varies on:
   ```php
   $variables['#cache']['contexts'][] = 'user.roles';
   ```

5. **Isolate includes.** Pass what the partial needs, nothing else:
   ```twig
   {{ include('mytheme:card', { heading: title }, with_context = false) }}
   ```
   Without `with_context = false`, every parent variable leaks into the partial — the partial starts depending on caller internals and breaks when reused elsewhere.

6. **Use the Attribute object.** `{{ attributes.addClass(['node', 'node--' ~ bundle|clean_class]) }}`. Building the attribute string by hand discards classes, `data-` attributes, and settings other modules added.

7. **Bubble entity cache tags.** Reading entity values directly (`node.field_image.entity.uri.value`) skips the render pipeline, so the referenced entity's cache tags never bubble up — the page goes stale when that entity changes. Render the field first so the tags attach:
   ```twig
   {% set _c = content.field_image|render %}
   ```
   Better: do the work in preprocess and `addCacheableDependency()` the referenced entity.

## Preprocess pattern

Prepare in PHP, print in Twig.

```php
function mytheme_preprocess_node(array &$variables): void {
  $node = $variables['node'];
  $variables['has_media'] = !$node->get('field_image')->isEmpty();
}
```

```twig
{% if has_media %}
  {{ content.field_image }}
{% endif %}
```

Keep preprocess hooks thin too — extract anything non-trivial into a named service method or static helper so it can be unit tested. See [SKILL.md](SKILL.md) for the testable-code and caching rules this builds on.

## Before you finish

- [ ] No `|raw`
- [ ] No `[0]['#markup']` or other index drilling into render arrays
- [ ] Field exclusions use `|without`
- [ ] Conditionals depend on preprocess-set variables, not field internals
- [ ] Includes pass `with_context = false`
- [ ] Classes go through `attributes.addClass()`
- [ ] Any directly-accessed entity value has its field rendered or its cache dependency added
- [ ] Markup is accessible — WCAG AA (semantic elements, heading order, alt text, label associations)
