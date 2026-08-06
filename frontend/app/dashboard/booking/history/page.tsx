"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Tag, Info } from "lucide-react";
import Link from "next/link";

type Booking = {
  id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  keperluan: string;
  status: string;
  created_at: string;
};

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/app/api/bookings", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data");
        return res.json();
      })
      .then((data) => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ugm-dark"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-ugm-dark">Riwayat Peminjaman</h1>
          </div>
          <Button asChild className="bg-ugm-dark text-white hover:bg-ugm-dark/90">
            <Link href="/dashboard/booking/new">Buat Peminjaman Baru</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
            <p className="text-slate-500">Memuat riwayat...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Info className="mb-4 size-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">Belum ada peminjaman</h3>
            <p className="mb-6 text-slate-500">Kamu belum pernah mengajukan peminjaman ruangan.</p>
            <Button asChild variant="outline">
              <Link href="/dashboard/booking/new">Mulai Pinjam Sekarang</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800">{booking.keperluan}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-4" />
                      {new Date(booking.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-4" />
                      {booking.waktu_mulai.slice(0, 5)} - {booking.waktu_selesai.slice(0, 5)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="size-4" />
                      ID: #{booking.id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-slate-100 pt-4 md:border-0 md:pt-0">
                  <Button variant="outline" size="sm" className="text-xs">
                    Lihat Detail
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
