import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/LinkList";
import { SignOutButton } from "@/components/SignOutButton";
import { LOGIN_ERRORS, safeNextPath } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const linkError = typeof params.error === "string" ? (LOGIN_ERRORS[params.error] ?? LOGIN_ERRORS.link) : undefined;
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="Your account"
        title={user ? "You're signed in" : "Sign in"}
        intro="Signing in saves your checklist progress to your account, so it follows you to any device. Everything else works without an account."
      />

      {user ? (
        <div className="card">
          <p className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-accent" /> Signed in as <strong className="break-all">{user.email ?? "your account"}</strong>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href={next === "/" ? "/guides" : next} className="btn">
              {next === "/" ? "Go to the guides" : "Continue"}
            </Link>
            <SignOutButton next="/login" className="rounded-full border border-line px-5 py-3 text-sm font-medium hover:border-accent" />
          </div>
        </div>
      ) : (
        <LoginForm next={next} linkError={linkError} />
      )}

      <p className="mt-6 text-sm text-muted">
        No password needed: we email you a one-time link. Any steps you ticked in this browser are added to your account when you sign in.
      </p>
    </div>
  );
}
