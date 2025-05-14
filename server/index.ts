import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { pool } from "./db/db";
import rehashPasswordsRouter from "./routes/rehash-passwords.route";

const app = express();

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from the frontend
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
    credentials: true, // Allow cookies and credentials
  })
);

app.use(express.json());
app.use(rehashPasswordsRouter);
app.use(express.urlencoded({ extended: false }));

// Test Database Connection
app.get("/api/db-test", async (req, res) => {
  try {
    // Query the current database name
    const result = await pool.query(
      "SELECT current_database() AS database_name, NOW() AS current_time"
    );
    const { database_name, current_time } = result.rows[0];

    res.status(200).json({
      message: "Database connected",
      database: database_name,
      time: current_time,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Database connection failed", error: errorMessage });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 8000;
  server.listen(
    {
      port,
      host: "localhost",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
