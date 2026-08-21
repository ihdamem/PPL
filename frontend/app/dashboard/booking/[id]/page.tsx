"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Tag, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type BookingDetail = {
  id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  keperluan: string;
  status: string;
  created_at: string;
  // add any other fields you may have in the backend response
};

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/bookings/${params.id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat detail booking");
        return res.json();
      })
      .then((data) => {
        setBooking(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Memuat detail...</p>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="flex h-64 flex-col items-center justify-center">
          <Info className="mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Booking tidak ditemukan</h3>
          <Button asChild className="mt-4">
            <Link href="/dashboard/booking/history">Kembali ke Riwayat</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard/booking/history" className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Kembali ke Riwayat
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-6">Detail Booking #{booking.id}</h1>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">{booking.keperluan}</p>
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
                Status: {booking.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
