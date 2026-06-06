"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import type { Project } from "@/lib/types";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(1000).optional(),
});

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const data = await apiFetch<{ projects: Project[] }>("/projects", {
        token,
      });
      setProjects(data.projects);
    } catch (e) {
      setError(
        e instanceof ApiClientError ? e.message : "Failed to load projects...",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: any) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    };
    const parsed = CreateProjectSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setCreating(true);
    try {
      const token = getToken();
      await apiFetch<{ project: Project }>("/projects", {
        token,
        method: "POST",
        body: parsed.data,
      });
      setForm({ name: "", description: "" });
      await load();
    } catch (e) {
      setFormError(
        e instanceof ApiClientError ? e.message : "Failed to create project",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card title="New project">
              <form className="space-y-3" onSubmit={onCreate}>
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-700">
                    Name
                  </div>
                  <Input
                    value={form.name}
                    onChange={(e: any) =>
                      setForm((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-700">
                    Description
                  </div>
                  <Textarea
                    value={form.description}
                    onChange={(e: any) =>
                      setForm((s) => ({ ...s, description: e.target.value }))
                    }
                    rows={4}
                  />
                </div>
                {formError ? (
                  <div className="text-sm text-red-600">{formError}</div>
                ) : null}
                <Button disabled={creating} className="w-full">
                  {creating ? "Creating…" : "Create project"}
                </Button>
              </form>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card title="Projects">
              {loading ? (
                <div className="text-sm text-zinc-600">Loading…</div>
              ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : projects.length === 0 ? (
                <div className="text-sm text-zinc-600">No projects yet.</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  
                  {projects.map((p, index) => (
                    <div
                      key={p.id}
                      className="py-4 hover:bg-zinc-50 -mx-2 px-2 rounded-lg overflow-hidden"
                    >
                      <Link href={`/projects/${p.id}`} className="block w-full">
                        <div className="text-sm font-medium text-zinc-900">
                          Project : {index + 1}
                        </div>

                        <div className="text-sm font-medium text-zinc-900">
                          Project Name: {p.name}
                        </div>

                        {p.description ? (
                          <div className="text-sm text-zinc-600 break-words whitespace-pre-wrap w-full">
                            <span className="font-medium">Description :</span>

                            <span className="block">{p.description}</span>
                          </div>
                        ) : null}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
