"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Users, FileText, Send } from "lucide-react";
import Link from "next/link";

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Client-side validation: waktu selesai harus setelah waktu mulai
    const waktuMulai = formData.get("waktu_mulai") as string;
    const waktuSelesai = formData.get("waktu_selesai") as string;
    if (waktuSelesai <= waktuMulai) {
      setError("Waktu selesai harus setelah waktu mulai.");
      setLoading(false);
      return;
    }

    // Client-side validation: keperluan minimal 5 karakter
    const keperluan = formData.get("keperluan") as string;
    if (keperluan.trim().length < 5) {
      setError("Keperluan harus diisi minimal 5 karakter.");
      setLoading(false);
      return;
    }

    // Client-side validation: jumlah peserta harus > 0
    const jumlahPeserta = parseInt(formData.get("jumlah_peserta") as string);
    if (isNaN(jumlahPeserta) || jumlahPeserta <= 0) {
      setError("Jumlah peserta harus lebih dari 0.");
      setLoading(false);
      return;
    }

    // Client-side validation: file PDF max 5MB
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError("Ukuran file surat permohonan maksimal 5MB.");
      setLoading(false);
      return;
    }
    if (file && file.type !== "application/pdf") {
      setError("File surat permohonan harus berformat PDF.");
      setLoading(false);
      return;
    }

    const data = {
      room_id: 1, // Hardcoded for now, will come from room selection page
      tanggal: formData.get("tanggal"),
      waktu_mulai: waktuMulai,
      waktu_selesai: waktuSelesai,
      keperluan: keperluan,
      jumlah_peserta: jumlahPeserta,
      surat_url: file ? file.name : null,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal mengajukan peminjaman");
      }

      router.push("/app/dashboard/booking/history");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Dashboard
        </Link>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Form Peminjaman Ruangan</h1>
            <p className="text-muted-foreground">Isi detail peminjaman ruangan di bawah ini.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  Tanggal Peminjaman
                </label>
                <input
                  required
                  name="tanggal"
                  type="date"
                  className="w-full rounded-lg border border-input bg-background text-foreground p-2.5 text-sm focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  Jumlah Peserta
                </label>
                <input
                  required
                  name="jumlah_peserta"
                  type="number"
                  min="1"
                  placeholder="Contoh: 10"
                  className="w-full rounded-lg border border-input bg-background text-foreground p-2.5 text-sm focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  Waktu Mulai
                </label>
                <input
                  required
                  name="waktu_mulai"
                  type="time"
                  className="w-full rounded-lg border border-input bg-background text-foreground p-2.5 text-sm focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  Waktu Selesai
                </label>
                <input
                  required
                  name="waktu_selesai"
                  type="time"
                  className="w-full rounded-lg border border-input bg-background text-foreground p-2.5 text-sm focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Keperluan / Acara
              </label>
              <textarea
                required
                name="keperluan"
                rows={3}
                placeholder="Jelaskan tujuan peminjaman ruangan..."
                className="w-full rounded-lg border border-input bg-background text-foreground p-2.5 text-sm focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Upload Surat Permohonan (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                className="w-full cursor-pointer rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-ugm-dark file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:bg-muted"
              />
              <p className="text-xs text-muted-foreground italic">* Maksimal 5MB</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-ugm-dark text-white hover:bg-ugm-dark/90"
            >
              {loading ? (
                "Mengirim..."
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  Ajukan Peminjaman
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
