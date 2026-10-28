# Web accessibility (WCAG 2.2 AA)

The web rules for the `accessibility` skill. Cite the success criterion (SC) on every finding.

- **Semantic elements over div-with-handlers.** A clickable `div` or `span` should be a `button` or `a` (4.1.2, 2.1.1). A link navigates; a button acts.
- **Headings and landmarks.** Heading levels do not skip or encode styling; page regions use `header`, `nav`, `main`, `footer` or equivalent landmarks (1.3.1, 2.4.6).
- **Forms.** Every input has an associated label (`for`/`id`, wrapping, or `aria-labelledby`), not placeholder alone (1.3.1, 3.3.2). Personal-data fields carry the right `autocomplete` (1.3.5). Error text names the field and says what is wrong, and is tied to the input (3.3.1, 3.3.3).
- **Images.** Informative images have alt text that says what the image is for; decorative ones have `alt=""` (1.1.1). Icon-only controls get a name from text, `aria-label` or visually hidden text (4.1.2).
- **ARIA.**
  - First rule: use a native element when one exists.
  - No redundant role on a native element (`<button role="button">`), and no demand for `aria-*` on a native element that is already correctly labelled. Redundant ARIA is worse than none.
  - Never `aria-hidden="true"` on focusable content, or on an ancestor of it (4.1.2).
  - A role requires its states and properties (`checkbox` needs `aria-checked`, `combobox` needs `aria-expanded`).
  - `aria-labelledby` and `aria-describedby` must point at ids that exist.
  - Status messages use a live region or `role="status"`/`alert` (4.1.3).
- **Keyboard and focus.** `tabindex` above 0 is a finding (2.4.3). `outline: none` without a visible replacement hides focus (2.4.7). A sticky header or banner must not hide the focused element (2.4.11). No keyboard trap (2.1.2). Pointer-only handlers (`onmouseover`, drag) need a keyboard path (2.1.1, 2.5.7).
- **Motion.** Animation and transition added in CSS or JS respects `prefers-reduced-motion`; autoplay, scrolling or blinking content over five seconds can be paused (2.2.2). Reduced motion itself is 2.3.3, which is AAA — report it at medium confidence.
- **Contrast.** 4.5:1 for text, 3:1 for large text (1.4.3) and for UI components and meaningful graphics (1.4.11). Only a finding when both colours resolve.
- **Reflow and size.** Fixed pixel widths or `user-scalable=no` that block zoom (1.4.4, 1.4.10). Target size 24x24 CSS px minimum (2.5.8).
- **Client-side routing.** A route change that does not reload the page leaves focus where it was and announces nothing. After navigation, move focus to the new view's heading or main region and update `document.title`, or announce the change in a live region (2.4.3, 4.1.3). A router change that adds routes without this is a finding; a skip link is not a substitute.
- **JSX.** The same rules hold under their JSX spellings — `htmlFor`, `className`, and `aria-*` kept hyphenated. `onClick` on a `div` is still a clickable `div`.
- **Language and title.** A page declares `lang` (3.1.1) and has a descriptive `title` (2.4.2).
