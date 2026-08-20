<h1 align="center"><a href="https://rooftopping.club">rooftopper.club</a></h1>

<p>
  rooftopper.club is a map for sharing rooftopping spots. Highrises, cranes, construction sites,
  and other places worth climbing for a view. It exists to help rooftoppers find and document spots,
  and to build a shared record of the community's work.
</p>

<h3>What belongs here</h3>
<p>
  Rooftopping only. This is not for urbex spots. Fragile or already-vulnerable places don't belong
  on this map. Adding those puts them at risk of being found, trashed, or destroyed. Please keep this
  site focused on rooftops and similar accessible-from-outside locations, not places that survive on
  obscurity.
</p>

<h3>Stay safe</h3>
<p>
  Know your limits, don't go alone without telling someone, and don't let peer pressure push you into
  doing something you're not comfortable with. No spot is worth dying for.
</p>

### Technical assessment

- **Runtime**: [Bun](https://bun.sh) serving both the API and server-rendered HTML, no framework, no bundler.
- **Server**: `src/server.ts` is a single `Bun.serve` fetch handler doing manual route matching (`/about`, `/auth`, `/location/:uuid`, `/user/:uuid`, `/add-location`, static files from `public/` and `assets/`).
- **Rendering**: pages are built as template strings in `src/templates.ts` (`baseTemplate`, `locationTemplate`, `authTemplate`, `userProfileTemplate`, `aboutTemplate`, `addLocationTemplate`), no client-side framework, no build step for the frontend.
- **Frontend**: static `public/index.html` + `public/script.js` (vanilla) render the leaflet map and handle auth/upload/comment interactions client-side via the Supabase JS SDK.
- **Data**: [Supabase](https://supabase.com) for Postgres (locations, users, comments, images), auth, and storage (location photos), accessed directly from both the server (service queries) and the browser (auth, uploads, comments).
- **Setup**: `bun install`, then `bun run dev` (or `bun run start`) with `SUPABASE_URL` / `SUPABASE_ANON_KEY` set in `.env`.
