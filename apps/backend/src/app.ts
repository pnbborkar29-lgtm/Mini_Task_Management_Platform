import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import openapi from "./swagger/openapi.json";
import { authRouter } from "./routes/auth";
import { projectsRouter } from "./routes/projects";
import { tasksRouter } from "./routes/tasks";
import { analyticsRouter } from "./routes/analytics";
import { errorHandler, notFoundHandler } from "./lib/errors";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

  app.use("/auth", authRouter);
  app.use("/projects", projectsRouter);
  app.use("/tasks", tasksRouter);
  app.use("/analytics", analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

