"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, ShieldCheck, BadgeCheck } from "lucide-react";
import Image from "next/image";

type UserProfile = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  role: string;
};

function getRoleLabel(role: string) {
  switch (role) {
    case "admin":
      return { label: "Admin", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30" };
    case "superadmin":
      return { label: "Superadmin", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30" };
    default:
      return { label: "Booker", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30" };
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Memuat profil…</p>
      </main>
    );
  }

  const { label: roleLabel, color: roleColor } = getRoleLabel(user.role);

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Header card */}
        <div className="rounded-2xl bg-gradient-to-br from-ugm-dark to-[#2a2a2a] p-8 text-white shadow-lg mb-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name || user.email}
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-ugm-yellow object-cover"
                  unoptimized
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-ugm-yellow bg-ugm-yellow text-ugm-dark">
                  <User className="size-10" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold">{user.name || "Pengguna"}</h1>
              <p className="text-slate-300 text-sm mt-1">{user.email}</p>
              <span
                className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${roleColor}`}
              >
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Detail card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-card-foreground">Informasi Akun</h2>

          {/* Nama */}
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ugm-blue/10 text-ugm-blue">
              <User className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Nama Lengkap</p>
              <p className="font-medium text-card-foreground">{user.name || "-"}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ugm-blue/10 text-ugm-blue">
              <Mail className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="font-medium text-card-foreground">{user.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ugm-blue/10 text-ugm-blue">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Peran</p>
              <span
                className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${roleColor}`}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          {/* ID Akun */}
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ugm-blue/10 text-ugm-blue">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">ID Akun (Google Sub)</p>
              <p className="font-mono text-xs text-muted-foreground break-all">{user.sub}</p>
            </div>
          </div>
        </div>

        {/* Info login */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Akun ini terhubung melalui Google SSO UGM. Untuk mengubah data profil, silakan perbarui di akun Google Anda.
        </p>
      </div>
    </main>
  );
}
