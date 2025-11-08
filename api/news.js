// /api/news.js
// Vercel Serverless Function
// 外部ニュースAPIから「AI関連ニュース」を取得して、フロント用に整形して返す

export default async function handler(req, res) {
  try {
    const apiKey = process.env.NEWSDATA_API_KEY; // Vercelに設定する環境変数

    if (!apiKey) {
      return res.status(500).json({
        error: "Server config error: NEWSDATA_API_KEY is not set.",
      });
    }

    // Newsdata.io の例（無料枠あり）
    const url =
      "https://newsdata.io/api/1/news" +
      `?apikey=${apiKey}` +
      "&q=ai OR artificial intelligence OR gpt OR openai" +
      "&language=ja,en" +
      "&category=technology";

    const response = await fetch(url);
    if (!response.ok) {
      console.error("News API error:", await response.text());
      return res.status(502).json({ error: "Failed to fetch from news API." });
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    const formatted = results.map((n) => ({
      title: n.title || "No title",
      summary: n.description || n.content || "",
      source: n.source_id || "",
      pubDate: n.pubDate || n.pub_date || "",
      url: n.link || n.url || "#",
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error("API /api/news error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
