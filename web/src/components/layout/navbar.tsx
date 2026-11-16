"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import type { User } from "firebase/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { BrandLogo } from "./brand-logo";

type UserIdentityProps = {
  user: User;
};

type MobileAuthProps = {
  onNavigate: () => void;
};

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

const NAV_LINK_CLASS =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

const displayName = (user: User) => user.displayName ?? user.email ?? "User";

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo size="md" />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <DesktopAuth />
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <MobileAuth onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const UserAvatar = ({ user }: UserIdentityProps) => (
  <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
    {displayName(user).charAt(0).toUpperCase()}
  </div>
);

const UserIdentity = ({ user }: UserIdentityProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-sm font-medium text-foreground">{user.displayName ?? "User"}</span>
    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
  </div>
);

const useSignOutHome = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  return async () => {
    await signOut();
    router.push("/");
  };
};

const DesktopAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const signOutHome = useSignOutHome();

  if (loading) return <Skeleton className="size-8 rounded-full" />;
  if (!user) return <GuestLinks />;

  return (
    <>
      <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Dashboard
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <UserAvatar user={user} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <UserIdentity user={user} />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
            <LayoutDashboard className="mr-2 size-4" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={signOutHome}>
            <LogOut className="mr-2 size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const MobileAuth = ({ onNavigate }: MobileAuthProps) => {
  const { user, loading } = useAuth();
  const signOutHome = useSignOutHome();

  if (loading) return <Skeleton className="h-8 w-20 rounded-md" />;
  if (!user) return <GuestLinks onNavigate={onNavigate} />;

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <UserAvatar user={user} />
        <UserIdentity user={user} />
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start gap-2"
        onClick={() => {
          onNavigate();
          void signOutHome();
        }}
      >
        <LogOut className="size-4" />
        Sign Out
      </Button>
    </>
  );
};

const GuestLinks = ({ onNavigate }: Partial<MobileAuthProps>) => (
  <>
    <Link
      href="/sign-in"
      onClick={onNavigate}
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      Sign In
    </Link>
    <Link href="/sign-up" onClick={onNavigate} className={buttonVariants({ size: "sm" })}>
      Get Started
    </Link>
  </>
);
