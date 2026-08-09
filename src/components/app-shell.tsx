import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarHeart,
  Home,
  MessageCircleHeart,
  Sparkles,
  Users,
  UserRound,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MitraMark } from "./mitra-mark";

export type ShellRole = "caregiver" | "family";

type NavItem = { to: string; label: string; icon: LucideIcon };

const caregiverNav: NavItem[] = [
  { to: "/caregiver", label: "Today's Care", icon: Home },
  { to: "/care-plan", label: "Care Plan", icon: CalendarHeart },
  { to: "/assistant", label: "Assistant", icon: Sparkles },
  { to: "/caregiver/profile", label: "Profile", icon: UserRound },
];

const familyNav: NavItem[] = [
  { to: "/family", label: "Home", icon: Home },
  { to: "/shared", label: "Care Circle", icon: Users },
  { to: "/care-plan", label: "Care Plan", icon: CalendarHeart },
  { to: "/assistant", label: "Assistant", icon: Sparkles },
];

const familyExtras: NavItem[] = [
  { to: "/family/request", label: "Care request", icon: ClipboardList },
  { to: "/family/matches", label: "Matches", icon: MessageCircleHeart },
];

export function AppShell({
  role,
  title,
  subtitle,
  action,
  children,
}: {
  role: ShellRole;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const nav = role === "caregiver" ? caregiverNav : familyNav;
  const extras = role === "family" ? familyExtras : [];
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <MitraMark className="h-9 w-9" />
          <div className="min-w-0">
            <p className="font-display text-lg leading-none font-semibold">Mitra</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">Care is better together.</p>
          </div>
        </Link>

        <SideGroup
          label={role === "caregiver" ? "Caregiver" : "Family"}
          items={nav}
          pathname={pathname}
        />
        {extras.length > 0 && <SideGroup label="Find care" items={extras} pathname={pathname} />}

        <div className="mt-auto rounded-2xl bg-sage p-4 text-sage-foreground">
          <p className="text-sm font-semibold">Need a hand?</p>
          <p className="mt-1 text-xs opacity-90">
            Mitra support answers within a few hours, every day of the week.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur lg:hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <MitraMark className="h-8 w-8 shrink-0" />
              <span className="truncate font-display text-lg font-semibold">Mitra</span>
            </Link>
            <Link
              to={role === "caregiver" ? "/caregiver/profile" : "/shared"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
              aria-label="Open profile"
            >
              {role === "caregiver" ? "PN" : "AR"}
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
              )}
            </div>
            {action}
          </div>
          <div className="mt-6 space-y-6">{children}</div>
        </main>

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
            {nav.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <li key={item.to} className="flex-1">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-medium transition-colors",
                      active ? "bg-secondary text-primary" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", active && "text-primary")} aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function SideGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="mb-6">
      <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-foreground/80 hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function isActive(pathname: string, to: string) {
  if (to === "/caregiver" || to === "/family") return pathname === to;
  return pathname === to || pathname.startsWith(to + "/");
}
