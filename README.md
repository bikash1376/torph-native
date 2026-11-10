# torph-rn

The monorepo for **[torph-native](./packages/torph-native)**, which brings [torph](https://github.com/lochie/torph)'s animated text morphing to React Native using Reanimated.

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
| `apps/example` | Expo SDK 58 demo app (`pnpm --filter torph-native-example start`) |
| `packages/test-cases` | torph's shared test corpus, which the ported engine is tested against |
