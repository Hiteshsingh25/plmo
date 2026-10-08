# Palmo — cold-pressed coconut water

Rebuild of [palmo.co.in](https://www.palmo.co.in) from the two Woblo exports in this folder plus the live site's own assets and compiled bundles. Next.js 15 (App Router) · TypeScript · Tailwind v4 · React Three Fiber / drei · GSAP (ScrollTrigger, SplitText, DrawSVG, Draggable, Inertia) · Lenis.

```bash
npm install
npm run dev      # http://localhost:3380
npm run build && npm start
npm run snap     # scroll-stop screenshots → .snaps/   (needs ../haoqi/node_modules/playwright)
```

## What is real

Everything in `public/` was pulled from the live site: `model/coconut.glb` (the two shell halves + water surface), `model/can1.glb` + six label textures, the six fruit sprites for the footer game, the HDRI, the three photographs, icons, and the Latin subsets of Khand / Inter / Patrick Hand. All SVG doodles (`components/ui/Icons.tsx`) and the palm silhouette are the original path data. Copy, prices, testimonials and colours match the source.

## How the page is put together

- `components/three/CoconutScene.tsx` — one sticky R3F canvas behind Hero → Introduction. The scroll scrub (rotate, halves part, camera dolly, settle) is a GSAP timeline; leaving the scrub locks Lenis and plays the **burst** (shake → water drains → halves fly apart → can pops in), then the can spins two turns down the `#section-break` runway. Scrolling back reverses it.
- `components/three/CoconutWater.tsx` — the water inside the half shell: a ping-pong wave simulation on a 512² float render target, sampled by a custom fresnel/sparkle material. Pointer moves push the sim.
- `components/sections/SequenceOverlay.tsx` — the COCONUT copy + `CRACKED OPEN 000→100` readout, driven by `coconut:*` window events from the scene.
- `components/three/CardCan.tsx` / `CtaCan.tsx` — per-card cans (drop-in on scroll, spin on hover, drag orbit) and the CTA can (full-turn spin with a label crossfade patched into MeshStandardMaterial).
- `components/game/FruitSlicer.tsx` — the footer / 404 slicing game.
- `lib/cart.tsx` — client-only basket (localStorage), packs and pricing; `components/chrome/CartDrawer.tsx` is the drawer with the "no till" disclaimer.
- Chrome: preloader with byte-accurate progress (`Loader.tsx`), inverted header pills via `data-nav-dark`, full-screen menu, cookie pill, beige cursor trail, page-transition wipe (`providers/PageTransition.tsx`).

Routes: `/` (the film), `/flavours` (all six cards), `/story`, and a playable 404.

`_src/` holds the extracted exports and prettified bundles used as reference; it is git-ignored.
