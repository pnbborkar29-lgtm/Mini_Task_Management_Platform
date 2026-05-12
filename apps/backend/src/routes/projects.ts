import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { validate } from "../lib/validate";
import { ApiError } from "../lib/errors";
import { ProjectModel } from "../models/Project";
import { TaskModel } from "../models/Task";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const projects = await ProjectModel.find({ ownerId: userId }).sort({ updatedAt: -1 }).lean<any[]>();
  res.json({
    ok: true,
    data: { projects: projects.map((p) => ({ ...p, id: p._id.toString() })) },
  });
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
});

projectsRouter.post("/", validate({ body: CreateProjectSchema }), async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const { name, description } = req.body as z.infer<typeof CreateProjectSchema>;

  const project = await ProjectModel.create({ ownerId: userId, name, description });
  res.status(201).json({ ok: true, data: { project: { ...project.toObject(), id: project._id.toString() } } });
});

const ProjectIdParams = z.object({ id: z.string().min(1) });

projectsRouter.get("/:id", validate({ params: ProjectIdParams }), async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const { id } = req.params as z.infer<typeof ProjectIdParams>;

  const project = await ProjectModel.findOne({ _id: id, ownerId: userId }).lean<any>();
  if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");

  const tasks = await TaskModel.find({ projectId: id }).sort({ updatedAt: -1 }).lean<any[]>();
  res.json({
    ok: true,
    data: {
      project: {
        ...project,
        id: project._id.toString(),
        tasks: tasks.map((t) => ({ ...t, id: t._id.toString() })),
      },
    },
  });
});

const UpdateProjectSchema = CreateProjectSchema.partial();

projectsRouter.patch(
  "/:id",
  validate({ params: ProjectIdParams, body: UpdateProjectSchema }),
  async (req, res) => {
    const userId = (req as AuthedRequest).user.sub;
    const { id } = req.params as z.infer<typeof ProjectIdParams>;
    const update = req.body as z.infer<typeof UpdateProjectSchema>;

    const existing = await ProjectModel.findOne({ _id: id, ownerId: userId }).lean<any>();
    if (!existing) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");

    const project = await ProjectModel.findByIdAndUpdate(id, update, { new: true }).lean<any>();
    res.json({ ok: true, data: { project: project ? { ...project, id: project._id.toString() } : project } });
  },
);

projectsRouter.delete("/:id", validate({ params: ProjectIdParams }), async (req, res) => {
  const userId = (req as AuthedRequest).user.sub;
  const { id } = req.params as z.infer<typeof ProjectIdParams>;

  const existing = await ProjectModel.findOne({ _id: id, ownerId: userId }).lean<any>();
  if (!existing) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");

  await TaskModel.deleteMany({ projectId: id });
  await ProjectModel.deleteOne({ _id: id });
  res.status(204).send();
});

