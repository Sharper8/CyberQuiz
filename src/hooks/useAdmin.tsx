"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api-client";

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    try {
      const result = await api.getCurrentUser();
      
      if (!result.authenticated || !result.user) {
        setIsAdmin(false);
        setUser(null);
        router.push("/admin-login");
      } else {
        setUser(result.user);
        setIsAdmin(result.user.role === 'admin');
      }
    } catch (error) {
      setIsAdmin(false);
      setUser(null);
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      setIsAdmin(false);
      router.push("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/admin-login");
    }
  };

  return { user, isAdmin, loading, logout };
}
