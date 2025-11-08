// /api/news.js

export default async function handler(req, res) {
  try {
    const apiKey = process.env.NEWSDATA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server config error: NEWSDATA_API_KEY is not set." });
    }

    // 件数増やすため：page=1,2 をまとめて取得
    const base =
      `https://newsdata.io/api/1/news?apikey=${apiKey}` +
      `&q=ai OR artificial intelligence OR openai OR gpt` +
      `&language=ja,en` +
      `&category=technology,science,business` +
      `&country=jp,us,gb,de,fr`; // 必要なら調整

    const urls = [
      base + "&page=1",
      base + "&page=2",
    ];

    const responses = await Promise.all(urls.map((u) => fetch(u)));
    const jsons = await Promise.all(responses.map((r) => r.json().catch(() => ({ results: [] }))));

    // resultsをまとめて平坦化
    const all = jsons
      .flatMap((d) => d.results || [])
      // URLがないものは除外
      .filter((n) => n.link || n.url);

    // 同じURLは重複排除
    const seen = new Set();
    const unique = all.filter((n) => {
      const link = n.link || n.url;
      if (seen.has(link)) return false;
      seen.add(link);
      return true;
    });

    // 最大50件くらいに制限
    const formatted = unique.slice(0, 50).map((n) => ({
      title: n.title || "No title",
      summary: n.description || n.content || "",
      source: n.source_id || "",
      pubDate: n.pubDate || n.pub_date || "",
      url: n.link || n.url,
      category: Array.isArray(n.category) ? n.category.join(", ") : (n.category || ""),
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("API /api/news error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
