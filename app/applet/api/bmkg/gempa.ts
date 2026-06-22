export default async function handler(req: any, res: any) {
  try {
    let file = 'autogempa.xml';
    if (req.query.type === 'tsunami' || req.query.type === 'terkini') file = 'gempaterkini.xml';
    else if (req.query.type === 'dirasakan') file = 'gempadirasakan.xml';
    
    const response = await fetch(`https://data.bmkg.go.id/DataMKG/TEWS/${file}`);
    if (!response.ok) throw new Error(`Failed to fetch ${file}`);
    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error: any) {
    console.error("BMKG fetch error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
