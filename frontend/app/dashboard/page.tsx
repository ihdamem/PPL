"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Calendar, Building2, ClipboardList, User, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";

type UserRole = "booker" | "admin" | "superadmin";

type User = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  role: UserRole;
  nomor_induk?: string | null;
  departemen?: string | null;
  created_at?: string | null;
};

type RoomSchedule = {
  room_id: number;
  room_name: string;
  bookings: {
    waktu_mulai: string;
    waktu_selesai: string;
    status: string;
  }[];
};

const customerMenuItems = [
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
    href: "/dashboard/rooms",
  },
  {
    icon: ClipboardList,
    title: "Riwayat Pengajuan",
    desc: "Pantau status peminjaman yang pernah diajukan.",
    href: "/dashboard/booking/history",
  },
];

const adminMenuItems = [
  {
    icon: User,
    title: "Profil Saya",
    desc: "Kelola informasi profil akun.",
    href: "/dashboard/profile",
  },
  {
    icon: ShieldCheck,
    title: "Approval Peminjaman",
    desc: "Tinjau dan setujui/tolak pengajuan peminjaman ruangan.",
    href: "/dashboard/approval",
  },
  {
    icon: Building2,
    title: "Kelola Ruangan",
    desc: "Kelola data dan ketersediaan ruangan.",
    href: "/dashboard/rooms",
  },
  {
    icon: ClipboardList,
    title: "Monitoring Booking",
    desc: "Pantau seluruh pengajuan peminjaman ruangan.",
    href: "/dashboard/booking/history",
  },
];

const superadminMenuItems = [
  {
    icon: User,
    title: "Kelola User",
    desc: "Jadikan user sebagai admin atau booker.",
    href: "/dashboard/admin/users",
  },
];

const profileMenuItem = {
  icon: User,
  title: "Profil Saya",
  desc: "Kelola informasi profil akun.",
  href: "/dashboard/profile",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [schedules, setSchedules] = useState<RoomSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    setSchedulesLoading(true);
    fetch(`/api/bookings/schedule?tanggal=${selectedDate}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(() => setSchedulesLoading(false));
  }, [user, selectedDate]);

  let menuItems: typeof customerMenuItems = [];

  if (user) {
    switch (user.role) {
      case "admin":
        menuItems = [...adminMenuItems, profileMenuItem];
        break;

      case "superadmin":
        menuItems = [...adminMenuItems, ...superadminMenuItems, profileMenuItem];
        break;

      case "booker":
default:
        menuItems = [...customerMenuItems, profileMenuItem];
        break;
    }
  }

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
    <main className="min-h-screen bg-background">
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
            <NotificationBell className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" />
            <ThemeToggle className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
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
              <p className="mt-1 text-sm text-slate-400">
                {user.role === "superadmin"
                  ? "Superadmin"
                  : user.role === "admin"
                    ? "Admin"
                    : "Booker"}
              </p>
            </div>
          </div>
        </div>

        {/* Menu grid */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-ugm-blue/30 hover:shadow-md"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-ugm-blue text-white">
                <item.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Schedule Section */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Clock className="size-5 text-ugm-blue" />
                Jadwal Penggunaan Ruangan
              </h2>
              <p className="text-sm text-muted-foreground">Lihat ketersediaan ruangan secara real-time.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
              />
            </div>
          </div>

          {schedulesLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-muted-foreground">Memuat jadwal...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">Tidak ada data ruangan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-4 font-semibold text-foreground">Nama Ruangan</th>
                    <th className="p-4 font-semibold text-foreground">Status & Jam Terisi</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((room) => (
                    <tr key={room.room_id} className="border-b border-border hover:bg-muted/20">
                      <td className="p-4 font-medium text-foreground">{room.room_name}</td>
                      <td className="p-4">
                        {room.bookings.length === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Tersedia Sepenuhnya
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {room.bookings.map((b, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  b.status === "APPROVED"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                }`}
                                title={b.status === "APPROVED" ? "Sudah Disetujui" : "Menunggu Persetujuan"}
                              >
                                {b.waktu_mulai} - {b.waktu_selesai}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
