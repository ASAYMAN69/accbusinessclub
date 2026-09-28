# Homepage Operator Ledger Design

## Goal

Replace the homepage's current second-section bento grid with Prototype 01, the editorial ledger headed:

> We train operators, not spectators.

The section will preserve the current homepage competency content while adopting the prototype's structure and interaction model.

## Scope

- Replace only the contents of the homepage section with `id="about"`.
- Keep the `about` anchor so existing navigation continues to work.
- Leave `/redesign/` unchanged.
- Remove the current bento-card presentation from this section.
- Keep the six existing competency descriptions: Networking, Leadership, Marketing, Finance, Strategy, and FinTech.

## Structure

The live section will contain:

- A large editorial statement on the left.
- A numbered ledger of six competency rows on the right.
- An outlined `OPERATE` watermark behind the section content.
- A title, row number, competency name, directional marker, and expandable description for each row.

No eyebrow labels, nested cards, or unrelated content will be introduced.

## Interaction

- Desktop hover reveals a row description and accent treatment.
- Keyboard focus reveals the same content and provides a visible focus state.
- Touch interaction toggles a row's expanded description.
- Only one row is expanded at a time.
- Reduced-motion preferences disable decorative transitions while preserving state changes and readability.

## Responsive behavior

- Larger screens use a two-column editorial layout.
- Smaller screens stack the statement above the ledger.
- Ledger rows retain comfortable touch targets.
- Expanded descriptions remain readable without relying on hover.

## Validation

- Verify the homepage still loads all existing scripts and navigation.
- Check that the `about` anchor resolves.
- Run JavaScript syntax validation for any changed script.
- Run whitespace/diff checks.
- Smoke-test the homepage through a local static server.
