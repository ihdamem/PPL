"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, Info, MessageSquare } from "lucide-react";
import Link from "next/link";

type Booking = {
  id: number;
  user_id: string;
  room_id: number;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  keperluan: string;
  status: string;
  jumlah_peserta: number;
};

export default function ApprovalDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    setLoading(true);
    fetch("/api/bookings", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        // Filter only pending bookings for approval dashboard
        const pending = data.filter((b: Booking) => b.status === "pending");
        setBookings(pending);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Setujui peminjaman ini?")) return;
    
    try {
      const res = await fetch(`/api/bookings/${id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        alert("Peminjaman disetujui!");
        fetchBookings();
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.detail}`);
      }
    } catch (err) {
      alert("Gagal menyetujui");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert("Alasan penolakan harus diisi");
    
    try {
      const res = await fetch(`/api/bookings/${rejectingId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject", alasan_penolakan: rejectReason }),
      });
      if (res.ok) {
        alert("Peminjaman ditolak.");
        setRejectingId(null);
        setRejectReason("");
        fetchBookings();
      } else {
        const errData = await res.json();
        alert(`Gagal: ${errData.detail}`);
      }
    } catch (err) {
      alert("Gagal menolak");
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Approval (Aldi)</h1>
          <p className="text-muted-foreground">Tinjau dan berikan keputusan untuk pengajuan peminjaman ruangan.</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card">
            <p className="text-muted-foreground">Memuat data pengajuan...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <CheckCircle className="mb-4 size-12 text-green-400 dark:text-green-500" />
            <h3 className="text-lg font-semibold text-foreground">Semua Beres!</h3>
            <p className="text-muted-foreground">Tidak ada pengajuan peminjaman yang menunggu persetujuan.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-card-foreground">{booking.keperluan}</h3>
                      <p className="text-sm text-muted-foreground">Pemohon: {booking.user_id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Info className="size-4 text-muted-foreground" />
                        <span>Ruangan ID: {booking.room_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="size-4 text-muted-foreground" />
                        <span>Peserta: {booking.jumlah_peserta} orang</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="size-4 text-muted-foreground" />
                        <span>Tanggal: {booking.tanggal}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="size-4 text-muted-foreground" />
                        <span>Waktu: {booking.waktu_mulai.slice(0, 5)} - {booking.waktu_selesai.slice(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <Button 
                      onClick={() => handleApprove(booking.id)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 size-4" />
                      Setujui
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setRejectingId(booking.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="mr-2 size-4" />
                      Tolak
                    </Button>
                  </div>
                </div>

                {rejectingId === booking.id && (
                  <div className="mt-6 rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                    <label className="mb-2 block text-sm font-semibold text-destructive flex items-center gap-2">
                      <MessageSquare className="size-4" />
                      Alasan Penolakan
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Tuliskan alasan kenapa pengajuan ini ditolak..."
                      className="w-full rounded-lg border border-destructive/30 bg-background text-foreground p-3 text-sm focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                      rows={3}
                    ></textarea>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="text-muted-foreground"
                      >
                        Batal
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleReject}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Kirim Penolakan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
