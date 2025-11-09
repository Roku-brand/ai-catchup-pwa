// /api/news.js
// Newsdata.io からAI寄りニュースをまとめて取得する本番用API

export default async function handler(req, res) {
  try {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Server config error: NEWSDATA_API_KEY is not set.",
      });
    }

    const base =
      `https://newsdata.io/api/1/news?apikey=${apiKey}` +
      `&q=ai OR "artificial intelligence" OR openai OR gpt` +
      `&language=ja,en` +
      `&category=technology,science,business`;

    const urls = [base + "&page=1", base + "&page=2"];

    const responses = await Promise.all(urls.map((u) => fetch(u)));
    const jsons = await Promise.all(
      responses.map((r) => r.json().catch(() => ({ results: [] })))
    );

    const all = jsons
      .flatMap((d) => d.results || [])
      .filter((n) => n.link || n.url);

    const seen = new Set();
    const unique = all.filter((n) => {
      const link = n.link || n.url;
      if (seen.has(link)) return false;
      seen.add(link);
      return true;
    });

    const formatted = unique.slice(0, 50).map((n) => ({
      title: n.title || "No title",
      summary: n.description || n.content || "",
      source: n.source_id || "",
      pubDate: n.pubDate || n.pub_date || "",
      url: n.link || n.url,
      category: Array.isArray(n.category)
        ? n.category.join(", ")
        : n.category || "",
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("API /api/news error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}
