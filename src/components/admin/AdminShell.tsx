"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import CyberBackground from "@/components/CyberBackground";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <CyberBackground />
        <div className="text-center relative z-20">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <CyberBackground />
      <div className="relative z-20">
        {/* Desktop sidebar */}
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:w-72 md:block">
          <AdminSidebar userEmail={user?.email} onLogout={logout} />
        </aside>

        {/* Main */}
        <div className="md:pl-72">
          {/* Mobile topbar */}
          <div className="md:hidden sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Ouvrir le menu admin">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <AdminSidebar
                    userEmail={user?.email}
                    onLogout={logout}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              <p className="font-bold text-foreground">Admin</p>
              <div className="w-10" />
            </div>
          </div>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
