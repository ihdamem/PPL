"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "booker" | "admin" | "superadmin";

export type SessionUser = {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  role: UserRole;
  nomor_induk?: string | null;
  departemen?: string | null;
  created_at?: string | null;
};

/**
 * Guard peran di sisi klien: ambil sesi dari /api/auth/me, lalu
 * redirect ke /dashboard bila role tidak termasuk yang diizinkan.
 *
 * Catatan: ini pengaman UI; backend tetap memvalidasi role di setiap endpoint.
 */
export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthenticated");
        const me: SessionUser = await res.json();

        if (!allowedRoles.includes(me.role)) {
          // Role tidak diizinkan -> kembali ke dashboard.
          router.replace("/dashboard");
          return;
        }

        if (!cancelled) setUser(me);
      })
      .catch(() => {
        router.replace("/");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}
