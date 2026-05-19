# human-duration

[![ci](https://github.com/p-vbordei/human-duration/actions/workflows/ci.yml/badge.svg)](https://github.com/p-vbordei/human-duration/actions/workflows/ci.yml)

[![npm](https://img.shields.io/npm/v/%40p-vbordei%2Fhuman-duration.svg)](https://www.npmjs.com/package/@p-vbordei/human-duration)
[![downloads](https://img.shields.io/npm/dm/%40p-vbordei%2Fhuman-duration.svg)](https://www.npmjs.com/package/@p-vbordei/human-duration)
[![bundle](https://img.shields.io/bundlejs/size/%40p-vbordei%2Fhuman-duration)](https://bundlejs.com/?q=%40p-vbordei%2Fhuman-duration)

> Parse and format human-friendly durations. Bidirectional, zero dependencies.

```ts
import { parse, format } from "@p-vbordei/human-duration";

parse("1h30m")           // 5_400_000
parse("2 days 5 hours")  // 187_200_000
parse("500ms")           // 500
parse("1.5h")            // 5_400_000

format(5_400_000)                          // "1h 30m"
format(5_400_000, { compact: true })       // "1h30m"
format(5_400_000, { maxComponents: 1 })    // "1h"  (rounded)
format(-90_000)                            // "-1m 30s"
```

## Install

```sh
npm install @p-vbordei/human-duration
```

Works with Node 20+, browsers, Bun, Deno. ESM + CJS.

## Why

You read a timeout from a config: is `30000` thirty seconds or thirty milliseconds? You let users type a retry delay: `"30s"` or `"30 sec"` or `"30 seconds"`? You display a benchmark result: `2734ms` or `2.7s`?

`human-duration` is **bidirectional** and **round-trip stable**. `parse(format(x)) === x` for any round multiple of any unit it supports. Most existing alternatives (`ms`, `parse-duration`, date-fns helpers) are one-way, CJS-only, or pull in 50KB of date code for what should be a regex parser.

## Recipes

### Config / env variable

```ts
import { parse } from "@p-vbordei/human-duration";

const timeoutMs = parse(process.env.TIMEOUT ?? "30s") ?? 30_000;
// Accepts "30s", "30000", "30000ms", "0.5m" — all give the same result
```

### Display elapsed time

```ts
import { format } from "@p-vbordei/human-duration";

const start = performance.now();
await doWork();
console.log(`Done in ${format(performance.now() - start)}`);
// "Done in 2s 734ms"

// Compact for log lines
console.log(`[${format(elapsed, { compact: true, maxComponents: 2 })}] done`);
// "[2s734ms] done"
```

### "Wait N then retry"

```ts
import { parse } from "@p-vbordei/human-duration";

async function retryAfter(input: string) {
  const ms = parse(input);
  if (ms === null) throw new Error("invalid duration");
  await new Promise((r) => setTimeout(r, ms));
}

await retryAfter("1h30m");
```

### Show time-to-deadline

```ts
import { format } from "@p-vbordei/human-duration";

const remaining = deadline.getTime() - Date.now();
const label =
  remaining <= 0
    ? "expired"
    : remaining < 60_000
      ? `${Math.ceil(remaining / 1000)}s left`
      : format(remaining, { maxComponents: 2 });
```

### Round-trip for storage

```ts
import { parse, format } from "@p-vbordei/human-duration";

// Store as human-readable string in JSON/YAML
const config = { backoff: format(parsed.ms) };  // "1h 30m"

// Parse back later
const backoffMs = parse(config.backoff);
```

## API

### `parse(input: string): number | null`

Returns the duration in milliseconds, or `null` for unparseable input. **Never throws.**

Accepts:

- Bare numbers (`"100"` → 100ms)
- Combined units (`"1h30m"`, `"1h 30m"`, `"1 hour 30 minutes"`)
- Decimals (`"1.5h"`)
- Negative durations (`"-30s"`)
- Comma separators (`"1h, 30m"`)

Units understood (case-insensitive): `ns`, `us`/`μs`, `ms`, `s`/`sec[s]`/`second[s]`, `m`/`min[s]`/`minute[s]`, `h`/`hr[s]`/`hour[s]`, `d`/`day[s]`, `w`/`wk`/`week[s]`.

### `format(ms: number, opts?: FormatOptions): string`

Returns a human-readable string. `NaN`/`Infinity` are stringified as-is.

| Option | Type | Default | Meaning |
|---|---|---|---|
| `largestUnit` | `"w" \| "d" \| "h" \| "m" \| "s" \| "ms"` | `"w"` | Largest unit to use |
| `smallestUnit` | same | `"ms"` | Smallest; remainder folds in (rounded) |
| `compact` | `boolean` | `false` | No spaces between components |
| `maxComponents` | `number` | `Infinity` | Truncate to first N units (rounding the last) |

## Caveats

- **Months and years are deliberately not supported** — they're not constant-length. Use a real date library when you need calendar math.
- **Floating-point precision** in extreme cases (sub-microsecond): `parse("1.5ns")` returns `0.0015`. Don't use this for hardware timing.
- **English unit names only.**

## License

Apache-2.0 © Vlad Bordei
