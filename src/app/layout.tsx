import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { ProgressProvider } from "@/components/ProgressProvider";
import { getSessionState } from "@/lib/session";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Discover Spain · Costa del Sol life, step by step", template: "%s · Discover Spain" },
  description:
    "Walkthroughs for NIE, padrón, healthcare, mortgages, taxis and trusted tradespeople on the Costa del Sol.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Signed-in user (if any) and their saved progress. Never throws; signed out when unsure.
  const { user, doneStepIds } = await getSessionState();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ProgressProvider user={user} initialDone={doneStepIds}>
          <SiteHeader user={user} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
        </ProgressProvider>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted sm:px-6">
            <p>
              General guidance only. It is not legal, tax or financial advice. Rules and fees change, so confirm with the official
              source, a gestor or an abogado before you act.
            </p>
            <p className="mt-2">Focused on Marbella &amp; the Costa del Sol · Made with ☀️</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
