export default async function handler(req: any, res: any) {
  try {
    const response = await fetch("https://bmkg-content-inatews.storage.googleapis.com/last30tsunamievent.xml");
    if (!response.ok) throw new Error("Failed to fetch BMKG inatews");
    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error: any) {
    console.error("BMKG inatews fetch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
