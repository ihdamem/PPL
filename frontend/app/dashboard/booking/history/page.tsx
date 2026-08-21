"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Tag, Info, X } from "lucide-react";
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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetch("/api/bookings", { credentials: "include" })
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
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30";
      case "approved":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Riwayat Peminjaman</h1>
          </div>
          <Button asChild className="bg-ugm-dark text-white hover:bg-ugm-dark/90">
            <Link href="/dashboard/booking/new">Buat Peminjaman Baru</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card">
            <p className="text-muted-foreground">Memuat riwayat...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <Info className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Belum ada peminjaman</h3>
            <p className="mb-6 text-muted-foreground">Kamu belum pernah mengajukan peminjaman ruangan.</p>
            <Button asChild variant="outline">
              <Link href="/dashboard/booking/new">Mulai Pinjam Sekarang</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-card-foreground">{booking.keperluan}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-2 border-t border-border pt-4 md:border-0 md:pt-0">
                  <button onClick={() => setSelectedBooking(booking)} className="inline-block rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                    Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedBooking(null)}>
          <div className="relative bg-card p-6 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedBooking(null)}>
              <X className="size-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">{selectedBooking.keperluan}</h2>
            <p className="mb-2"><span className="font-semibold">Status:</span> {selectedBooking.status}</p>
            <p className="mb-2"><span className="font-semibold">Tanggal:</span> {new Date(selectedBooking.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="mb-2"><span className="font-semibold">Waktu:</span> {selectedBooking.waktu_mulai.slice(0,5)} - {selectedBooking.waktu_selesai.slice(0,5)}</p>
            <p className="mb-2"><span className="font-semibold">ID:</span> #{selectedBooking.id}</p>
          </div>
        </div>
      )}
    </main>
  );
}
