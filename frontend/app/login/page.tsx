"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, ArrowLeft } from "lucide-react";

type User = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          router.replace("/dashboard");
        } else {
          setUser(null);
          setLoading(false);
        }
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Memuat…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Masuk Portal</h1>
          <p className="text-sm text-muted-foreground">
            Gunakan akun Google Anda untuk masuk ke SiRuangan.
          </p>
        </div>
        <Button asChild className="w-full">
          <a href="/api/auth/google">
            <LogIn className="mr-2 size-4" />
            Masuk dengan Google
          </a>
        </Button>
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 size-4" />
            Kembali ke beranda portal
          </Link>
        </div>
      </div>
    </main>
  );
}
