"use client";

import  {useState,useEffect} from "react";
import { apiFetch, ApiClientError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AppShell, Card, RequireAuth } from "@/components/ui";

type DashboardData = {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const dashboardData = await apiFetch<DashboardData>("/analytics/dashboard", { token });
        if (mounted) setData(dashboardData);
      } catch (e) {
        if (mounted) setError(e instanceof ApiClientError ? e.message : "Error while loading dashboard Data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <RequireAuth>
      <AppShell>
        <div className="grid gap-4 md:grid-cols-1">
          <Card title="Overview">
            {loading ? (
              <div className="text-sm text-zinc-600">Loading…</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : data ? (
              <div className="grid grid-cols-2 gap-3">
                <ProjectDetailsCard label="Projects" value={data.totalProjects} />
                <ProjectDetailsCard label="Tasks" value={data.totalTasks} />
                <ProjectDetailsCard label="Completed" value={data.completedTasks} />
                <ProjectDetailsCard label="Overdue" value={data.overdueTasks} />
              </div>
            ) : null}
          </Card>

          {/* <Card title="Getting started">
            <div className="text-sm text-zinc-600">
              Create a project, add tasks with due dates, and track progress here.
            </div>
          </Card> */}
        </div>
      </AppShell>
    </RequireAuth>
  );
}

function ProjectDetailsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

