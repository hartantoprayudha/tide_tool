import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mysql from "mysql2/promise";
import cors from "cors";

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
        database
      });
      await connection.execute("SELECT 1");
      res.json({ success: true, message: "Koneksi berhasil." });
    } catch (error: any) {
      console.error("Database test error:", error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  });

  // API POST route to fetch data from dynamic connection
  app.post("/api/db/connect", async (req, res) => {
    const { host, port, user, password, database, table, limit, station, startDate, endDate } = req.body;
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        port: parseInt(port, 10),
        user,
        password,
        database
      });

      let query = `SELECT * FROM \`${table}\``;
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
          
          query += ` ORDER BY TimeStamp DESC LIMIT ${parseInt(limit) || 1000}`;
      } else if (table === 'stationlist') {
          query += ` LIMIT ${parseInt(limit) || 1000}`;
      }
      
      const [rows] = await connection.execute(query, params);
      
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error("Database connection error:", error);
      res.status(500).json({ success: false, error: error.message });
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
        database
      });

      const [rows] = await connection.execute(query, params || []);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      console.error("Database query error:", error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      if (connection) {
        await connection.end();
      }
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
