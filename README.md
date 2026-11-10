# torph-reactnative

Morphing UI components for React Native, built on [Reanimated](https://docs.swmansion.com/react-native-reanimated/).

Text that morphs letter by letter, numbers that roll digit by digit, icons that redraw themselves into other icons, buttons that grow into trays, charts that reshape between ranges, and lists that glide into their new order. Every animation runs on the UI thread and can be interrupted mid-flight.

<!--
  Demo video: open this README in the GitHub editor, drag your screen recording in,
  and replace this comment with the link GitHub generates.
-->

```sh
npm install torph-reactnative
```

**Requires** `react-native-reanimated` (plus `react-native-worklets` on Reanimated 4). `react-native-svg` is needed only for the icons and the chart. No native code of its own, and it works in Expo Go. See [Installation](#installation).

```tsx
import { TextMorph } from "torph-reactnative";

<TextMorph style={{ fontSize: 17, fontWeight: "600" }}>
  {loading ? "Confirming…" : "Confirm"}
</TextMorph>
```

---

## Contents

- [What's inside](#whats-inside)
- [Installation](#installation)
- [TextMorph](#textmorph): text, numbers, typing, wrapping, shrink to fit, emoji
- [IconSwap](#iconswap)
- [IconMorph](#iconmorph): any icon into any icon
- [Animated icons](#animated-icons)
- [MorphBox](#morphbox): button to tray
- [MorphTray](#morphtray)
- [MorphList and MorphItem](#morphlist-and-morphitem): reordering
- [LineChartMorph](#linechartmorph)
- [StepIndicator](#stepindicator)
- [Accessibility and reduced motion](#accessibility-and-reduced-motion)
- [How TextMorph works](#how-textmorph-works)
- [Limitations](#limitations)
- [Example app](#example-app)
- [Credits](#credits)

---

## What's inside

| Import | Component | What it does |
| --- | --- | --- |
| `torph-reactnative` | `TextMorph` | Text that morphs letter by letter. Numbers roll by place value, lines can wrap, and the text can shrink to fit. |
| | `IconSwap` | Swaps one icon, emoji or small view for another with a replace transition. |
| | `MorphBox` | A button that grows into the tray it opens and shrinks back. |
| | `MorphTray` | A tray whose height follows its content from step to step. |
| | `MorphList`, `MorphItem` | Rows and cells that spring to their new place when the order changes. |
| | `StepIndicator` | Step dashes; the current one stretches. |
| `torph-reactnative/icons` | `IconMorph` | Morphs any SVG icon into any other. |
| | 10 animated icons | Lock, progress → check, check circle, chevron, plus ↔ close, star, heart, trash, send, copy. |
| `torph-reactnative/chart` | `LineChartMorph` | A line chart that redraws from one dataset into the next. |

---

## Installation

```sh
npm install torph-reactnative
# or
pnpm add torph-reactnative
# or
yarn add torph-reactnative
```

The package has no native code of its own. It needs:

| Peer dependency | Version | Needed for |
| --- | --- | --- |
| `react` | ≥ 18 | everything |
| `react-native` | ≥ 0.74 | everything |
| `react-native-reanimated` | ≥ 3.6 (built against 4.x) | everything |
| `react-native-worklets` | the version your Reanimated 4 asks for | everything, on Reanimated 4 (not needed on Reanimated 3) |
| `react-native-svg` | ≥ 15 | only `torph-reactnative/icons` and `torph-reactnative/chart` |

With Expo:

```sh
npx expo install react-native-reanimated react-native-worklets react-native-svg
```

Without Expo, follow Reanimated's [installation guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started). On Reanimated 4 that includes `react-native-worklets` and its Babel plugin.

---

## TextMorph

When the text changes, characters shared by the old and new values slide to their new places, and the rest fade out and in. Use it for button labels, status lines, titles, counters and balances.

```tsx
import { TextMorph } from "torph-reactnative";

const LABELS = ["Continue", "Confirm", "Confirming…", "Confirmed"];

<Pressable onPress={next}>
  <TextMorph style={{ color: "white", fontSize: 17, fontWeight: "600" }}>
    {LABELS[step]}
  </TextMorph>
</Pressable>
```

`style` takes the usual text props: font, size, weight, colour, letter spacing, line height and `textAlign`. Margins, backgrounds and anything else about the box go in `containerStyle`.

### Numbers

Words that contain numbers morph by place value. Digits roll vertically, and currency signs, separators and suffixes move with the place they belong to. `1,204` → `1,318` rolls the hundreds and tens and leaves the thousands alone.

```tsx
<TextMorph style={styles.balance}>{`$${total.toLocaleString("en-US")}`}</TextMorph>
```

If you pass a number instead of a string, `locale` and `decimals` format it for you:

```tsx
<TextMorph locale="de-DE" decimals={2}>{1234.5}</TextMorph>  // 1.234,50
```

Use `fontVariant: ["tabular-nums"]` so digits keep the same width as they change. Pass `numbers={false}` to morph numbers letter by letter instead.

### Typing

For text someone is typing, pass the caret position as `cursorIndex`. The morph then follows the caret: a typed digit slides in where it was typed instead of every place value shifting along.

```tsx
const [digits, setDigits] = useState("");
const [caret, setCaret] = useState<number>();

<TextMorph cursorIndex={caret} maxWidth="auto">{`$${format(digits)}`}</TextMorph>
<TextInput
  value={digits}
  onChangeText={setDigits}
  onSelectionChange={(e) => setCaret(e.nativeEvent.selection.end)}
/>
```

If you add commas while the user types, convert the caret from the raw input to the formatted string. The [Typing screen](https://github.com/bikash1376/torph-native/blob/main/apps/example/src/screens/Typing.tsx) in the example app shows how.

### Wrapping

By default, lines break only at `\n`. Add `wrap` to break at spaces so the text fits the width available, like a normal `Text`. Words that move to another line morph there.

```tsx
<TextMorph wrap style={{ fontSize: 22 }}>
  {expanded ? "Your recovery phrase is the key to your wallet" : "Recovery phrase"}
</TextMorph>
```

`wrap` stretches the component across its parent to measure the width, so use it inside column layouts. `textAlign` (`left`, `center` or `right`) aligns each line.

### Shrink to fit

`maxWidth` scales the whole value down to fit, as amount fields do when a number grows. Use a number of pixels, or `"auto"` for the width available. The scale animates with the morph.

```tsx
<TextMorph maxWidth="auto" style={{ fontSize: 64, fontWeight: "700" }}>
  {`$${amount}`}
</TextMorph>
```

### Springs and easing

```tsx
<TextMorph ease={{ stiffness: 220, damping: 22 }}>{status}</TextMorph>                 // spring
<TextMorph duration={260} ease={Easing.bezier(0.23, 1, 0.32, 1)}>{label}</TextMorph>   // curve
```

The default is a strong ease-out, `Easing.bezier(0.19, 1, 0.22, 1)`, over 400 ms. A spring keeps its velocity when interrupted and sets its own duration.

### Emoji

Emoji morph like any other character. Multi-part emoji stay whole, including families (👨‍👩‍👧), skin tones (👍🏽), flags (🇮🇳) and keycaps (1️⃣). This holds even on engines without `Intl.Segmenter`.

```tsx
<TextMorph>{tooMuch ? "Still not enough ETH 😳" : "Not enough ETH"}</TextMorph>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string \| number` | — | The value to show. |
| `style` | `StyleProp<TextStyle>` | — | Text appearance; `textAlign` aligns the lines. |
| `containerStyle` | `StyleProp<ViewStyle>` | — | The box around the glyphs. Don't set its width or height. |
| `wrap` | `boolean` | `false` | Break lines at spaces to fit the available width. |
| `maxWidth` | `number \| "auto"` | — | Shrink to fit this width, or the available width. |
| `duration` | `number` | `400` | Morph length in ms. Ignored for springs. |
| `ease` | Reanimated easing or `{ stiffness, damping, mass }` | strong ease-out | Timing curve or spring. |
| `numbers` | `boolean` | `true` | Morph numbers by place value. |
| `locale` | `string` | `"en"` | Segmentation and number formatting. |
| `decimals` | `number` | — | Decimal places when `children` is a number. |
| `cursorIndex` | `number` | — | Caret position; morphs follow the caret. |
| `scale` | `boolean` | `true` | Shrink leaving characters to 0.95 as they fade. |
| `animateSize` | `boolean` | `true` | Animate the box's size so neighbours don't jump. |
| `disabled` | `boolean` | `false` | Plain text, no animation. |
| `respectReducedMotion` | `boolean` | `true` | Crossfade instead of moving when the OS asks for reduced motion. |
| `onAnimationStart` / `onAnimationComplete` / `onAnimationCancel` | `() => void` | — | Lifecycle callbacks. |
| `allowFontScaling`, `maxFontSizeMultiplier`, `testID` | | | Passed through. |

---

## IconSwap

Swaps one small view for another. The old view shrinks and fades while the new one springs in. It works with icons from any library, emoji and images, and a swap can be interrupted.

```tsx
import { IconSwap } from "torph-reactnative";

<IconSwap swapKey={muted ? "off" : "on"} variant="scale">
  {muted ? <BellOff /> : <Bell />}
</IconSwap>
```

| Prop | Default | |
| --- | --- | --- |
| `swapKey` | — | Identity of the current child. Changing it plays the swap. |
| `variant` | `"scale"` | `scale`, `slide-up`, `slide-down` or `rotate` |
| `duration` | `180` | Length of the outgoing fade in ms. |

---

## IconMorph

Morphs any icon into any other. Give it SVG path data from any icon set (Lucide, Feather, Tabler, Heroicons or your own); changing `d` redraws the old icon into the new one.

```tsx
import { IconMorph } from "torph-reactnative/icons";

const MENU = ["M4 6h16", "M4 12h16", "M4 18h16"];
const CLOSE = ["M6 6l12 12", "M18 6L6 18"];

<IconMorph d={open ? CLOSE : MENU} size={28} />
```

It's written from scratch, with no flubber or GSAP:

1. Every path is parsed (all SVG commands, arcs included) and flattened into points.
2. Each stroke is resampled to the same number of points.
3. Strokes are paired by shape. The pairing tries each stroke forwards, backwards and from every starting point, and keeps the set of pairs that moves least overall.
4. A stroke with no partner shrinks into, or grows out of, its own centre while fading, so nothing is left behind as a dot.
5. Each stroke is blended on the UI thread with its own opacity.

Icons drawn with `<circle>`, `<rect>` or `<line>` convert with `circlePath`, `rectPath` and `linePath`:

```tsx
import { IconMorph, circlePath, rectPath } from "torph-reactnative/icons";

const PAUSE = [rectPath(6.5, 5, 4, 14, 1.2), rectPath(13.5, 5, 4, 14, 1.2)];
const PLAY = ["M8 5.5v13l10.5-6.5z"];

<IconMorph d={playing ? PAUSE : PLAY} />
```

| Prop | Default | |
| --- | --- | --- |
| `d` | — | Path data: one string or one per `<path>`. |
| `size` / `viewBox` | `24` / `24` | Pixel size and the icon set's grid. |
| `color`, `strokeWidth` | `#111`, `2` | |
| `filled` | `false` | Fill instead of stroke, for solid icon sets. |
| `samples` | `40` | Points per stroke. Raise it for large, curvy icons. |
| `spring` / `duration` | spring | A fixed `duration` uses a timing curve instead. |

---

## Animated icons

Ten icons drawn with `react-native-svg`. Each one animates when its prop changes, and they all take `size`, `color`, `strokeWidth` and `style`.

```tsx
import { LockIcon, ProgressCheck, StarIcon } from "torph-reactnative/icons";

<LockIcon locked={!approved} />
<ProgressCheck state={pending ? "loading" : "success"} badge />
<StarIcon filled={starred} />
```

| Icon | Prop | Animation |
| --- | --- | --- |
| `LockIcon` | `locked` | The shackle lifts and frees one leg. |
| `ProgressCheck` | `state: "idle" \| "loading" \| "success"`, `badge` | A spinner completes its ring and draws a check. With `badge`, it fills like a verified badge. |
| `CheckCircle` | `checked` | Fills, draws a check and pops. |
| `ChevronIcon` | `direction` | Turns to point up, down, left or right. |
| `PlusCloseIcon` | `open` | + turns into ×. |
| `StarIcon`, `HeartIcon` | `filled` | Fills with a springy pop. |
| `TrashIcon` | `open` | The lid tips open. |
| `SendIcon` | `sendKey` | Flies out and glides back in. |
| `CopyIcon` | `copied` | Swaps to a green check. |

---

## MorphBox

A button that grows into the tray it opens, then shrinks back into the button. Size, corner radius and colour move together on one spring, and the contents crossfade.

```tsx
import { MorphBox } from "torph-reactnative";

<MorphBox
  expanded={open}
  collapsedWidth={width}
  collapsedHeight={54}
  collapsedColor="#fff"
  expandedColor="#1C1C1E"
  collapsed={
    <Pressable onPress={() => setOpen(true)}>
      <Text>Continue</Text>
    </Pressable>
  }
>
  <ApprovalTray onCancel={() => setOpen(false)} />
</MorphBox>
```

When expanded, the box fills the width of its wrapper (`style`) and grows to the height of its content. Put it where it should grow from, for example at the bottom of a screen laid out with `justifyContent: "flex-end"`.

| Prop | Default | |
| --- | --- | --- |
| `expanded` | — | Show the tray instead of the button. |
| `collapsed` | — | The button's content. |
| `children` | — | The tray's content; its height is measured. |
| `collapsedWidth`, `collapsedHeight` | — | The button's size. |
| `collapsedRadius` / `expandedRadius` | pill / `32` | Corner radius in each state. |
| `collapsedColor` / `expandedColor` | `#fff` / `#fff` | Background in each state. |
| `spring` | firm, no bounce | Reanimated spring config. |

---

## MorphTray

A tray whose height follows its content. When `step` changes, the tray springs to the new content's height while the old content fades out over the new. One tray turns into the next instead of a second sheet stacking on top.

```tsx
import { MorphTray } from "torph-reactnative";

<MorphTray step={step} style={styles.tray} contentStyle={{ padding: 20 }}>
  {step === "options" ? <Options onPick={setStep} /> : <Details onBack={() => setStep("options")} />}
</MorphTray>
```

---

## MorphList and MorphItem

Items spring to their new place when a list or grid reorders, regroups or reflows. Added and removed items fade in and out. Give each item a stable `key`.

```tsx
import { MorphList, MorphItem } from "torph-reactnative";

<MorphList>
  {tokens.map((t) => (
    <MorphItem key={t.id} bounce>
      <TokenRow token={t} />
    </MorphItem>
  ))}
</MorphList>
```

With `bounce`, items settle with a very slight overshoot (about 1.5% of the distance, roughly a pixel per row moved). Lower `damping` for more bounce. Inside a `MorphList`, items landing in the first or last slot glide in without overshooting, because that is where a bounce would leave the list, and the list clips its contents as a safety net. Without `bounce`, every item glides straight to its place.

---

## LineChartMorph

```tsx
import { LineChartMorph } from "torph-reactnative/chart";

<LineChartMorph data={series[range]} width={340} height={200} color={up ? "#16A34A" : "#FF3B30"} />
```

Both datasets are resampled to the same number of points, so any series can reshape into any other. Switching ranges mid-morph carries on from the line as it is on screen. A dot marks the latest value.

| Prop | Default | |
| --- | --- | --- |
| `data` | — | The values. Any length. |
| `width`, `height` | — | Size in pixels. |
| `color`, `strokeWidth` | `#0A84FF`, `2.5` | |
| `samples` | `72` | Points the line is resampled to. |
| `showDot` | `true` | Dot on the last value. |
| `duration`, `easing` | `520`, strong ease-in-out | |

---

## StepIndicator

```tsx
import { StepIndicator } from "torph-reactnative";

<StepIndicator count={5} index={step} />
```

The current step's dash stretches and takes the accent colour. The example app uses it as its page dots.

---

## Accessibility and reduced motion

- `TextMorph` exposes the full value as its accessibility label and hides the individual glyphs from screen readers.
- When the OS asks for reduced motion, `TextMorph` crossfades instead of moving (turn this off with `respectReducedMotion={false}`), and `IconSwap` switches to a plain fade.
- The icons are hidden from screen readers. Label the control that contains them.

---

## How TextMorph works

1. **Segment.** The value is split into words, or into characters for a single word, and each segment gets a stable ID. Numbers are split by place value.
2. **Diff.** This step is the engine from [torph](https://github.com/lochie/torph). A longest-common-subsequence pass keeps words that survive the change, including words that moved. Similar words are then matched letter by letter, so shared letters keep their IDs.
3. **Plan.** Each distinct string is measured once, in the same frame it first appears, and every glyph's position is calculated, including line wrapping. Nothing has to be measured after it renders and corrected later.
4. **Animate.** Each glyph is an absolutely positioned `Animated.View` driven by Reanimated values:
   - glyphs that stay slide to their new place;
   - new glyphs ride in from their nearest neighbour;
   - leaving glyphs drift with that neighbour while they fade;
   - digits roll vertically;
   - a run of six or more replaced characters shrinks away as one shape.

The diff engine is exported (`segmentText`, `diffSegments`, `planFrame`) if you want to build another renderer on it.

---

## Limitations

- Each character is its own `Text`, so kerning between characters is lost (torph has the same trade-off). Scripts that join their letters, such as Arabic, won't render correctly mid-morph, and right-to-left layout isn't handled yet.
- `wrap` and `maxWidth="auto"` stretch the component across its parent to measure it. In row layouts, pass a number to `maxWidth` instead.
- `IconMorph` draws polylines, so very large icons with tight curves may need a higher `samples` value. Two very different icons can tangle a little mid-morph.
- Moving an element from one screen to another isn't covered yet.

---

## Example app

[`apps/example`](https://github.com/bikash1376/torph-native/tree/main/apps/example) is an Expo app with one component per screen. Swipe sideways to move between them:

| Screen | Shows |
| --- | --- |
| Button labels | `TextMorph` and `IconSwap` with `ProgressCheck` |
| Typing | `cursorIndex`, comma regrouping, `maxWidth="auto"` |
| Text morph | Every `TextMorph` option: easing, duration, alignment, wrapping |
| Animated icons | All ten icons |
| Icon morph | `IconMorph` between ten icons |
| Button to tray | `MorphBox` with `LockIcon` and `ProgressCheck` |
| Chart ranges | `LineChartMorph` with a rolling percentage |
| Reorder | `MorphList` with bouncy `MorphItem`s |

```sh
git clone https://github.com/bikash1376/torph-native.git
cd torph-native
pnpm install
pnpm --filter torph-reactnative-example start
```

Then scan the QR code with Expo Go (SDK 58).

### Developing the library

```sh
pnpm test        # vitest: torph's diff suite plus planner, wrap, icon-morph, chart and grapheme tests
pnpm typecheck
pnpm build       # emits packages/torph-native/lib
```

---

## Credits

The text segmentation and diff engine, and its test corpus, come from [torph](https://github.com/lochie/torph) by [Lochie Axon](https://github.com/lochie), MIT licensed. Its licence is included in [LICENSE](https://github.com/bikash1376/torph-native/blob/main/packages/torph-native/LICENSE).

## License

MIT
