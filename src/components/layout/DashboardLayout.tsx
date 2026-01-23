"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import {
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
  BarChart3,
  ClipboardList,
  Database,
  Bot,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/brand/Logo";
import { PageTransition } from "@/components/layout/PageTransition";

// Navigation organized by user workflow (CliftonStrengths journey)
const navigationSections = [
  {
    label: null, // Primary item - no section label
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Me",
    items: [
      { name: "My Strengths", href: "/strengths", icon: Sparkles },
      { name: "My Reviews", href: "/reviews", icon: ClipboardList },
      { name: "Mentorship", href: "/mentorship", icon: Heart },
    ],
  },
  {
    label: "Team",
    items: [
      { name: "Ask AI", href: "/chat", icon: Bot },
      { name: "Team Analytics", href: "/team", icon: Users },
      { name: "Directory", href: "/directory", icon: Search },
      { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Connect",
    items: [
      { name: "Feed", href: "/feed", icon: Rss },
      { name: "Shoutouts", href: "/shoutouts", icon: MessageSquare },
      { name: "Skill Marketplace", href: "/marketplace", icon: ShoppingBag },
      { name: "Challenges", href: "/challenges", icon: Gamepad2 },
    ],
  },
];

const managerNavigation = [
  { name: "Manager Dashboard", href: "/admin/dashboard", icon: BarChart3 },
  { name: "Performance Reviews", href: "/admin/review-cycles", icon: ClipboardList },
];

const adminNavigation = [
  { name: "Members", href: "/admin/members", icon: UserCog },
  { name: "Upload Strengths", href: "/admin/upload", icon: Upload },
  { name: "Bulk Import", href: "/admin/import", icon: UserPlus },
  { name: "Strength Constants", href: "/admin/constants", icon: Database },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Role-based access flags
  const role = session?.user?.role;
  const isAdmin = role === "OWNER" || role === "ADMIN";
  const isManagerOrAbove = role === "OWNER" || role === "ADMIN" || role === "MANAGER";

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

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
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border/50 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border/50 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo size="default" showText />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          {navigationSections.map((section) => (
            <div key={section.label || "primary"}>
              {/* Section label */}
              {section.label && (
                <div className="px-3 pt-4 pb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </span>
                </div>
              )}

              {/* Section items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-soft dark:shadow-soft-dark"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Manager section - visible to OWNER, ADMIN, and MANAGER */}
          {isManagerOrAbove && (
            <>
              <div className="px-3 pt-4 pb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Manager
                </span>
              </div>
              <div className="space-y-1">
                {managerNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-soft dark:shadow-soft-dark"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* Admin section - visible to OWNER and ADMIN only (not MANAGER) */}
          {isAdmin && (
            <>
              <div className="px-3 pt-4 pb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              </div>
              <div className="space-y-1">
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
                          ? "bg-primary text-primary-foreground shadow-soft dark:shadow-soft-dark"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border/50 flex-shrink-0">
          {/* Version label - inconspicuous */}
          <div className="text-[10px] text-muted-foreground/50 text-center mb-2" title={`Built: ${process.env.NEXT_PUBLIC_BUILD_TIME || 'dev'}`}>
            v{process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'}
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Avatar size="default">
                <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(session?.user?.name || "U")}</AvatarFallback>
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
              <div className="absolute bottom-full left-0 right-0 mb-2 p-1 bg-card border border-border rounded-xl shadow-soft-lg dark:shadow-soft-lg-dark">
                <Link
                  href="/cards"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                >
                  <CreditCard className="h-4 w-4" />
                  My Card
                </Link>
                <Link
                  href="/settings/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/strengths/upload"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                >
                  <Upload className="h-4 w-4" />
                  Upload Strengths
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
              {/* Theme toggle */}
              <ThemeToggle />

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

        {/* Page content with transition animation */}
        <main className="px-4 pt-2 pb-4 md:px-6 md:pt-4 md:pb-6 lg:px-8 lg:pt-4 lg:pb-8">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
