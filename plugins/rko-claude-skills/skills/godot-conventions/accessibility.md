# Godot Accessibility Mapping

How the generic `accessibility` principles show up in a Godot 4 project. The
principle names are the generic ones; cite a finding by that name. For what is
and is not UI, see "Where UI lives" in [SKILL.md](SKILL.md).

Several rules depend on the engine version — check the version `detect-stack`
reported.

## Focus management

- `focus_mode = FOCUS_NONE` on a button or other interactive control makes it
  unreachable without a pointer. A finding unless another input reaches the
  same action — an InputMap action or hotkey — which is the usual reason a HUD
  button is kept out of focus.
- When a menu, overlay, or dialog becomes visible, something inside it calls
  `grab_focus()`.
- On close, focus returns to the control that opened it.
- Order: `focus_neighbor_*` and `focus_next`/`focus_previous` where the default
  tree order is not the visual order.
- The theme defines a visible focus StyleBox. A theme that sets `focus` to an
  empty StyleBox hides focus entirely.

## Input alternatives

- Use `ui_accept`, `ui_cancel` and other `ui_*` actions, or named InputMap
  actions, rather than raw `InputEventMouseButton` / `InputEventScreenTouch`.
  Actions are what let a player remap controls.
- A touch-only gesture (swipe, drag, pinch) needs a button alternative.
- A modal overlay must absorb non-pointer input too. `mouse_filter = STOP` stops
  pointer events only; gamepad and keyboard still reach gameplay unless the
  input is handled and accepted, or the tree is paused / gameplay `process_mode`
  is set to stop.

## Named controls and Announced state

Godot 4.5 and later exposes UI to screen readers through AccessKit, with
`accessibility_name`, `accessibility_description` and live-region properties.

- On 4.5+: icon-only buttons and `TextureButton`s need a name; a status or
  error that changes needs a live region.
- Below 4.5, or when the version cannot be established: these are **not
  verifiable**, never findings. Do not demand `accessibility_*` properties the
  engine lacks.
- Any version: an icon-only button gets `tooltip_text`, which helps sighted
  pointer users.

## Readable text and Target size

Sizes are in viewport units, not device pixels. Read
`display/window/size/viewport_width` and `viewport_height` and the stretch mode
and aspect in `project.godot` before judging.

- A 22px font on a 480x270 base scaled to a phone is not 22 device px.
- Does the project offer a text-scale option, or scale font sizes through the
  theme? Text that is small *at the scaled size*, with no such option, is a
  **Readable text** finding at medium confidence. A fixed size alone is not.
- Judge touch targets at the scaled size, against about 44pt on device.

## Reduced motion

Screen shake, camera shake, flashes and particle bursts need a setting that
reduces or disables them. Nothing flashes more than three times a second.

## Colour not the sole signal

Health, status, team and rarity shown by colour alone need a shape, icon or
text cue, or a colour-blind palette.

## Time limits and Reading order

- **Time limits:** a timed prompt or auto-dismissing message can be extended or
  turned off.
- **Reading order:** Container child order sets both layout and default focus
  order. A control placed by hand outside a Container, or a `focus_neighbor_*`
  that skips across the screen, can put focus out of visual order. `z_index`
  changes drawing only, never order.

## False positives

- Do not demand AccessKit properties on a version that lacks them.
- Do not flag a fixed font size on its own when the project scales the whole
  viewport. Judge the scaled size, per *Readable text and Target size*.
- A purely decorative TextureRect needs no name.

## Not verifiable from the diff

Runtime focus order, what a screen reader announces, the scaled size on a real
device, and how shake or flashing feels.
