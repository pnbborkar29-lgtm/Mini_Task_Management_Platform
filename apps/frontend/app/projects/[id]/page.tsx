"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import {
  AppShell,
  Button,
  Card,
  Input,
  RequireAuth,
  Textarea,
} from "@/components/ui";
import { apiFetch, ApiClientError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Project, Task, TaskStatus } from "@/lib/types";

type ProjectWithTasks = Project & { tasks: Task[] };

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
});

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
});

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<ProjectWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [edit, setEdit] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const data = await apiFetch<{ project: ProjectWithTasks }>(
        `/projects/${projectId}`,
        { token },
      );
      setProject(data.project);
      setEdit({
        name: data.project.name,
        description: data.project.description ?? "",
      });
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Failed to load project",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function onSaveProject(e: any) {
    e.preventDefault();
    setSaveError(null);
    const payload = {
      name: edit.name.trim(),
      description: edit.description.trim() || undefined,
    };
    const parsed = UpdateProjectSchema.safeParse(payload);
    if (!parsed.success) {
      setSaveError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      await apiFetch<{ project: Project }>(`/projects/${projectId}`, {
        token,
        method: "PATCH",
        body: parsed.data,
      });
      await load();
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteProject() {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      const token = getToken();
      await apiFetch<void>(`/projects/${projectId}`, {
        token,
        method: "DELETE",
      });
      router.replace("/projects");
    } catch (e) {
      alert(e instanceof ApiClientError ? e.message : "Failed to delete");
    }
  }

  async function onCreateTask(e: any) {
    e.preventDefault();
    setTaskError(null);
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      dueDate: taskForm.dueDate.trim() || undefined,
    };
    const parsed = CreateTaskSchema.safeParse(payload);
    if (!parsed.success) {
      setTaskError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setCreatingTask(true);
    try {
      const token = getToken();
      await apiFetch<{ task: Task }>("/tasks", {
        token,
        method: "POST",
        body: {
          projectId,
          title: parsed.data.title,
          description: parsed.data.description,
          dueDate: parsed.data.dueDate
            ? new Date(parsed.data.dueDate).toISOString()
            : undefined,
        },
      });
      setTaskForm({ title: "", description: "", dueDate: "" });
      await load();
    } catch (e) {
      setTaskError(
        e instanceof ApiClientError ? e.message : "Failed to create task",
      );
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateTask(
    taskId: string,
    patch: Partial<{
      title: string;
      description: string | null;
      status: TaskStatus;
      dueDate: string | null;
      completedDate: string | null;
    }>,
  ) {
    const token = getToken();
    await apiFetch<{ task: Task }>(`/tasks/${taskId}`, {
      token,
      method: "PATCH",
      body: patch,
    });
    await load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    const token = getToken();
    await apiFetch<void>(`/tasks/${taskId}`, { token, method: "DELETE" });
    await load();
  }

  return (
    <RequireAuth>
      <AppShell>
        {loading ? (
          <div className="text-sm text-zinc-600">Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : !project ? null : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card title="Project">
                <form className="space-y-3" onSubmit={onSaveProject}>
                  <div>
                    <div className="mb-1 text-xs font-medium text-zinc-700">
                      Name
                    </div>
                    <Input
                      value={edit.name}
                      onChange={(e: any) =>
                        setEdit((s) => ({ ...s, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-zinc-700">
                      Description
                    </div>
                    <Textarea
                      value={edit.description}
                      onChange={(e: any) =>
                        setEdit((s) => ({ ...s, description: e.target.value }))
                      }
                      rows={5}
                    />
                  </div>
                  {saveError ? (
                    <div className="text-sm text-red-600">{saveError}</div>
                  ) : null}
                  <Button disabled={saving} className="w-full">
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="w-full"
                    onClick={onDeleteProject}
                  >
                    Delete project
                  </Button>
                </form>
              </Card>

              <div className="mt-4">
                <Card title="New task">
                  <form className="space-y-3" onSubmit={onCreateTask}>
                    <div>
                      <div className="mb-1 text-xs font-medium text-zinc-700">
                        Title
                      </div>
                      <Input
                        value={taskForm.title}
                        onChange={(e: any) =>
                          setTaskForm((s) => ({ ...s, title: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium text-zinc-700">
                        Description
                      </div>
                      <Textarea
                        value={taskForm.description}
                        onChange={(e: any) =>
                          setTaskForm((s) => ({
                            ...s,
                            description: e.target.value,
                          }))
                        }
                        rows={4}
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium text-zinc-700">
                        Due date
                      </div>

                      <Input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e: any) =>
                          setTaskForm((s) => ({
                            ...s,
                            dueDate: e.target.value,
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    {taskError ? (
                      <div className="text-sm text-red-600">{taskError}</div>
                    ) : null}
                    <Button disabled={creatingTask} className="w-full">
                      {creatingTask ? "Creating…" : "Add task"}
                    </Button>
                  </form>
                </Card>
              </div>
            </div>

            <div className="md:col-span-2">
              <Card title="Tasks">
                {project.tasks.length === 0 ? (
                  <div className="text-sm text-zinc-600">No tasks yet.</div>
                ) : (
                  <div className="space-y-2">
                    {project.tasks.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl border border-zinc-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">
                              Task Name: {t.title}
                            </div>
                            {t.description ? (
                              <div className="mt-1 text-sm text-zinc-600">
                                Description:{ t.description}
                              </div>
                            ) : null}
                            <div className="mt-2 text-xs text-zinc-500">
                              Status:{" "}
                              <span className="font-medium">{t.status}</span>
                              {t.dueDate ? (
                                <>
                                  {" "}
                                  · Due:{" "}
                                  <span className="font-medium">
                                    {new Date(t.dueDate).toLocaleDateString()}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-end gap-4 overflow-x-auto whitespace-nowrap">
                            <div className="flex flex-col">
                              <label className="text-sm text-black mb-1">
                                Status
                              </label>

                              <select
                                value={t.status}
                                onChange={(e) =>
                                  updateTask(t.id, {
                                    status: e.target.value as TaskStatus,
                                  })
                                }
                                className="border rounded-md px-3 py-2 text-sm text-black"
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                            </div>

                            <div className="flex flex-col">
                              <label className="text-sm text-black mb-1">
                                Complete Date
                              </label>

                              <input
                                type="date"
                                value={
                                  t.completedDate
                                    ? new Date(t.completedDate)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                }
                                onChange={(e) =>
                                  updateTask(t.id, {
                                    completedDate: e.target.value,
                                  })
                                }
                                className="border rounded-md px-2 py-2 text-sm"
                              />
                            </div>

                            {/* Delete Button */}
                            <div className="flex flex-col justify-end">
                              <label className="text-sm text-transparent mb-1">
                                Delete
                              </label>

                              <Button
                                variant="danger"
                                onClick={() => deleteTask(t.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}

function nextStatus(s: TaskStatus): TaskStatus {
  if (s === "TODO") return "IN_PROGRESS";
  if (s === "IN_PROGRESS") return "COMPLETED";
  return "TODO";
}
