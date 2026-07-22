# Slide 8 — Open Source & Roadmap

## Title

What's real today, what's next — stated honestly

## Content

**Today:** MIT licensed · full docs · issue &amp; PR templates · SECURITY.md
· CODE_OF_CONDUCT.md · 9 ADRs documenting every major decision

**Next**, in priority order (from [`docs/roadmap.md`](../docs/roadmap.md)):

1. A real Masumi client behind `MasumiAdapterPort`
2. Artifact signing for genuine third-party auditability
3. A PostgreSQL `StoragePort` adapter (contract suite already proves the
   seam)
4. Redaction policy for Snapshot payloads before export
5. AuthN/AuthZ and multi-tenancy

## Speaker Notes

Judges trust teams that know their own gaps — say the limitations out loud
before anyone has to extract them: "There's no authentication layer yet.
There's no artifact signing yet. Both are next on the roadmap, and both are
additive — they don't require touching the capture, replay, verify, or
explain pipeline at all, because none of that logic has any dependency on
who's calling it or how the hash chain gets attested." This is a confidence
move, not a confession — say it plainly and move on.

## Visual Suggestions

Two-column list: "Today" (green checkmarks) beside "Next" (blue arrows),
pulled directly from `docs/roadmap.md` so the slide never drifts out of
sync with the actual documented roadmap.
