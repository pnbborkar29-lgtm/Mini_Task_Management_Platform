"use client";

import  {useState,useEffect} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/auth";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={`w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 ${className}`}
      {...props}
    />
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-zinc-900">{title}</div>
      {children}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight text-zinc-900">Mini Task Platform</div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard")}
              className={pathname === "/dashboard" ? "ring-1 ring-zinc-300" : ""}
            >
              Dashboard
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/projects")}
              className={pathname?.startsWith("/projects") ? "ring-1 ring-zinc-300" : ""}
            >
              Projects
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/tasks")}
              className={pathname?.startsWith("/tasks") ? "ring-1 ring-zinc-300" : ""}
            >
              Tasks
            </Button>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
        {children}
        <div className="mt-10 text-xs text-zinc-500">
          API:{" "}
          <Link className="underline" href={(process.env.NEXT_PUBLIC_API_BASE_URL ?? "") + "/docs"} target="_blank">
            Swagger docs
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);
  return <>{children}</>;
}

