# torph-native

Animated text morphing for React Native: a port of [torph](https://github.com/lochie/torph) by Lochie Axon, built on Reanimated.

When the text changes, characters the old and new values share slide to their new places. The rest fade out and in, and numbers roll by place value like an odometer. Use it for button labels (`Continue` → `Confirm`), status lines, counters, balances, and anything else that changes in place.

```tsx
import { TextMorph } from "torph-native";

<TextMorph style={{ fontSize: 17, fontWeight: "600" }}>
  {loading ? "Confirming…" : "Confirm"}
</TextMorph>
```

- **Same engine as torph.** The segmentation and diff code is copied from torph, along with its full test corpus, so `torph-native` decides what morphs into what exactly the way torph does on the web.
- **Runs on the UI thread.** Every glyph is driven by Reanimated shared values. Nothing animates through React state.
- **No first-frame jump.** Positions are calculated from measured glyph widths before anything renders. Nothing is measured after the fact and corrected later.
- **Interruptible.** If the value changes mid-morph, every glyph retargets from where it is on screen. Characters on their way out that come back reverse their exit.
- **Handles reduced motion.** When the OS asks for reduced motion, the text crossfades with no movement.

---

## Installation

```sh
npm install torph-native
# or
pnpm add torph-native
# or
yarn add torph-native
```

`torph-native` has no native code of its own. It needs these peer dependencies, which most apps already have:

| Peer | Version |
| --- | --- |
| `react` | ≥ 18 |
| `react-native` | ≥ 0.74 |
| `react-native-reanimated` | ≥ 3.6 (developed against 4.x) |

If Reanimated isn't set up yet, follow its [installation guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started). On Reanimated 4 that means also installing `react-native-worklets` and adding its Babel plugin. In Expo:

```sh
npx expo install react-native-reanimated react-native-worklets
```

---

## Usage

### Text

```tsx
import { useState } from "react";
import { Pressable } from "react-native";
import { TextMorph } from "torph-native";

const LABELS = ["Continue", "Confirm", "Confirmed"];

export function StepButton() {
  const [step, setStep] = useState(0);

  return (
    <Pressable onPress={() => setStep((s) => (s + 1) % LABELS.length)}>
      <TextMorph style={{ color: "white", fontSize: 17, fontWeight: "600" }}>
        {LABELS[step]}
      </TextMorph>
    </Pressable>
  );
}
```

`style` takes the usual text props: font, size, weight, color, letter spacing, line height, `textAlign`. Margins, backgrounds and anything else about the box itself go in `containerStyle`.

### Numbers

Words that contain numbers morph by place value. Digits slide vertically, and the symbols around them (currency signs, separators, signs, suffixes) move with the place they belong to. This is on by default.

```tsx
// 1,204 → 1,318 rolls the hundreds and tens and leaves the thousands alone
<TextMorph style={styles.balance}>{`$${total.toLocaleString("en")}`}</TextMorph>
```

If you pass a number instead of a string, it's formatted for you using `locale` and `decimals`:

```tsx
<TextMorph decimals={2} locale="de-DE">
  {1234.5}
</TextMorph>
// → 1.234,50
```

Pass `numbers={false}` to use the character-level text morph for numbers too.

> Use `fontVariant: ["tabular-nums"]` for numbers that change often, so each digit keeps the same width as the value changes.

### Editable fields

Place-value matching suits values that change on their own, like counters, totals and readouts. It's wrong for a field someone is typing into: typing `1` in front of `20` should insert a digit, not renumber every place. Pass the caret position as `cursorIndex` to match by position instead:

```tsx
const [value, setValue] = useState("");
const [caret, setCaret] = useState<number>();

<TextInput
  value={value}
  onChangeText={setValue}
  onSelectionChange={(e) => setCaret(e.nativeEvent.selection.end)}
/>
<TextMorph cursorIndex={caret}>{value}</TextMorph>
```

`cursorIndex` only applies when the value contains exactly one number.

### Springs

Pass spring parameters as `ease` for physics-based motion. A spring keeps its velocity when a morph is interrupted, which suits values that change quickly.

```tsx
<TextMorph ease={{ stiffness: 220, damping: 24 }}>{status}</TextMorph>
```

| Parameter | Default | |
| --- | --- | --- |
| `stiffness` | `100` | Spring stiffness |
| `damping` | `10` | Damping coefficient |
| `mass` | `1` | Mass |
| `precision` | `0.001` | How close to rest counts as settled |

A spring sets its own duration. `torph-native` works out how long the spring takes to settle and times the fades from that.

### Custom easing

Any Reanimated easing works:

```tsx
import { Easing } from "react-native-reanimated";

<TextMorph duration={260} ease={Easing.bezier(0.23, 1, 0.32, 1)}>
  {label}
</TextMorph>
```

The default is torph's curve, `Easing.bezier(0.19, 1, 0.22, 1)`, over 400 ms: a strong ease-out, so motion starts the moment the value changes. For labels that change many times in a session, consider dropping `duration` to 200–300 ms.

### Multi-line text

Newlines in the value start new lines, and words keep their identity when they move from one line to another. `textAlign` (`left`, `center` or `right`) aligns each line within the widest one.

```tsx
<TextMorph style={{ fontSize: 20, textAlign: "center" }}>
  {"Swap approved\nWaiting for confirmation"}
</TextMorph>
```

Like torph, the text never wraps on its own: a line break exists only where the value contains one.

---

## API

### `<TextMorph>`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string \| number` | — | The value to show. |
| `style` | `StyleProp<TextStyle>` | — | Text appearance. `textAlign` sets how lines align. |
| `containerStyle` | `StyleProp<ViewStyle>` | — | Style for the box around the glyphs. Don't set `width` or `height` here: the box sizes itself to the text. |
| `duration` | `number` | `400` | Morph length in ms. Ignored when `ease` is a spring. |
| `ease` | `EasingFunction \| EasingFunctionFactory \| SpringParams` | `Easing.bezier(0.19, 1, 0.22, 1)` | A Reanimated easing or spring parameters. |
| `locale` | `string` | `"en"` | Used for segmentation and number formatting. |
| `decimals` | `number` | — | Number of decimal places when `children` is a number. |
| `numbers` | `boolean` | `true` | Morph numbers by place value. |
| `cursorIndex` | `number` | — | Caret position. Matches characters by position instead of place value. |
| `scale` | `boolean` | `true` | Shrink exiting characters to 0.95 as they fade. |
| `animateSize` | `boolean` | `true` | Animate the box's width and height so surrounding layout doesn't jump. |
| `disabled` | `boolean` | `false` | Render plain text with no animation. |
| `respectReducedMotion` | `boolean` | `true` | Crossfade instead of morphing when the OS asks for reduced motion. |
| `allowFontScaling` | `boolean` | — | Passed to every `Text`. |
| `maxFontSizeMultiplier` | `number` | — | Passed to every `Text`. |
| `onAnimationStart` | `() => void` | — | Called when a morph starts. Not called on the first render. |
| `onAnimationComplete` | `() => void` | — | Called when a morph finishes. |
| `onAnimationCancel` | `() => void` | — | Called when a newer value interrupts a running morph. |
| `testID` | `string` | — | |

### Engine exports

The diff engine is exported too, so you can build another renderer on the same morph logic (for example with Skia or SVG):

```ts
import { segmentText, diffSegments, planFrame, layoutSegments } from "torph-native";

const before = segmentText("Continue", "en");
const { segments, splits } = diffSegments(before, "Confirm", "en");
// Same ID = same glyph: slide it. New ID = enter. Missing ID = exit.
```

`planFrame` takes the previous frame, the new segments and a function that measures a string's width. For every glyph it returns its phase (`initial`, `persist`, `enter` or `exit`), its start and end positions, and its group if it moves with a run. It has no dependency on React Native.

---

## How it works

Each change goes through four stages.

1. **Segment.** The value is split into segments: graphemes for a single word, words for anything with spaces, and characters for numbers. Each segment gets a stable ID.
2. **Diff** (copied from torph). A longest-common-subsequence pass pairs up words that survive the change, including words that moved. Unmatched words that share at least 40% of their characters are paired, and that pair is cut into characters so the shared letters keep their IDs. Numbers are matched by place value instead.
3. **Plan** (new in this port). Glyph widths are measured once, with an invisible `Text` per distinct string, and cached by font. Every segment's position is then calculated, so nothing is measured after rendering.
   - **Survivors** move from their old position to their new one.
   - **New glyphs** start at the old position of their nearest survivor and travel with it.
   - **Exiting glyphs** drift with their nearest survivor while they fade.
   - **Runs of six or more replaced glyphs** shrink toward the run's centre and fade as one shape, instead of sliding past each other.
4. **Animate.** Each glyph is an absolutely positioned `Animated.View` with shared values for position, slide, scale and opacity. A glyph that mounts starts with its initial values already set, so the first frame is correct. Glyphs that are already mounted retarget from their current values.

| | Movement | Opacity |
| --- | --- | --- |
| Survivor | old → new position | — |
| Entering character | from its nearest survivor's old position, scale 0.95 → 1 | 0 → 1 over 50% of the duration, after a 25% delay |
| Exiting character | drifts with its nearest survivor, scale → 0.95 | → 0 over 25% |
| Entering digit / symbol | slides in from above (digits) or below (symbols) | 0 → 1 over 25% |
| Exiting digit / symbol | slides down one line | → 0 over 45% |
| Replaced run (≥ 6) | scale 0.8 ↔ 1 about the run's centre | 35% in / 45% out |

The timing shares are torph's. Under reduced motion, nothing moves: the old value fades out over the new one across half the duration.

---

## Differences from torph

| | torph (web) | torph-native |
| --- | --- | --- |
| Rendering | DOM spans plus FLIP: measure, change, measure again, invert | Calculated positions plus shared values; nothing is measured after rendering |
| Springs | Converted to a CSS `linear()` easing | Real Reanimated springs that keep their velocity when interrupted |
| Reduced motion | Turns animation off | Crossfades without movement |
| Splitting characters | UTF-16 units in some paths | Code points everywhere, so emoji stay whole even without `Intl.Segmenter` |
| Framework bindings | React, Vue, Svelte, vanilla | React Native |

---

## Limitations

- **No automatic wrapping.** Lines break only at `\n`, as in torph. Constrain the width of long values yourself.
- **Kerning and ligatures.** Each character is its own `Text`, so kerning between them is lost (torph has the same trade-off). The difference is invisible in most UI fonts. Script fonts and scripts that join their letters, such as Arabic, won't render correctly while split into characters.
- **Left-to-right only.** Right-to-left layout isn't handled yet.
- **Reduced motion is read once.** Reanimated's `useReducedMotion` reads the setting when the component mounts, so a change made while the app is running takes effect on the next mount.
- **`Intl.Segmenter`.** Where Hermes doesn't provide it, segmentation falls back to splitting on spaces and code points. That works for Latin text and emoji, but combined emoji (👨‍👩‍👧) and other multi-code-point graphemes may split. A polyfill such as `@formatjs/intl-segmenter` fixes this.
- **The first frame shows plain text.** Before any glyph has been measured, the value renders as a normal `Text` in the same place, then switches to glyphs once the widths are known. Morphing starts from the second value on.

---

## Development

This is a pnpm workspace.

```
packages/
  torph-native/     the library
    src/core/       segmentation and diff, copied from torph
    src/plan.ts     layout and animation planning (pure, unit tested)
    src/Glyph.tsx   one animated glyph
    src/TextMorph.tsx
    example/App.tsx drop-in demo screen
  test-cases/       torph's shared test corpus
```

```sh
pnpm install
pnpm test        # vitest: torph's suite plus the planner, spring and Hermes-fallback tests
pnpm typecheck
pnpm build       # emits lib/
```

To try it in an app, copy `example/App.tsx` into an Expo app that has Reanimated set up and install this package from a local path (`pnpm add ../torph-rn/packages/torph-native`). Metro reads the TypeScript source through the `react-native` field, so you don't need to build first.

---

## Credits

The segmentation and diff engine and the test corpus come from [torph](https://github.com/lochie/torph) by [Lochie Axon](https://github.com/lochie), MIT licensed. Its license is included in [LICENSE](./LICENSE).

## License

MIT
