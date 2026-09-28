# Join Now Button Design

## Goal

Make the Join Now call-to-action feel clean and premium while staying inside the ACC Business Club blue and cyan visual language.

## Visual treatment

- Use a deep ACC blue base with a restrained blue-to-cyan internal gradient.
- Add a thin cyan rim and a faint inset top highlight for controlled depth.
- Use a low blue shadow rather than a large glow.
- Keep the label white and readable.
- Keep the hero arrow cyan as the only secondary accent.

## Interaction

- On hover, increase brightness and saturation slightly and lift the button by 1px.
- On press, compress the button subtly.
- Do not use shader canvases, WebGL, glass blur, or external runtime dependencies.

## Implementation boundary

- Preserve the existing HTML structure and links.
- Share the treatment across the desktop navbar, mobile menu, and hero CTA.
- Keep responsive sizing and existing placement unchanged.
- Remove unused MetalFx runtime references related to these buttons.

## Validation

- Confirm the stylesheet remains syntactically balanced.
- Confirm no Join Now page includes the removed runtime script.
- Capture the homepage at desktop width and verify the CTA is visible and legible.
