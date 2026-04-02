"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing", badge: "Soon" },
  { href: "/dashboard", label: "Dashboard" },
];

interface UserAvatarProps {
  name: string;
}

const UserAvatar = ({ name }: UserAvatarProps) => {
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
      {initial}
    </div>
  );
};

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const renderAuthSection = () => {
    if (loading) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (!user) {
      return (
        <>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get Started</Button>
          </Link>
        </>
      );
    }

    return (
      <>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Dashboard
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <UserAvatar name={user.displayName || user.email || "User"} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {user.displayName || "User"}
                </span>
                <span className="truncate text-xs text-[var(--muted-foreground)]">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

  const renderMobileAuth = () => {
    if (loading) {
      return <Skeleton className="h-8 w-20 rounded-md" />;
    }

    if (!user) {
      return (
        <>
          <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
            <Button size="sm">Get Started</Button>
          </Link>
        </>
      );
    }

    return (
      <>
        <div className="flex items-center gap-2 px-3 py-2">
          <UserAvatar name={user.displayName || user.email || "User"} />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {user.displayName || "User"}
            </span>
            <span className="truncate text-xs text-[var(--muted-foreground)]">{user.email}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2"
          onClick={() => {
            setMobileOpen(false);
            handleSignOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)]">
            <Home className="h-5 w-5 text-[var(--primary-foreground)]" />
          </div>
          <span
            className="text-xl text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            DesignStudio
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]",
              )}
            >
              {link.label}
              {link.badge && (
                <span className="ml-1.5 inline-flex items-center rounded-full bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">{renderAuthSection()}</div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-[var(--secondary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3">{renderMobileAuth()}</div>
          </div>
        </div>
      )}
    </header>
  );
};
