"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Building2, ClipboardList, User } from "lucide-react";

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
    href: "#",
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
    href: "#",
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
        router.replace("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memuat dashboard…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang di portal peminjaman ruangan kampus UGM.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/">Beranda Portal</Link>
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Keluar
            </Button>
          </div>
        </div>

        {/* User card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <User className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name || user.email}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Menu grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
