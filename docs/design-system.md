# Pomodoro Visual Direction — Mallow UI

Reference: https://mallow-ui-design-system.dear-raven-5222.chatgpt.site/

## Direction

The Pomodoro interface will use Mallow UI as its visual foundation: warm neutrals, tactile elevation, matte ceramic surfaces and disciplined organic shapes.

The result must feel calm and crafted, but not childish. Timer readability and accessibility remain more important than decoration.

## Core principles

1. **Soft, not childish** — pastel color, firm typography and controlled density.
2. **Depth with function** — elevated elements are interactive; recessed areas contain progress or time.
3. **Organic with discipline** — expressive ambient shapes around a strict 8-point content grid.
4. **Accessible by default** — shadow never communicates state alone; visible focus; AA contrast; 44×44 px minimum targets.

## Tokens

```css
:root {
  --mallow-canvas: #eee8df;
  --mallow-surface: #f8f3ec;
  --mallow-surface-raised: #fffaf3;
  --mallow-ink: #252523;
  --mallow-muted: #716f6a;
  --mallow-mint: #a9cbbf;
  --mallow-aqua: #9fd7df;
  --mallow-sky: #82b9d0;
  --mallow-blush: #efb6bd;
  --mallow-citrus: #d9d985;

  --mallow-radius-sm: 14px;
  --mallow-radius-md: 22px;
  --mallow-radius-lg: 34px;

  --mallow-shadow-raised:
    -8px -8px 18px rgba(255, 255, 255, 0.72),
    10px 14px 24px rgba(114, 96, 75, 0.18),
    inset 1px 1px 1px rgba(255, 255, 255, 0.8);

  --mallow-shadow-pressed:
    inset 5px 6px 10px rgba(128, 109, 87, 0.15),
    inset -4px -4px 8px rgba(255, 255, 255, 0.72);
}
```

## Pomodoro color semantics

- Canvas and surfaces: warm neutral colors
- Focus session: mint
- Short break: aqua
- Long break: sky
- Warning or destructive reset: blush
- Goal achieved or optional highlight: citrus
- Primary text and controls: ink

Color must always be paired with text, icons or shape changes.

## Component mapping

### Timer shell

- Large raised porcelain card
- Maximum radius: 34 px
- Warm neutral canvas
- Clear status label above the time

### Time display

- Recessed surface using the pressed shadow
- Large tabular numerals
- High contrast ink
- Remaining time announced accessibly without excessive screen-reader updates

### Primary control

- Dark ink pill button
- Minimum target: 44×44 px
- Raised at rest, visibly pressed on activation
- Text changes with the state: Start, Pause or Resume

### Secondary controls

- Porcelain raised buttons
- Reset uses blush only as a small warning cue
- Keyboard focus uses a visible outline, not shadow alone

### Session selector

- Segmented recessed control
- Active state uses color, weight and a visible indicator
- Labels remain present on mobile

### Progress

- Organic but precise progress ring or bar
- Animation respects reduced-motion preferences
- Numerical or textual alternative remains available

### History and daily summary

- Compact cards using the 8-point grid
- Decoration is reduced to keep data readable
- Mint for success, sky for information and blush only for warnings

## Typography

- Large timer numerals: 64/64 or responsive equivalent
- Page H1: 40/44
- Section H2: 28/34
- Body: 16/26
- Labels: 12/16, uppercase only for short metadata
- Use tabular numerals for the timer

## Layout

### Desktop

- Timer is the dominant first-viewport working surface
- Settings and daily summary remain secondary
- No marketing hero before the timer

### Mobile

- Single-column flow
- Core controls stay visible without horizontal scrolling
- Minimum 16 px page gutter
- No icon-only control without an accessible name

## Motion

- Subtle press, progress and session-transition feedback
- No continuous decorative animation
- Reduced-motion mode removes nonessential movement

## Visual acceptance criteria

- [ ] Tokens are implemented centrally
- [ ] Timer is readable at a glance
- [ ] Interactive elevation is consistent
- [ ] Pressed surfaces are not mistaken for disabled states
- [ ] Keyboard focus is clearly visible
- [ ] All targets are at least 44×44 px
- [ ] Text contrast meets WCAG AA
- [ ] Session states never depend on color alone
- [ ] Layout works on mobile and desktop
- [ ] Reduced-motion preference is respected
