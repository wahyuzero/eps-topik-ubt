import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function audioPngMimePlugin(): Plugin {
  const handler = (req: any, res: any, next: any) => {
    if (req.url && req.url.includes('/bank/') && req.url.endsWith('.png')) {
      const origSetHeader = res.setHeader;
      res.setHeader = function (name: string, val: any) {
        if (String(name).toLowerCase() === 'content-type' && String(val).includes('image/png')) {
          try {
            const urlPath = req.url.split('?')[0];
            const baseDir = import.meta.dirname || process.cwd();
            const diskPath = path.resolve(baseDir, 'public' + decodeURIComponent(urlPath));
            if (fs.existsSync(diskPath)) {
              const fd = fs.openSync(diskPath, 'r');
              const buf = Buffer.alloc(4);
              fs.readSync(fd, buf, 0, 4, 0);
              fs.closeSync(fd);
              if (buf.slice(0, 3).toString() === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
                return origSetHeader.call(this, name, 'audio/mpeg');
              }
            }
          } catch {
            // ignore filesystem inspection errors
          }
        }
        return origSetHeader.call(this, name, val);
      };
    }
    next();
  };

  return {
    name: 'audio-png-mime-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/bank/')) {
          try {
            const urlPath = req.url.split('?')[0];
            const baseDir = import.meta.dirname || process.cwd();
            const diskPath = path.resolve(baseDir, 'public' + decodeURIComponent(urlPath));
            if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
              const ext = path.extname(diskPath).toLowerCase();
              let contentType = 'application/octet-stream';
              if (ext === '.pdf') contentType = 'application/pdf';
              else if (ext === '.mp3') contentType = 'audio/mpeg';
              else if (ext === '.json') contentType = 'application/json';
              else if (ext === '.png') {
                const fd = fs.openSync(diskPath, 'r');
                const buf = Buffer.alloc(4);
                fs.readSync(fd, buf, 0, 4, 0);
                fs.closeSync(fd);
                if (buf.slice(0, 3).toString() === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
                  contentType = 'audio/mpeg';
                } else {
                  contentType = 'image/png';
                }
              }
              res.setHeader('Content-Type', contentType);
              fs.createReadStream(diskPath).pipe(res);
              return;
            }
          } catch {
            // fallback to next
          }
        }
        next();
      });
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    audioPngMimePlugin(),
  ],
  server: {
    host: '0.0.0.0', // Accessible from phone or other devices on local WiFi
    port: 5173,
    fs: {
      allow: ['..']
    }
  },
  build: {
    copyPublicDir: false
  }
});

