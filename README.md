# World Cup 2026 — The Stars Edition ⚽

A live, self-updating landing page for the FIFA World Cup 2026 headline players.

- `index.html` — the website (works on its own, shows sample data)
- `api/worldcup.js` — the secure "middleman" that fetches live data from football-data.org
- The page auto-refreshes the **Golden Boot race** and **latest results** once deployed.

## Going live (short version)
1. Push this folder to a GitHub repo.
2. Import it into Vercel (vercel.com).
3. Add one Environment Variable in Vercel:
   - **Name:** `FOOTBALL_API_KEY`
   - **Value:** your football-data.org token
4. Deploy. The "Preview data" badge turns green → "Live".

The secret key lives only in Vercel's settings — never in the code, never in the browser.
