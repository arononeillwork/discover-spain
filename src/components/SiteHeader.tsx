"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, Menu, Sun, X } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { SignOutButton } from "@/components/SignOutButton";

const nav = [
  { href: "/guides", label: "Guides" },
  { href: "/transport", label: "Taxis & transport" },
  { href: "/mortgages", label: "Mortgages" },
  { href: "/healthcare", label: "Healthcare" },
  { href: "/trades", label: "Tradespeople" },
];

function loginHref(pathname: string) {
  return pathname === "/" || pathname.startsWith("/login") ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;
}

/** Round badge with the first letter of the email: the signed-in indicator. */
function Avatar({ user }: { user: SessionUser }) {
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sea-soft text-sm font-semibold uppercase text-sea"
      title={user.email ? `Signed in as ${user.email}` : "Signed in"}
      aria-hidden
    >
      {(user.email ?? "?").charAt(0)}
    </span>
  );
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  // The mobile menu belongs to one page + account state: navigating (links, Back/Forward) or
  // signing in/out closes it. State is adjusted during render, React's pattern for derived state.
  const menuKey = `${pathname}|${user?.id ?? ""}`;
  const [menu, setMenu] = useState({ key: menuKey, open: false });
  if (menu.key !== menuKey) setMenu({ key: menuKey, open: false });
  const open = menu.key === menuKey && menu.open;
  const setOpen = (value: boolean) => setMenu({ key: menuKey, open: value });

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
            <Sun size={18} />
          </span>
          Discover Spain
        </Link>

        {/* Inline nav from lg up; below that the menu button (the account control needs the room). */}
        <div className="hidden items-center gap-3 lg:flex">
          <nav className="flex gap-1">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                    active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 border-l border-line pl-3" data-testid="account-desktop">
            {user ? (
              <>
                <Avatar user={user} />
                <span className="sr-only">Signed in as {user.email}</span>
                <SignOutButton next={pathname} className="whitespace-nowrap rounded-full px-3 py-2 text-sm text-muted hover:text-ink" />
              </>
            ) : (
              <Link
                href={loginHref(pathname)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
              >
                <LogIn size={16} /> Sign in
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {user && <Avatar user={user} />}
          <button className="rounded-lg p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line px-4 py-3 lg:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 hover:bg-surface">
              {item.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-line px-3 pt-4 pb-1" data-testid="account-mobile">
            {user ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 text-sm text-muted">
                  Signed in as <span className="break-all font-medium text-ink">{user.email}</span>
                </p>
                <SignOutButton next={pathname} className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-accent" />
              </div>
            ) : (
              <Link
                href={loginHref(pathname)}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-accent"
              >
                <LogIn size={16} /> Sign in to save progress
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
