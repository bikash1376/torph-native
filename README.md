# torph-rn

The monorepo for **[torph-native](./packages/torph-native)**: morphing UI for React Native, built on Reanimated. It covers text and number morphs ported from [torph](https://github.com/lochie/torph), plus icon, emoji, tray, chart and layout morphs modelled on [Family Values](https://benji.org/family-values).

→ **[Package README](./packages/torph-native/README.md)** covers usage, the API, how it works and its limitations.

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

| Path | |
| --- | --- |
| `packages/torph-native` | The library |
| `apps/example` | Expo SDK 58 gallery of every component (`pnpm --filter torph-native-example start`) |
| `packages/test-cases` | torph's shared test corpus, which the ported engine is tested against |
