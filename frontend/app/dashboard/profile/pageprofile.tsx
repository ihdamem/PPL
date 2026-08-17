"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

type UserRole = "user" | "admin" | "approver";

type UserProfile = {
  email: string;
  name?: string | null;
  picture?: string | null;
  sub: string;
  role: UserRole;
  nomor_induk?: string | null;
  departemen?: string | null;
  created_at?: string | null;
};

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "admin":
      return "Admin";

    case "approver":
      return "Approver";

    case "user":
    default:
      return "Customer / Booker";
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [nomorInduk, setNomorInduk] = useState("");
  const [departemen, setDepartemen] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/");
            return;
          }

          throw new Error("Gagal mengambil data profil.");
        }

        const data: UserProfile = await response.json();

        setProfile(data);
        setName(data.name ?? "");
        setNomorInduk(data.nomor_induk ?? "");
        setDepartemen(data.departemen ?? "");
      } catch (err) {
        console.error(err);
        setError("Gagal memuat profil. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !nomorInduk.trim() || !departemen.trim()) {
      setError(
        "Nama, nomor induk, dan departemen wajib diisi."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          nomor_induk: nomorInduk.trim(),
          departemen: departemen.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Gagal menyimpan profil."
        );
      }

      setProfile(data);

      setName(data.name ?? "");
      setNomorInduk(data.nomor_induk ?? "");
      setDepartemen(data.departemen ?? "");

      setSuccess("Profil berhasil disimpan.");
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Gagal menyimpan profil.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Memuat profil...</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">
            Data profil tidak dapat ditemukan.
          </p>

          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 size-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const isComplete =
    Boolean(name.trim()) &&
    Boolean(nomorInduk.trim()) &&
    Boolean(departemen.trim());

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ugm-dark/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ugm-yellow font-extrabold text-ugm-dark">
              SR
            </span>

            <span className="text-lg font-extrabold tracking-tight">
              SiRuangan
            </span>
          </Link>

          <ThemeToggle className="border-white/20 text-white hover:bg-white/10 hover:text-white" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Back */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke Dashboard
        </Link>

        {/* Page title */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Profil Saya
            </h1>

            <p className="mt-1 text-muted-foreground">
              Kelola informasi profil akun SiRuangan.
            </p>
          </div>

          {isComplete && (
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              Profil lengkap
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Profile summary */}
          <section className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                {profile.picture ? (
                  <img
                    src={profile.picture}
                    alt={profile.name || profile.email}
                    className="size-24 rounded-full object-cover ring-4 ring-muted"
                  />
                ) : (
                  <div className="grid size-24 place-items-center rounded-full bg-ugm-yellow text-ugm-dark ring-4 ring-muted">
                    <User className="size-10" />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-semibold">
                {profile.name || "Nama belum diisi"}
              </h2>

              <p className="mt-1 break-all text-sm text-muted-foreground">
                {profile.email}
              </p>

              <div className="mt-4 rounded-full bg-muted px-3 py-1 text-sm font-medium">
                {getRoleLabel(profile.role)}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-sm font-medium">
                Hak akses
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {profile.role === "admin"
                  ? "Dapat mengelola sistem dan memantau peminjaman."
                  : profile.role === "approver"
                    ? "Dapat meninjau dan memproses approval peminjaman."
                    : "Dapat mengajukan dan memantau peminjaman ruangan."}
              </p>
            </div>
          </section>

          {/* Profile form */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Informasi Profil
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Informasi akun tertentu tidak dapat diubah oleh pengguna.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                />

                <p className="text-xs text-muted-foreground">
                  Email berasal dari akun Google dan tidak dapat diubah.
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nama
                </Label>

                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Masukkan nama lengkap"
                  maxLength={200}
                  required
                />
              </div>

              {/* NIM */}
              <div className="space-y-2">
                <Label htmlFor="nomor_induk">
                  Nomor Induk / NIM
                </Label>

                <Input
                  id="nomor_induk"
                  type="text"
                  value={nomorInduk}
                  onChange={(event) =>
                    setNomorInduk(event.target.value)
                  }
                  placeholder="Masukkan nomor induk / NIM"
                  maxLength={100}
                  required
                />
              </div>

              {/* Departemen */}
              <div className="space-y-2">
                <Label htmlFor="departemen">
                  Departemen / Unit
                </Label>

                <Input
                  id="departemen"
                  type="text"
                  value={departemen}
                  onChange={(event) =>
                    setDepartemen(event.target.value)
                  }
                  placeholder="Masukkan departemen / unit"
                  maxLength={200}
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role
                </Label>

                <Input
                  id="role"
                  value={getRoleLabel(profile.role)}
                  disabled
                  readOnly
                />

                <p className="text-xs text-muted-foreground">
                  Role ditentukan oleh sistem dan tidak dapat diubah dari
                  halaman profil.
                </p>
              </div>

              {/* Created at */}
              <div className="space-y-2">
                <Label htmlFor="created_at">
                  Tanggal Terdaftar
                </Label>

                <Input
                  id="created_at"
                  value={formatDate(profile.created_at)}
                  disabled
                  readOnly
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-4" />
                  {success}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end border-t border-border pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-ugm-yellow text-ugm-dark hover:bg-[#ffe066]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}