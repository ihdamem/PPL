"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Building2, ClipboardList, User, ArrowLeft, ShieldCheck } from "lucide-react";

type User = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
};

const menuItems = [
  {
    icon: Calendar,
    title: "Booking Ruangan",
    desc: "Ajukan atau lihat jadwal peminjaman ruangan.",
    href: "/dashboard/booking/new",
  },
  {
    icon: Building2,
    title: "Daftar Ruangan",
    desc: "Cek ketersediaan dan fasilitas ruangan kampus.",
    href: "#",
  },
  {
    icon: ClipboardList,
    title: "Riwayat Pengajuan",
    desc: "Pantau status peminjaman yang pernah diajukan.",
    href: "/dashboard/booking/history",
  },
  {
    icon: ShieldCheck,
    title: "Approval Peminjaman",
    desc: "Tinjau dan setujui/tolak pengajuan peminjaman ruangan.",
    href: "/dashboard/approval",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/");
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ugm-dark text-white">
        <p className="text-slate-300">Memuat dashboard…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
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
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <a href="/">
                <ArrowLeft className="mr-1 size-4" />
                Landing Page
              </a>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="bg-ugm-yellow text-ugm-dark hover:bg-[#ffe066]"
            >
              <LogOut className="mr-2 size-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Welcome banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-ugm-dark to-[#2a2a2a] p-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-ugm-yellow text-ugm-dark">
              <User className="size-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Selamat datang, {user.name || user.email}</h1>
              <p className="text-slate-300">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Menu grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-ugm-blue/30 hover:shadow-md"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-ugm-blue text-white">
                <item.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-ugm-dark">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
