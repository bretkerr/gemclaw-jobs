import express from "express";
import { fillGreenhouseForm } from "./greenhouse.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

const BEARER_TOKEN = process.env.PLAYWRIGHT_WORKER_TOKEN ?? "dev-token";

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${BEARER_TOKEN}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/fill-greenhouse", authMiddleware, async (req, res) => {
  try {
    const { url, formData, resumeBase64 } = req.body;
    if (!url || !formData) {
      res.status(400).json({ error: "Missing url or formData" });
      return;
    }
    const result = await fillGreenhouseForm(url, formData, resumeBase64);
    res.json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
});

const PORT = parseInt(process.env.PORT ?? "3001", 10);
app.listen(PORT, () => {
  console.log(`Playwright worker listening on port ${PORT}`);
});
