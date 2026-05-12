"use client";

import  {useState,useEffect} from "react";
import { AppShell, Button, Card, Input, RequireAuth } from "@/components/ui";
import { apiFetch, ApiClientError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Project, Task, TaskStatus } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<(Task & { project: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [sort, setSort] = useState<"updatedAt" | "dueDate" | "status">("updatedAt");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const data = await apiFetch<{ tasks: (Task & { project: Project })[] }>("/tasks", {
        token,
        query: { q: q.trim() || undefined, status: status || undefined, sort },
      });
      setTasks(data.tasks);
    } catch (e:any) {
      setError(e instanceof ApiClientError ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => load(), 250);
    return () => clearTimeout(handle);
  }, [q, status, sort]);

  useEffect(() => {
    load();
  }, []);

  return (
    <RequireAuth>
      <AppShell>
        <Card title="Tasks">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-700">Search</div>
              <Input value={q} onChange={(e:any) => setQ(e.target.value)} placeholder="Title/description…" />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-700">Status</div>
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 text-black"
                value={status}
                onChange={(e:any) => setStatus(e.target.value as any)}
              >
                <option value="">All</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-700 text-black">Sort</div>
              <select
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 text-black"
                value={sort}
                onChange={(e:any) => setSort(e.target.value as any)}
              >
                <option value="updatedAt">Recently updated</option>
                <option value="dueDate">Due date</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : tasks.length === 0 ? (
            <div className="text-sm text-zinc-600">No matching tasks.</div>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => {
                const overdue =
                  t.dueDate && t.status !== "COMPLETED" ? new Date(t.dueDate).getTime() < Date.now() : false;
                return (
                  <div key={t.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900"> Task Name : {t.title}</div>
                        <div className="mt-1 text-sm text-zinc-600">
                          {t.project?.name ? (
                            <>
                              Project Name: <span className="font-medium">{t.project.name}</span>
                            </>
                          ) : null}
                        </div>
                        <div className="mt-2 text-xs text-zinc-500">
                          Status: <span className="font-medium">{t.status}</span>
                          {t.dueDate ? (
                            <>
                              {" "}
                              · Due:{" "}
                              <span className={`font-medium ${overdue ? "text-red-600" : ""}`}>
                                {new Date(t.dueDate).toLocaleDateString()}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            try {
                              const token = getToken();
                              await apiFetch<{ task: Task }>(`/tasks/${t.id}`, {
                                token,
                                method: "PATCH",
                                body: { status: nextStatus(t.status) },
                              });
                              await load();
                            } catch (e:any) {
                              alert(e instanceof ApiClientError ? e.message : "Failed to update");
                            }
                          }}
                        >
                          Next status
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </AppShell>
    </RequireAuth>
  );
}

function nextStatus(s: TaskStatus): TaskStatus {
  if (s === "TODO") return "IN_PROGRESS";
  if (s === "IN_PROGRESS") return "COMPLETED";
  return "TODO";
}

