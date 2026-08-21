"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  MapPin,
  Users,
  CheckCircle2,
  Wrench,
  Pencil,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Room = {
  id: number;
  name: string;
  location: string;
  capacity: number;
  facilities: string[];
  description: string | null;
  status: "available" | "maintenance";
};

type UserProfile = {
  email: string;
  name?: string;
  sub: string;
  role: "booker" | "admin" | "superadmin";
};

const emptyForm = {
  name: "",
  location: "",
  capacity: "",
  facilities: "",
  description: "",
  status: "available" as Room["status"],
};

export default function RoomsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Form state untuk tambah/edit.
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, roomsRes] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/rooms", { credentials: "include" }),
      ]);

      if (!meRes.ok) throw new Error("Silakan login terlebih dahulu");
      setUser(await meRes.json());

      if (!roomsRes.ok) {
        const body = await roomsRes.json().catch(() => ({}));
        throw new Error(body.detail || "Gagal memuat daftar ruangan");
      }
      setRooms(await roomsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (room: Room) => {
    setEditingId(room.id);
    setForm({
      name: room.name,
      location: room.location,
      capacity: String(room.capacity),
      facilities: room.facilities.join(", "),
      description: room.description ?? "",
      status: room.status,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
      facilities: form.facilities
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      description: form.description.trim() || null,
      status: form.status,
    };

    try {
      const res = await fetch(
        editingId ? `/api/rooms/${editingId}` : "/api/rooms",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Gagal menyimpan ruangan");
      }

      closeForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!window.confirm(`Hapus ruangan "${room.name}"?`)) return;

    setDeletingId(room.id);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Gagal menghapus ruangan");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setDeletingId(null);
    }
  };

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

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-ugm-blue text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daftar Ruangan</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? "Kelola data ruangan: tambah, ubah, atau hapus."
                  : "Pilih ruangan yang sesuai dengan kebutuhan peminjaman Anda."}
              </p>
            </div>
          </div>
          {isAdmin && !formOpen && (
            <Button onClick={openCreateForm} className="bg-ugm-blue text-white hover:bg-ugm-blue-dark">
              <Plus className="mr-2 size-4" />
              Tambah Ruangan
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Form tambah/edit */}
        {formOpen && (
          <form
            onSubmit={handleSave}
            className="mb-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editingId ? "Edit Ruangan" : "Tambah Ruangan Baru"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Tutup form"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nama Ruangan *</label>
                <input
                  required
                  minLength={3}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Ruang Rapat B.2"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lokasi *</label>
                <input
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Contoh: Lantai 3, Gedung B"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Kapasitas *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="Contoh: 30"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Room["status"] })
                  }
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                >
                  <option value="available">Tersedia</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Fasilitas (pisahkan dengan koma)
                </label>
                <input
                  value={form.facilities}
                  onChange={(e) => setForm({ ...form, facilities: e.target.value })}
                  placeholder="Contoh: Proyektor, AC, Whiteboard"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Deskripsi</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat ruangan…"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:border-ugm-yellow focus:outline-none focus:ring-1 focus:ring-ugm-yellow"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="bg-ugm-dark text-white hover:bg-ugm-dark/90"
              >
                {saving ? "Menyimpan…" : editingId ? "Simpan Perubahan" : "Tambah Ruangan"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                Batal
              </Button>
            </div>
          </form>
        )}

        {/* Daftar ruangan */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Memuat ruangan…</div>
        ) : rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Belum ada ruangan terdaftar.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                  formOpen || deletingId === room.id ? "opacity-50" : "border-border"
                }`}
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

                {room.description && (
                  <p className="mb-4 text-sm text-muted-foreground">{room.description}</p>
                )}

                <div className="space-y-3 text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    Kapasitas: {room.capacity} orang
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    Fasilitas:{" "}
                    {room.facilities.length > 0 ? room.facilities.join(", ") : "—"}
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  {isAdmin ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(room)}
                        disabled={formOpen || deletingId === room.id}
                        className="flex-1"
                      >
                        <Pencil className="mr-1 size-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(room)}
                        disabled={formOpen || deletingId === room.id}
                        className="flex-1"
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        {deletingId === room.id ? "Menghapus…" : "Hapus"}
                      </Button>
                    </>
                  ) : (
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
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
