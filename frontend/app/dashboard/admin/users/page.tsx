"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRoleGuard, type UserRole } from "@/hooks/use-role-guard";
import {
  ArrowLeft,
  ShieldCheck,
  User as UserIcon,
  Search,
  RefreshCw,
} from "lucide-react";

export type UserProfile = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  role: UserRole;
  nomor_induk?: string | null;
  departemen?: string | null;
  created_at?: string | null;
};

function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    superadmin:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    admin:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    booker:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
  };

  const labels: Record<UserRole, string> = {
    superadmin: "Superadmin",
    admin: "Admin",
    booker: "Booker",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[role]}`}
    >
      {labels[role]}
    </span>
  );
}

export default function ManageUsersPage() {
  const router = useRouter();
  // Guard: hanya superadmin; selain itu redirect ke dashboard.
  const { user: currentUser, loading: guardLoading } = useRoleGuard(["superadmin"]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySub, setBusySub] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRes = await fetch("/api/admin/users", { credentials: "include" });
      if (!usersRes.ok) {
        const body = await usersRes.json().catch(() => ({}));
        throw new Error(body.detail || "Gagal memuat daftar user");
      }
      setUsers(await usersRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!guardLoading && currentUser) {
      loadUsers();
    }
  }, [guardLoading, currentUser, loadUsers]);

  const handleSetRole = async (target: UserProfile, role: "booker" | "admin") => {
    setBusySub(target.sub);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(target.sub)}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Gagal mengubah role");
      }
      const updated: UserProfile = await res.json();
      setUsers((prev) => prev.map((u) => (u.sub === updated.sub ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusySub(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
    );
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ugm-dark text-white">
        <p className="text-slate-300">Memuat…</p>
      </main>
    );
  }

  if (error && !currentUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ugm-dark text-white">
        <p className="text-slate-300">{error}</p>
        <Button variant="outline" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ugm-dark/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ugm-yellow font-extrabold text-ugm-dark">
              SR
            </span>
            <span className="text-lg font-extrabold tracking-tight">SiRuangan</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-1 size-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="bg-ugm-yellow text-ugm-dark hover:bg-[#ffe066]"
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Title */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <ShieldCheck className="size-7 text-ugm-blue" />
              Kelola User
            </h1>
            <p className="text-sm text-muted-foreground">
              Jadikan user sebagai admin agar dapat mengelola ruangan dan menyetujui peminjaman.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau email…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Users table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                    Tidak ada user yang cocok.
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const isSelf = currentUser?.sub === u.sub;
                const isSuper = u.role === "superadmin";
                const busy = busySub === u.sub;

                return (
                  <tr key={u.sub} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ugm-blue/10 text-ugm-blue">
                          <UserIcon className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium">{u.name || u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {isSuper || isSelf ? (
                          <span className="text-xs text-muted-foreground">
                            {isSelf ? "(Anda)" : "(Tidak dapat diubah)"}
                          </span>
                        ) : u.role === "admin" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleSetRole(u, "booker")}
                          >
                            Jadikan Booker
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => handleSetRole(u, "admin")}
                            className="bg-ugm-blue text-white hover:bg-ugm-blue-dark"
                          >
                            Jadikan Admin
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
