"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

function Submit({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`inline-flex items-center gap-2 disabled:opacity-60 ${className ?? ""}`}>
      <LogOut size={16} /> {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

/** Sign-out form; returns the visitor to `next` (a same-site path) afterwards. */
export function SignOutButton({ next, className }: { next: string; className?: string }) {
  return (
    <form action={signOut}>
      <input type="hidden" name="next" value={next} />
      <Submit className={className} />
    </form>
  );
}
