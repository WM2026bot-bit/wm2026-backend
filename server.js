const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "WM2026 Backend" });
});

app.post("/news", async (req, res) => {
  const { topic } = req.body;
  const isBVB = topic === "bvb";

  const prompt = isBVB
    ? `Suche BVB Borussia Dortmund 1909 aktuelle News von: Transfermarkt, kicker, Sportbild, Sky Sport, WAZ, Reviersport, Ruhr Nachrichten, BVB.de. 5 Headlines auf Deutsch. NUR JSON-Array: [{"title":"...","summary":"1 Satz","source":"...","emoji":"🖤","url":"https://...","category":"Transfer"}]`
    : `Suche aktuelle FIFA WM 2026 Nachrichten. 5 Headlines auf Deutsch. NUR JSON-Array: [{"title":"...","summary":"1 Satz","source":"...","emoji":"⚽","url":"https://...","category":"News"}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");

    if (start !== -1 && end !== -1) {
      const news = JSON.parse(clean.slice(start, end + 1));
      res.json({ ok: true, news });
    } else {
      res.json({ ok: false, news: [] });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, news: [] });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WM2026 Backend läuft auf Port ${PORT}`));
