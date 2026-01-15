"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, HelpCircle, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Questions",
    icon: HelpCircle,
  },
  {
    href: "/admin/users",
    label: "Gestion des utilisateurs",
    icon: Users,
  },
  {
    href: "/admin/leaderboard",
    label: "Leaderboard",
    icon: BarChart3,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  className,
  onNavigate,
  userEmail,
  onLogout,
}: {
  className?: string;
  onNavigate?: () => void;
  userEmail?: string | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "h-full w-full flex flex-col",
        "bg-card/70 backdrop-blur-md",
        "border-r border-border/60",
        className,
      )}
    >
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-2">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-all",
                  "hover:border-primary/60 hover:bg-primary/10",
                  active
                    ? "border-primary/70 bg-primary/10 shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                    : "border-border/60 bg-card/40",
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-5 w-5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                  )}
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-semibold leading-tight",
                      active ? "text-foreground" : "text-foreground/90",
                    )}
                  >
                    {item.label}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-border/60" />

      <div className="p-4 space-y-3">
        <div className="rounded-lg border border-border/60 bg-card/50 p-3">
          <p className="text-xs text-muted-foreground">Connecté</p>
          <p className="text-sm font-medium text-foreground truncate">
            {userEmail || "Admin"}
          </p>
        </div>

        <Button variant="outline" className="w-full justify-start gap-2" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
