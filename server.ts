import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/generate-stage", async (req, res) => {
    try {
      const { level, distance } = req.body;
      
      // Random special stage (e.g. 50% chance every 100m)
      const isSpecialNature = Math.random() < 0.5 && level > 1;

      if (isSpecialNature) {
              // Use reliable static nature URLs
              const NATURE_WALLPAPER_URLS = [
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2000&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=2000&auto=format&fit=crop"
              ];
              // Use static URLs
              const hue = Math.floor(Math.random() * 360);
              const natureUrl = NATURE_WALLPAPER_URLS[Math.floor(Math.random() * NATURE_WALLPAPER_URLS.length)];
              res.json({
                  themeName: "Nature Special Dimension",
                  wallColor: `hsl(${hue}, 80%, 20%)`,
                  floorColor: `hsl(${hue}, 80%, 15%)`,
                  gridColor: `hsl(${hue}, 100%, 70%)`,
                  weather: "none",
                  backgroundImage: `/api/proxy-image?url=${encodeURIComponent(natureUrl)}`,
                  obstacleColors: {
                    jump: `hsl(${(hue + 60) % 360}, 100%, 60%)`,
                    duck: `hsl(${(hue + 120) % 360}, 100%, 60%)`,
                    block: `hsl(${(hue + 180) % 360}, 100%, 60%)`
                  }
              });
              return;
      }

      // Standard hue based staging
      const hue = ((level - 1) * 35) % 360; // Rotate hue
      
      const themeNames = [
          "Neon City", "Crimson Abyss", "Toxic Waste", "Golden Desert", "Sapphire Caverns", "Amethyst Peaks"
      ];
      const weathers = ["stars", "rain", "snow", "none"];

      res.json({
        themeName: themeNames[(level - 1) % themeNames.length] + ` ${level}`,
        wallColor: `hsl(${hue}, 70%, 10%)`,
        floorColor: `hsl(${hue}, 70%, 5%)`,
        gridColor: `hsl(${hue}, 100%, 50%)`,
        weather: weathers[(level - 1) % weathers.length],
        backgroundImage: null,
        obstacleColors: {
          jump: `hsl(${(hue + 60) % 360}, 100%, 60%)`,
          duck: `hsl(${(hue + 120) % 360}, 100%, 60%)`,
          block: `hsl(${(hue + 180) % 360}, 100%, 60%)`
        }
      });
      
    } catch (error: any) {
      console.error("Stage Gen Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).send("Missing url parameter");
      }
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      res.set("Content-Type", response.headers.get("content-type") || "image/png");
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("Image proxy error:", error);
      res.status(500).send("Error fetching image");
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
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
