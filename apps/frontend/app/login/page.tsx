"use client";

import {useState} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { apiFetch, ApiClientError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Button, Input } from "@/components/ui";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
console.log("Login page loaded");
export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e:any) {
    e.preventDefault();
    setError(null);

    const parsed = LoginSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ user: { id: string; email: string; name?: string | null }; token: string }>(
        "/auth/login",
        { method: "POST", body: parsed.data },
      );
      setToken(data.token);
      router.replace("/dashboard");
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="text-xl font-semibold text-zinc-900">Login</div>
            <div className="mt-1 text-sm text-zinc-600">Sign in to manage projects and tasks.</div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <div className="text-black ">Email</div>
              <Input
                className="text-black"
                value={form.email}
                onChange={(e:any) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <div className=" mb-1 text-xs font-medium text-zinc-700">Password</div>
              <Input
                className="text-black"
                value={form.password}
                onChange={(e:any) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <Button disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 text-sm text-zinc-600">
            New here?{" "}
            <Link className="font-medium text-zinc-900 underline" href="/signup">
              Create an account
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

