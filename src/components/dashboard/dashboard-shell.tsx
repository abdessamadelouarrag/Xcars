"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CarFront,
  ChevronRight,
  Globe2,
  LayoutDashboard,
  Menu,
  Moon,
  Palette,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { AgencyRole, UserRole } from "@prisma/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NotificationMenu,
  type DashboardNotification,
} from "@/components/dashboard/notification-menu";
import { cn, initials } from "@/lib/utils";
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

const navigation = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  {
    href: "/dashboard/vehicules",
    label: "Véhicules",
    icon: CarFront,
    permission: "vehicles:read" as Permission,
  },
  {
    href: "/dashboard/reservations",
    label: "Réservations",
    icon: CalendarDays,
    permission: "reservations:read" as Permission,
  },
  {
    href: "/dashboard/personnalisation",
    label: "Site & thème",
    icon: Palette,
    permission: "theme:read" as Permission,
  },
  {
    href: "/dashboard/equipe",
    label: "Équipe",
    icon: Users,
    permission: "members:read" as Permission,
  },
  {
    href: "/dashboard/parametres",
    label: "Paramètres",
    icon: Settings,
    permission: "agency:read" as Permission,
  },
];

type DashboardShellProps = {
  children: React.ReactNode;
  agencyName: string;
  agencySlug: string;
  userName?: string | null;
  userEmail: string;
  unreadNotifications: number;
  notifications: DashboardNotification[];
  platformRole: UserRole;
  agencyRole: AgencyRole | null;
  grantedPermissions: string[];
};

export function DashboardShell({
  children,
  agencyName,
  agencySlug,
  userName,
  userEmail,
  unreadNotifications,
  notifications,
  platformRole,
  agencyRole,
  grantedPermissions,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const enabled =
      localStorage.getItem("xcars-theme") === "dark" ||
      (!localStorage.getItem("xcars-theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("xcars-theme", next ? "dark" : "light");
  }

  return (
    <div className="min-h-screen bg-muted/45">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        <SidebarContent
          pathname={pathname}
          agencyName={agencyName}
          agencySlug={agencySlug}
          platformRole={platformRole}
          agencyRole={agencyRole}
          grantedPermissions={grantedPermissions}
        />
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-card shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer"
            >
              <X />
            </Button>
            <SidebarContent
              pathname={pathname}
              agencyName={agencyName}
              agencySlug={agencySlug}
              platformRole={platformRole}
              agencyRole={agencyRole}
              grantedPermissions={grantedPermissions}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-17 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu />
          </Button>
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher un véhicule, une réservation…"
              className="h-10 w-full rounded-xl border border-border bg-muted/60 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
              aria-label="Recherche globale"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Changer de thème"
            >
              <Sun className="hidden dark:block" />
              <Moon className="dark:hidden" />
            </Button>
            <NotificationMenu
              initialNotifications={notifications}
              initialUnreadCount={unreadNotifications}
            />
            <div className="ml-2 hidden items-center gap-3 border-l border-border pl-4 sm:flex">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                {initials(userName)}
              </span>
              <div className="hidden leading-tight xl:block">
                <p className="max-w-40 truncate text-sm font-semibold">{userName}</p>
                <p className="max-w-40 truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ redirectTo: "/connexion" })}
              >
                Quitter
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Breadcrumb pathname={pathname} />
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  agencyName,
  agencySlug,
  platformRole,
  agencyRole,
  grantedPermissions,
  onNavigate,
}: {
  pathname: string;
  agencyName: string;
  agencySlug: string;
  platformRole: UserRole;
  agencyRole: AgencyRole | null;
  grantedPermissions: string[];
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-17 items-center gap-2 border-b border-border px-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <CarFront className="size-5" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">XCars</span>
      </div>
      <div className="px-3 py-5">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">
          Espace agence
        </p>
        <p className="mt-2 truncate px-3 text-sm font-semibold">{agencyName}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Navigation principale">
        {navigation.filter(
          (item) =>
            !item.permission ||
            hasPermission({
              platformRole,
              agencyRole,
              grantedPermissions,
              permission: item.permission,
            }),
        ).map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px]" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href={`/agence/${agencySlug}`}
          target="_blank"
          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <span className="flex items-center gap-3">
            <Globe2 className="size-[18px]" />
            Voir mon site
          </span>
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </>
  );
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Vue d’ensemble",
  vehicules: "Véhicules",
  nouveau: "Nouveau véhicule",
  reservations: "Réservations",
  personnalisation: "Personnalisation",
  equipe: "Équipe",
  parametres: "Paramètres",
};

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  return (
    <nav
      className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground"
      aria-label="Fil d’Ariane"
    >
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? <ChevronRight className="size-3" /> : null}
          <span className={index === segments.length - 1 ? "text-foreground" : ""}>
            {breadcrumbLabels[segment] ?? "Détail"}
          </span>
        </span>
      ))}
    </nav>
  );
}
