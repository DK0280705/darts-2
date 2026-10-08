# Celebration videos

Drop short celebration video files here, named to match the tier they're
played for (see `CELEBRATION_VIDEOS` in [`src/config.ts`](../../src/config.ts)):

| File                  | Tier | Trigger (single round score out of 180) |
| --------------------- | ---- | ---------------------------------------- |
| `celebration-s.mp4`   | S    | 160 and up                                |
| `celebration-a.mp4`   | A    | 120–159                                   |
| `celebration-b.mp4`   | B    | 80–119                                    |
| `celebration-c.mp4`   | C    | 40–79                                     |

Any standard web video format Chrome/Firefox/Safari can play (`.mp4`/H.264 is
the safest bet) works — just use these exact filenames, or update the paths
in `src/config.ts` to point wherever you put them.

Until a file is present, the celebration overlay falls back to a text/badge
card so the feature still works end-to-end without video assets.
