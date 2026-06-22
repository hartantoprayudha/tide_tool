export default async function handler(req: any, res: any) {
  try {
    const response = await fetch("https://www.bmkg.go.id/gempabumi/berpotensi-tsunami");
    if (!response.ok) throw new Error("Failed to fetch BMKG history");
    const html = await response.text();
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error: any) {
    console.error("BMKG history fetch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
