"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowLeft, Calendar, Building2, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

type User = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
};

const highlights = [
  { icon: Calendar, label: "Jadwal Real-time", desc: "Cek ketersediaan ruangan langsung." },
  { icon: Building2, label: "Semua Ruangan Kampus", desc: "Cari ruangan berdasarkan kapasitas & fasilitas." },
  { icon: ShieldCheck, label: "Aman & Tercatat", desc: "Setiap aksi tercatat dalam audit log." },
];

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-ugm-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ugm-dark/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ugm-yellow font-extrabold text-ugm-dark">
              SR
            </span>
            <span className="text-lg font-extrabold tracking-tight">SiRuangan</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a href="/">
                <ArrowLeft className="mr-1 size-4" />
                Kembali ke Landing Page
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-ugm-yellow">
              Portal Peminjaman Ruangan
            </p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Ajukan dan Pantau Peminjaman Ruangan Kampus UGM
            </h1>
            <p className="text-lg text-slate-300">
              Masuk dengan akun Google institusi untuk mulai mencari ruangan, mengajukan booking,
              dan memantau status persetujuan.
            </p>

            <div className="flex flex-wrap gap-3">
              {loading ? (
                <Button disabled className="bg-ugm-yellow text-ugm-dark hover:bg-[#ffe066]">
                  Memuat…
                </Button>
              ) : user ? (
                <Button
                  asChild
                  className="bg-ugm-yellow text-ugm-dark hover:bg-[#ffe066]"
                >
                  <Link href="/dashboard">
                    Buka Dashboard
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="bg-ugm-yellow text-ugm-dark hover:bg-[#ffe066]"
                >
                  <a href="/api/auth/google">
                    <LogIn className="mr-2 size-4" />
                    Masuk dengan Google
                  </a>
                </Button>
              )}
            </div>

            {user && (
              <p className="text-sm text-slate-400">
                Masuk sebagai <span className="font-medium text-white">{user.name || user.email}</span>
              </p>
            )}
          </div>

          {/* Highlight cards */}
          <div className="space-y-4">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur transition hover:bg-white/10"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ugm-yellow text-ugm-dark">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.label}</h3>
                  <p className="text-sm text-slate-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-400">
        <p>&copy; 2026 SiRuangan — Sistem Peminjaman Ruangan Kampus UGM.</p>
      </footer>
    </main>
  );
}
