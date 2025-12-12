"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import {
  Sparkles,
  LayoutDashboard,
  Users,
  Search,
  MessageSquare,
  ShoppingBag,
  Trophy,
  Gamepad2,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Heart,
  Upload,
  Rss,
  UserCog,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Feed", href: "/feed", icon: Rss },
  { name: "Team", href: "/team", icon: Users },
  { name: "Directory", href: "/directory", icon: Search },
  { name: "Shoutouts", href: "/shoutouts", icon: MessageSquare },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Mentorship", href: "/mentorship", icon: Heart },
  { name: "Challenges", href: "/challenges", icon: Gamepad2 },
  { name: "Cards", href: "/cards", icon: CreditCard },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

const adminNavigation = [
  { name: "Members", href: "/admin/members", icon: UserCog },
  { name: "Upload Strengths", href: "/admin/upload", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border/50 transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 h-16 px-4 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-domain-executing via-domain-influencing to-domain-strategic flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg">StrengthSync</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Organization name */}
        {session?.user?.organizationName && (
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Organization</p>
            <p className="font-medium text-sm truncate">{session.user.organizationName}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border/50">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Avatar size="default">
                <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ""} />
                <AvatarFallback>{getInitials(session?.user?.name || "U")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")}
              />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-1 bg-card border border-border rounded-xl shadow-soft-lg">
                <Link
                  href="/settings/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between h-full px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationBell />

              {/* Quick shoutout button */}
              <Button variant="influencing" size="sm" asChild>
                <Link href="/shoutouts/create">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Give Shoutout
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
