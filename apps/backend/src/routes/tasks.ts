import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { validate } from "../lib/validate";
import { ApiError } from "../lib/errors";
import { TaskModel, type TaskStatus } from "../models/Task";
import { ProjectModel } from "../models/Project";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

const ListTasksQuery = z.object({
  projectId: z.string().min(1).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  q: z.string().min(1).max(200).optional(),
  sort: z.enum(["updatedAt", "dueDate", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

tasksRouter.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const { projectId, status, q, sort, order } = req.query as z.infer<typeof ListTasksQuery>;

  const projectFilter = { ownerId: userId, ...(projectId ? { _id: projectId } : {}) };
  const allowedProjectIds = await ProjectModel.find(projectFilter).select({ _id: 1 }).lean<any[]>();
  const projectIds = allowedProjectIds.map((p) => p._id);

  const filter: any = {
    projectId: { $in: projectIds },
    ...(status ? { status } : {}),
    ...(q
      ? {
          $or: [{ title: new RegExp(escapeRegex(q), "i") }, { description: new RegExp(escapeRegex(q), "i") }],
        }
      : {}),
  };

  const dir = order === "asc" ? 1 : -1;
  const key = sort ?? "updatedAt";
  const sortObj: any =
    key === "dueDate" ? { dueDate: dir, updatedAt: -1 } : key === "status" ? { status: dir, updatedAt: -1 } : { updatedAt: dir };

  const tasks = await TaskModel.find(filter).sort(sortObj).lean<any[]>();
  const projects = await ProjectModel.find({ _id: { $in: projectIds } }).lean<any[]>();
  const projectById = new Map(projects.map((p) => [p._id.toString(), p]));

  res.json({
    ok: true,
    data: {
      tasks: tasks.map((t) => ({
        ...t,
        id: t._id.toString(),
        project: (() => {
          const p = projectById.get(t.projectId.toString());
          return p ? { ...p, id: p._id.toString() } : null;
        })(),
      })),
    },
  });
});

const CreateTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  dueDate: z.coerce.date().optional(),
  
});

tasksRouter.post("/", validate({ body: CreateTaskSchema }), async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const { projectId, title, description, status, dueDate } = req.body as z.infer<typeof CreateTaskSchema>;

  const project = await ProjectModel.findOne({ _id: projectId, ownerId: userId }).lean<any>();
  if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");

  const task = await TaskModel.create({ projectId, title, description, status, dueDate });

  res.status(201).json({ ok: true, data: { task: { ...task.toObject(), id: task._id.toString() } } });
});

const TaskIdParams = z.object({ id: z.string().min(1) });

const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
    dueDate: z.coerce.date().nullable().optional(),
    completedDate: z.coerce.date().nullable().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

tasksRouter.patch("/:id", validate({ params: TaskIdParams, body: UpdateTaskSchema }), async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const { id } = req.params as z.infer<typeof TaskIdParams>;
  const update = req.body as z.infer<typeof UpdateTaskSchema>;

  const existing = await TaskModel.findById(id).lean<any>();
  if (!existing) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
  const project = await ProjectModel.findOne({ _id: existing.projectId, ownerId: userId }).lean<any>();
  if (!project) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");

  const task = await TaskModel.findByIdAndUpdate(id, update, { new: true }).lean<any>();
  res.json({ ok: true, data: { task: task ? { ...task, id: task._id.toString() } : task } });
});

tasksRouter.delete("/:id", validate({ params: TaskIdParams }), async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const { id } = req.params as z.infer<typeof TaskIdParams>;

  const existing = await TaskModel.findById(id).lean<any>();
  if (!existing) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");
  const project = await ProjectModel.findOne({ _id: existing.projectId, ownerId: userId }).lean<any>();
  if (!project) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found");

  await TaskModel.deleteOne({ _id: id });
  res.status(204).send();
});

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

