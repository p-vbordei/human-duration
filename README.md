# human-duration

Parse and format human-friendly durations. Bidirectional, zero dependencies, no Date/Intl baggage.

```ts
import { parse, format } from "human-duration";

parse("1h30m")           // 5_400_000
parse("2 days 5 hours")  // 187_200_000
parse("500ms")           // 500
parse("1.5h")            // 5_400_000

format(5_400_000)                          // "1h 30m"
format(5_400_000, { compact: true })       // "1h30m"
format(5_400_000, { maxComponents: 1 })    // "1h"
format(-90_000)                            // "-1m 30s"
```

## Install

```sh
npm install human-duration
```

## API

### `parse(input: string): number | null`

Returns the duration in milliseconds, or `null` for unparseable input. Never throws.

Accepts:
- Bare numbers (`"100"` → 100ms)
- Combined units (`"1h30m"`, `"1h 30m"`, `"1 hour 30 minutes"`)
- Decimals (`"1.5h"`)
- Negative durations (`"-30s"`)
- Comma separators (`"1h, 30m"`)

Units understood (case-insensitive): `ns`, `us`/`μs`, `ms`, `s`/`sec[s]`/`second[s]`, `m`/`min[s]`/`minute[s]`, `h`/`hr[s]`/`hour[s]`, `d`/`day[s]`, `w`/`wk`/`week[s]`.

### `format(ms: number, opts?: FormatOptions): string`

Returns a human-readable string.

| Option | Type | Default | Meaning |
|---|---|---|---|
| `largestUnit` | `"w" \| "d" \| "h" \| "m" \| "s" \| "ms"` | `"w"` | Largest unit to use |
| `smallestUnit` | same | `"ms"` | Smallest; remainder folds in |
| `compact` | `boolean` | `false` | No spaces between components |
| `maxComponents` | `number` | `Infinity` | Truncate to first N units |

## Why not `ms` or `parse-duration`?

`ms` is one-way and limited. `parse-duration` is OK but ships a parser that pulls in moment-style baggage. `human-duration` is small, bidirectional, and round-trip stable: `parse(format(x)) === x` for typical durations.

## Months and years?

Deliberately not supported — they're not constant-length. Use a real date library when you need calendar math.

## License

Apache-2.0 © Vlad Bordei
