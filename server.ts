import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/readme', async (req, res) => {
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      const content = await fs.readFile(readmePath, 'utf-8');
      res.json({ content });
    } catch (e) {
      res.status(500).json({ error: 'Failed to read README.md' });
    }
  });

  app.post('/api/readme', async (req, res) => {
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      await fs.writeFile(readmePath, req.body.content, 'utf-8');
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to write README.md' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support React Router HTML5 history fallback
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
