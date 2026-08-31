import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mysql from "mysql2/promise";
import cors from "cors";
import { ProxyAgent, setGlobalDispatcher } from "undici";

// Configure proxy for native fetch if environment variables are set
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
if (proxyUrl) {
  try {
    const proxyAgent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(proxyAgent);
    console.log(`[Proxy] Configured native fetch to use proxy: ${proxyUrl}`);
  } catch (error) {
    console.error("[Proxy] Failed to configure proxy agent:", error);
  }
}

// MySQL Connection Pool (Lazy initialized or created on demand based on connection details)

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API POST route to test database connection
  app.post("/api/db/test", async (req, res) => {
    const { host, port, user, password, database } = req.body;
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        port: parseInt(port, 10),
        user,
        password,
        database,
        connectTimeout: 5000,
        dateStrings: true
      });
      await connection.execute("SELECT 1");
      res.json({ success: true, message: "Koneksi berhasil." });
    } catch (error: any) {
      console.error("Database test error:", error);
      let errMsg = error.message;
      if (error.code === 'ETIMEDOUT') {
        errMsg = `Koneksi timeout (ETIMEDOUT). Pastikan database di ${host}:${port} dapat diakses dari internet publik (bukan IP lokal seperti 10.x.x.x atau 192.x.x.x).`;
      }
      res.status(500).json({ success: false, error: errMsg });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  });

  // API POST route to fetch data from dynamic connection
  app.post("/api/db/connect", async (req, res) => {
    const { host, port, user, password, database, table, station, startDate, endDate } = req.body;
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        port: parseInt(port, 10),
        user,
        password,
        database,
        connectTimeout: 5000,
        dateStrings: true
      });

      let query = `SELECT * FROM \`${table}\``;
      if (table === 'validdata') {
        query = `SELECT StationId, TimeStamp, Interpolation as Intp FROM \`${table}\``;
      }
      const params: any[] = [];
      const conditions: string[] = [];

      if (table === 'data_vsat5' || table === 'validdata') {
          if (station && station.trim() !== '') {
              const stationCol = table === 'data_vsat5' ? 'StationID' : 'StationId'; // Due to schema inconsistencies
              conditions.push(`\`${stationCol}\` = ?`);
              params.push(station);
          }
          if (startDate) {
              conditions.push(`TimeStamp >= ?`);
              params.push(startDate);
          }
          if (endDate) {
              conditions.push(`TimeStamp <= ?`);
              params.push(endDate);
          }
          
          if (conditions.length > 0) {
              query += ` WHERE ${conditions.join(' AND ')}`;
          }
          
          // Removed ORDER BY TimeStamp DESC because validdata has a TEXT column (Remark)
          // which forces MySQL to use a slow on-disk temporary table for sorting.
          // The frontend already sorts the data chronologically in ConnectView.tsx anyway.
      }
      
      const [rows] = await connection.query(query, params);
      
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error("Database connection error:", error);
      let errMsg = error.message;
      if (error.code === 'ETIMEDOUT') {
        errMsg = `Koneksi timeout (ETIMEDOUT). Pastikan database di ${host}:${port} dapat diakses dari internet publik (bukan IP lokal seperti 10.x.x.x atau 192.x.x.x).`;
      }
      res.status(500).json({ success: false, error: errMsg });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  });
  
  app.post("/api/db/query", async (req, res) => {
    const { host, port, user, password, database, query, params } = req.body;
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        port: parseInt(port, 10),
        user,
        password,
        database,
        connectTimeout: 5000,
        dateStrings: true
      });

      const [rows] = await connection.execute(query, params || []);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error("Database query error:", error);
      let errMsg = error.message;
      if (error.code === 'ETIMEDOUT') {
        errMsg = `Koneksi timeout (ETIMEDOUT). Pastikan database di ${host}:${port} dapat diakses dari internet publik.`;
      }
      res.status(500).json({ success: false, error: errMsg });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  });

  // API POST route to directly export dataset to validdata2 table
  app.post("/api/db/export-validdata2", async (req, res) => {
    const { host, port, user, password, database, sqlStatements, autoCreateTable } = req.body;
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        port: parseInt(port, 10) || 3306,
        user,
        password,
        database: database || 'bako',
        connectTimeout: 8000,
        multipleStatements: true,
        dateStrings: true
      });

      if (autoCreateTable) {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS \`validdata2\` (
            \`RecId\` bigint(20) NOT NULL,
            \`StationId\` varchar(10) NOT NULL,
            \`TimeStamp\` datetime NOT NULL,
            \`combination\` float DEFAULT NULL,
            \`Interpolation\` float NOT NULL,
            \`Sensor1\` float DEFAULT NULL,
            \`Sensor2\` float DEFAULT NULL,
            \`Sensor3\` float DEFAULT NULL,
            \`Source\` varchar(20) DEFAULT NULL,
            \`Operator\` varchar(20) DEFAULT NULL,
            \`Remark\` text,
            PRIMARY KEY (\`RecId\`)
          ) ENGINE=MyISAM DEFAULT CHARSET=latin1;
        `);
      }

      let executedCount = 0;
      if (Array.isArray(sqlStatements)) {
        for (const statement of sqlStatements) {
          if (statement && statement.trim()) {
            await connection.query(statement);
            executedCount++;
          }
        }
      } else if (typeof sqlStatements === 'string' && sqlStatements.trim()) {
        await connection.query(sqlStatements);
        executedCount++;
      }

      res.json({ success: true, message: `Data berhasil diekspor langsung ke tabel validdata2 dalam database ${database || 'bako'}.`, executedStatements: executedCount });
    } catch (error: any) {
      console.error("Export to validdata2 error:", error);
      let errMsg = error.message;
      if (error.code === 'ETIMEDOUT') {
        errMsg = `Koneksi timeout (ETIMEDOUT). Pastikan database di ${host}:${port} dapat diakses dari server.`;
      }
      res.status(500).json({ success: false, error: errMsg });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  });

  app.get("/api/bmkg/gempa", async (req, res) => {
    try {
      // type can be 'terkini' (60 latest M5+), 'tsunami' (latest tsunami), or 'autogempa' (latest single)
      let file = 'autogempa.xml';
      // BMKG does not have a dedicated gempatsunami.xml. We must fetch gempaterkini.xml
      // which contains the list of latest earthquakes, and filter out the tsunami ones on the client.
      if (req.query.type === 'tsunami' || req.query.type === 'terkini') file = 'gempaterkini.xml';
      else if (req.query.type === 'dirasakan') file = 'gempadirasakan.xml';
      
      const response = await fetch(`https://data.bmkg.go.id/DataMKG/TEWS/${file}`);
      if (!response.ok) throw new Error("Failed to fetch BMKG data");
      const xml = await response.text();
      res.type('application/xml').send(xml);
    } catch (error: any) {
      console.error("BMKG fetch error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/bmkg/history", async (req, res) => {
    try {
      const response = await fetch("https://www.bmkg.go.id/gempabumi/berpotensi-tsunami");
      if (!response.ok) throw new Error("Failed to fetch BMKG history");
      const html = await response.text();
      res.type('text/html').send(html);
    } catch (error: any) {
      console.error("BMKG history fetch error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/bmkg/inatews", async (req, res) => {
    try {
      const response = await fetch("https://bmkg-content-inatews.storage.googleapis.com/last30tsunamievent.xml");
      if (!response.ok) throw new Error("Failed to fetch BMKG inatews");
      const xml = await response.text();
      res.type('application/xml').send(xml);
    } catch (error: any) {
      console.error("BMKG inatews fetch error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Determine the __dirname equivalent correctly for ES modules or CommonJS
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
