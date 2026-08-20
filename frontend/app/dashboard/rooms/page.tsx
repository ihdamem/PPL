"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CalendarClock, MapPin, Users, CheckCircle2, Wrench } from "lucide-react";

const rooms = [
  {
    id: 1,
    name: "Ruang A.1",
    capacity: 25,
    location: "Lantai 2, Gedung A",
    status: "available",
    facilities: ["Proyektor", "Whiteboard", "AC"],
    description: "Ruang pertemuan kecil untuk rapat dosen atau diskusi tim.",
  },
  {
    id: 2,
    name: "Ruang Seminar 1",
    capacity: 60,
    location: "Lantai 3, Gedung B",
    status: "available",
    facilities: ["Proyektor", "Audio", "Koneksi Wi-Fi"],
    description: "Ruang seminar dengan kapasitas menengah untuk presentasi dan kelas.",
  },
  {
    id: 3,
    name: "Ruang Sidang",
    capacity: 15,
    location: "Lantai 1, Gedung C",
    status: "maintenance",
    facilities: ["LCD", "AC"],
    description: "Ruang sidang untuk rapat formal dan evaluasi administratif.",
  },
  {
    id: 4,
    name: "Lab Komputer A",
    capacity: 40,
    location: "Lantai 2, Gedung Informatika",
    status: "available",
    facilities: ["PC", "Proyektor", "Whiteboard"],
    description: "Lab komputer untuk kegiatan praktikum dan pelatihan teknologi.",
  },
];

export default function RoomsPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Dashboard
        </Link>

        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-ugm-blue text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daftar Ruangan</h1>
              <p className="text-sm text-muted-foreground">
                Pilih ruangan yang sesuai dengan kebutuhan peminjaman Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{room.name}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {room.location}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    room.status === "available"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {room.status === "available" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Wrench className="size-3.5" />
                  )}
                  {room.status === "available" ? "Tersedia" : "Maintenance"}
                </span>
              </div>

              <p className="mb-4 text-sm text-muted-foreground">{room.description}</p>

              <div className="space-y-3 text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  Kapasitas: {room.capacity} orang
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  Fasilitas: {room.facilities.join(", ")}
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={
                    room.status === "available"
                      ? `/dashboard/booking/new?roomId=${room.id}`
                      : "#"
                  }
                  className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    room.status === "available"
                      ? "bg-ugm-dark text-white hover:bg-ugm-dark/90"
                      : "pointer-events-none cursor-not-allowed bg-muted text-muted-foreground"
                  }`}
                >
                  {room.status === "available" ? "Pilih Ruangan" : "Tidak Tersedia"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
