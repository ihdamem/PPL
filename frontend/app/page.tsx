import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Portal SiRuangan</h1>
        <p className="text-muted-foreground">
          Selamat datang di portal peminjaman ruangan kampus UGM. Silakan masuk untuk melanjutkan.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/login">Masuk</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
