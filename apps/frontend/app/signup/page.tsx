"use client";

import  {useState,useEffect} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { apiFetch, ApiClientError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Button, Input } from "@/components/ui";

const SignupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: any) {
    e.preventDefault();
    setError(null);

    const payload = { ...form, name: form.name.trim() || undefined };
    const parsed = SignupSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ user: { id: string; email: string; name?: string | null }; token: string }>(
        "/auth/signup",
        { method: "POST", body: parsed.data },
      );
      setToken(data.token);
      router.replace("/dashboard");
    } catch (e:any) {
      const msg = e instanceof ApiClientError ? e.message : "Signup failed";
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
            <div className="text-xl font-semibold text-zinc-900">Create account</div>
            <div className="mt-1 text-sm text-zinc-600">It takes under a minute.</div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-700">Name (optional)</div>
              <Input value={form.name} onChange={(e:any) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-700">Email</div>
              <Input
                value={form.email}
                onChange={(e:any) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-700">Password</div>
              <Input
                value={form.password}
                onChange={(e:any) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="Min 8 characters"
                type="password"
                autoComplete="new-password"
              />
            </div>

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <Button disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <div className="mt-5 text-sm text-zinc-600">
            Already have an account?{" "}
            <Link className="font-medium text-zinc-900 underline" href="/login">
              Login
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

