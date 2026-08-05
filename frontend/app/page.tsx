"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type User = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Portal SiRuangan</h1>
        <p className="text-muted-foreground">
          Selamat datang di portal peminjaman ruangan kampus UGM. Silakan masuk untuk melanjutkan.
        </p>
        <div className="flex justify-center gap-4">
          {loading ? (
            <Button disabled>Memuat…</Button>
          ) : user ? (
            <Button asChild>
              <Link href="/dashboard">Buka Dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/login">Masuk</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
