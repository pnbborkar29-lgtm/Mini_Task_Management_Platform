import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { ProjectModel } from "../models/Project";
import { TaskModel } from "../models/Task";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get("/dashboard", async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const now = new Date();

  const projects = await ProjectModel.find({ ownerId: userId }).select({ _id: 1 }).lean();
  const projectIds = projects.map((p) => p._id);

  const [totalProjects, totalTasks, completedTasks, overdueTasks] = await Promise.all([
    ProjectModel.countDocuments({ ownerId: userId }),
    TaskModel.countDocuments({ projectId: { $in: projectIds } }),
    TaskModel.countDocuments({ projectId: { $in: projectIds }, status: "COMPLETED" }),
    TaskModel.countDocuments({
      projectId: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: "COMPLETED" },
    }),
  ]);

  res.json({
    ok: true,
    data: { totalProjects, totalTasks, completedTasks, overdueTasks },
  });
});

