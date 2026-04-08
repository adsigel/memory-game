# Memory Game — Claude Code Context

## What This Is

A daily memory card game built for a grandparent with frontal temporal dementia, featuring photos of their grandkids. Each day generates a deterministic puzzle (seeded shuffle) so all players see the same cards on the same day.

## Gameplay Notes

The gameplay should skew towards joy and simplicity. We do not want to overwhelm or frustrate users. Positive reinforcement, clear instructions, and intuitive design should be used everywhere.

## Development Notes

1. We will test locally before we deploy any new changes.
2. Consider code changes holistically, and proactively flag unexpected second-level implications when you identify them.
3. Simple is better than complex, and janky is not the same as simple.'
4. Think of me as a product manager and you as the engineering lead. I will have a point of view on user experience and "business" viability--and I am not always right. I trust you to think about technical feasibility. 

See [DEVELOPMENT.md](DEVELOPMENT.md) for full requirements, tech stack, project structure, and how to run locally.

## Key Files

| File | Purpose |
|---|---|
| [src/components/MemoryGame.tsx](src/components/MemoryGame.tsx) | Main game component |
| [src/lib/images.ts](src/lib/images.ts) | `ALL_IMAGES` array — list of all photo paths |
| [src/lib/puzzle.ts](src/lib/puzzle.ts) | Daily puzzle generation via seeded shuffle |
| [src/lib/amplitude.ts](src/lib/amplitude.ts) | Amplitude init + event tracking wrapper |

## Adding Photos (Manual Process)

1. Copy image into `public/images/`
2. Add path to `ALL_IMAGES` in `src/lib/images.ts`
3. Commit and push — Vercel auto-deploys

## Deployment

Deployed on Vercel. Pushing to `main` triggers a production deploy.

## Image Folders

Two image folders are intentionally maintained:

- `assets/images/` — original source photos, untouched. Drop new photos here.
- `public/images/` — web-ready copies served by the app.

The separation exists to preserve originals when a face-crop pipeline is added later (planned fast follow after the basic ingestion agent).

## Planned Work

- **Photo ingestion pipeline (phase 1)**: Scheduled agent (daily) + manual trigger that diffs `assets/images/` against `public/images/`, copies new files, updates `ALL_IMAGES` in `images.ts`, commits, and pushes to trigger a Vercel deploy.
- **Photo ingestion pipeline (phase 2)**: Auto face-crop new photos into a 1:1 ratio (centered on faces) before copying to `public/images/`.
