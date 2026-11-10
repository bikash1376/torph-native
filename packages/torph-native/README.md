# torph-native

Morphing UI for React Native, built on Reanimated. It started as a port of [torph](https://github.com/lochie/torph) by Lochie Axon for text, and has grown to cover the rest of the motion in Benji Taylor's [Family Values](https://benji.org/family-values): icons, emoji, trays, charts and layout.

| Import | What it does |
| --- | --- |
| `TextMorph` | Text and numbers that morph letter by letter and digit by digit, and can shrink to fit |
| `IconSwap` | Swaps one icon, emoji or small view for another with a replace transition |
| `MorphTray` | A tray whose height follows its content as it moves from step to step |
| `MorphBox` | A button that grows into a tray and shrinks back |
| `StepIndicator` | Step dashes; the current one stretches |
| `MorphItem` | List and grid items that glide to their new place when the order changes |
| `torph-native/icons` | `IconMorph` (any icon → any icon) plus ten animated icons |
| `torph-native/chart` | `LineChartMorph`: a line that redraws from one dataset into the next |

The icon and chart entry points need `react-native-svg`. Everything else needs only Reanimated.

## TextMorph

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
# only for torph-native/icons and torph-native/chart:
npx expo install react-native-svg
```

| Optional peer | Version | Needed for |
| --- | --- | --- |
| `react-native-svg` | ≥ 15 | `torph-native/icons`, `torph-native/chart` |

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

### Shrink to fit

Amount fields shrink as the number grows. Set `maxWidth` and the whole value scales down to fit. The scale animates along with the morph.

```tsx
<TextMorph maxWidth={320} style={{ fontSize: 60, fontWeight: "700" }}>
  {`$${amount}`}
</TextMorph>
```

### Emoji

Emoji morph like any other character, and multi-code-point emoji stay whole: families (👨‍👩‍👧), skin tones (👍🏽), flags (🇮🇳) and keycaps (1️⃣). This holds even on engines without `Intl.Segmenter`, because `torph-native` has its own grapheme splitter.

```tsx
<TextMorph>{tooMuch ? "Still not enough ETH 😳" : "Not enough ETH"}</TextMorph>
```

---

## Icons and emoji

### `IconSwap`

Swaps one small view for another. The outgoing one scales down and fades while the incoming one springs up from 0.6. It works with icons from any library, emoji, or images, and a swap can be interrupted.

```tsx
import { IconSwap } from "torph-native";

<IconSwap swapKey={muted ? "off" : "on"} variant="scale">
  {muted ? <BellOff /> : <Bell />}
</IconSwap>
```

`variant`: `scale` (default) · `slide-up` · `slide-down` · `rotate`. `duration` sets the outgoing fade (default 180 ms).

### `IconMorph`: any icon into any icon

```tsx
import { IconMorph, circlePath, rectPath } from "torph-native/icons";

<IconMorph d={open ? ["M6 6l12 12", "M18 6L6 18"] : ["M4 6h16", "M4 12h16", "M4 18h16"]} />
```

Give it SVG path data (one `d` string or one per `<path>`) from any icon set: Lucide, Feather, Tabler, Heroicons or your own. Changing `d` morphs the drawing into the new icon. It's written from scratch, with no flubber.

1. Every path is parsed (all SVG commands, including arcs) and flattened.
2. Each stroke is resampled to the same number of points.
3. Each stroke of the old icon is paired with the nearest stroke of the new one.
4. Strokes without a partner grow out of, or shrink into, their own centre.
5. The blend runs on the UI thread.

Icons drawn with `<circle>`, `<rect>` or `<line>` convert to paths with `circlePath`, `rectPath` and `linePath`.

| Prop | Default | |
| --- | --- | --- |
| `d` | — | Path data: a string or an array of strings |
| `size` / `viewBox` | `24` / `24` | Pixel size and the icon set's grid |
| `color`, `strokeWidth` | `#111`, `2` | |
| `filled` | `false` | Fill instead of stroke, for solid icon sets |
| `samples` | `40` | Points per stroke |
| `spring` / `duration` | spring | Uses a timing curve when `duration` is set |

### Animated icons

Ten state-driven icons drawn with `react-native-svg`. Each animates when its prop changes:

| Icon | Prop | Animation |
| --- | --- | --- |
| `LockIcon` | `locked` | The shackle lifts and frees its left leg |
| `ProgressCheck` | `state: "idle" \| "loading" \| "success"`, `badge` | A spinner completes its ring and draws a check. With `badge`, the circle fills like a verified badge |
| `CheckCircle` | `checked` | The circle fills, the check draws in and the icon pops |
| `ChevronIcon` | `direction` | Rotates to point up, down, left or right |
| `PlusCloseIcon` | `open` | + turns 45° into × |
| `StarIcon`, `HeartIcon` | `filled` | Fills with a springy pop |
| `TrashIcon` | `open` | The lid tips open about its left end |
| `SendIcon` | `sendKey` | Flies out to the top right and glides back in |
| `CopyIcon` | `copied` | The copy glyph swaps to a green check |

They all take `size`, `color`, `strokeWidth` and `style`.

---

## Surfaces

### `MorphTray`

A tray whose height follows its content. Change `step` and the tray springs to the new content's height while the old content fades out over the new, so one tray becomes the next instead of a new sheet stacking on top.

```tsx
<MorphTray step={step} style={styles.tray} contentStyle={{ padding: 20 }}>
  {step === "options" ? <Options onPick={setStep} /> : <PrivateKey onBack={() => setStep("options")} />}
</MorphTray>
```

### `MorphBox`

A "Continue" button that grows into the tray it opens, then shrinks back into the button on Cancel. Size, corner radius and colour all move on one spring, and the contents crossfade.

```tsx
<MorphBox
  expanded={open}
  collapsedWidth={width}
  collapsedHeight={52}
  collapsedColor="#fff"
  expandedColor="#1C1C1E"
  collapsed={<Pressable onPress={() => setOpen(true)}><Text>Continue</Text></Pressable>}
>
  <AllowAccess onCancel={() => setOpen(false)} />
</MorphBox>
```

When expanded, the box fills the width available to its wrapper (`style`). Place the wrapper where the box should grow from, for example at the bottom of a `justifyContent: "flex-end"` screen.

### `StepIndicator`

```tsx
<StepIndicator count={5} index={step} />
```

The current step's dash stretches and takes the accent colour.

---

## Data and layout

### `LineChartMorph`

```tsx
import { LineChartMorph } from "torph-native/chart";

<LineChartMorph data={series[range]} width={340} height={150} color={up ? "#16A34A" : "#FF3B30"} />
```

Both series are resampled to the same number of points (`samples`, default 72), so any dataset can reshape into any other. The morph uses a strong ease-in-out over 520 ms, because the line moves in place on screen. A dot marks the latest value. Switching range mid-morph carries on from the line as it is on screen.

### `MorphItem`

```tsx
{tokens.map((t) => (
  <MorphItem key={t.id}>
    <TokenRow token={t} />
  </MorphItem>
))}
```

When the list reorders, regroups or reflows, each item springs to its new place. Added and removed items fade in and out. Give each item a stable `key`.

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
| `maxWidth` | `number` | — | Scale the whole value down to fit this width. The scale animates with the morph. |
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
- **`Intl.Segmenter`.** Where Hermes doesn't provide it, `torph-native` uses its own grapheme splitter. That covers emoji sequences, combining accents and Devanagari signs, but not every Unicode rule. For other complex scripts, add a polyfill such as `@formatjs/intl-segmenter`.
- **`IconMorph` draws polylines.** Each stroke becomes 40 points by default, so very large icons with tight curves may need a higher `samples` value.
- **Not built yet:** moving an element between screens (Family's card and NFT hand-offs). `MorphBox` covers the same-screen version.
- **The first frame shows plain text.** Before any glyph has been measured, the value renders as a normal `Text` in the same place, then switches to glyphs once the widths are known. Morphing starts from the second value on.

---

## Development

This is a pnpm workspace.

```
apps/example/        Expo SDK 58 gallery recreating the Family Values videos
packages/
  torph-native/
    src/core/        segmentation, diff and graphemes (diff copied from torph)
    src/plan.ts      text layout and animation planning (pure, unit tested)
    src/TextMorph.tsx, Glyph.tsx
    src/IconSwap.tsx, MorphTray.tsx, MorphBox.tsx, MorphItem.tsx, StepIndicator.tsx
    src/icons/       IconMorph (+ morph.ts path engine) and the animated icons
    src/chart/       LineChartMorph (+ path.ts helpers)
  test-cases/        torph's shared test corpus
```

```sh
pnpm install
pnpm test        # vitest: torph's suite plus the planner, icon-morph, chart, grapheme and Hermes tests
pnpm typecheck
pnpm build       # emits lib/
```

To try it, run the demo app: `pnpm install`, then `pnpm --filter torph-native-example start`, and scan the QR code with Expo Go (SDK 58). Metro reads the library's TypeScript source through the `react-native` field, so you don't need to build first.

---

## Credits

The segmentation and diff engine and the test corpus come from [torph](https://github.com/lochie/torph) by [Lochie Axon](https://github.com/lochie), MIT licensed. Its license is included in [LICENSE](./LICENSE).

## License

MIT
