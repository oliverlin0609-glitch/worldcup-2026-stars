// Serverless function (runs on Vercel) — the safe "middleman".
// Your secret API key lives ONLY here, in an environment variable, never in the browser.
// The webpage calls /api/worldcup, this code calls football-data.org, and returns clean JSON.

const COMP = "WC"; // World Cup competition code on football-data.org

// Map football-data country names -> flagcdn 2-letter codes (best-effort).
const CC = {
  "Argentina":"ar","Brazil":"br","France":"fr","Portugal":"pt","Spain":"es",
  "Germany":"de","England":"gb-eng","Norway":"no","Belgium":"be","Netherlands":"nl",
  "Croatia":"hr","Morocco":"ma","Uruguay":"uy","Mexico":"mx","United States":"us",
  "USA":"us","Canada":"ca","Japan":"jp","South Korea":"kr","Senegal":"sn",
  "Colombia":"co","Italy":"it","Switzerland":"ch","Denmark":"dk","Poland":"pl",
  "Serbia":"rs","Ecuador":"ec","Ghana":"gh","Cameroon":"cm","Australia":"au",
  "Saudi Arabia":"sa","Qatar":"qa","Iran":"ir","Nigeria":"ng","Egypt":"eg",
  "Wales":"gb-wls","Scotland":"gb-sct","Austria":"at","Turkey":"tr","Ukraine":"ua"
};
const cc = name => CC[name] || (name ? name.slice(0,2).toLowerCase() : "un");

export default async function handler(req, res) {
  const KEY = process.env.FOOTBALL_API_KEY;
  if (!KEY) {
    return res.status(500).json({ error: "Missing FOOTBALL_API_KEY environment variable." });
  }

  const headers = { "X-Auth-Token": KEY };
  const base = `https://api.football-data.org/v4/competitions/${COMP}`;

  try {
    // Fetch top scorers and finished matches in parallel.
    const [scorersRes, matchesRes] = await Promise.all([
      fetch(`${base}/scorers?limit=10`, { headers }),
      fetch(`${base}/matches?status=FINISHED`, { headers })
    ]);

    let scorers = [];
    if (scorersRes.ok) {
      const s = await scorersRes.json();
      scorers = (s.scorers || []).map(row => ({
        name: row.player?.name || "Unknown",
        team: row.team?.name || "",
        cc: cc(row.team?.name),
        goals: row.goals ?? 0
      }));
    }

    let matches = [];
    if (matchesRes.ok) {
      const m = await matchesRes.json();
      matches = (m.matches || [])
        .slice(-8).reverse() // most recent finished games
        .map(g => ({
          home: g.homeTeam?.name || "TBD",
          hc: cc(g.homeTeam?.name),
          away: g.awayTeam?.name || "TBD",
          ac: cc(g.awayTeam?.name),
          hs: g.score?.fullTime?.home ?? 0,
          as: g.score?.fullTime?.away ?? 0
        }));
    }

    // Cache at the edge for 5 minutes so we don't burn through the 10 calls/min limit.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ updatedAt: new Date().toISOString(), scorers, matches });
  } catch (err) {
    return res.status(502).json({ error: "Could not reach football-data.org", detail: String(err) });
  }
}
