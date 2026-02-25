"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type ActiveRunner = { id: string; name: string };

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [runnersOpen, setRunnersOpen] = useState(false);
  const [runners, setRunners] = useState<ActiveRunner[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runnersActive = pathname.startsWith("/coach/runners");

  // Auto-expand when navigating to a runner page
  useEffect(() => {
    if (runnersActive && !runnersOpen) {
      setRunnersOpen(true);
    }
  }, [runnersActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRunners = useCallback(async () => {
    if (runners !== null) return;
    setLoading(true);
    try {
      const res = await fetch("/api/runners/active");
      if (res.ok) {
        const data = await res.json();
        setRunners(data);
      }
    } catch {
      // silently fail — sidebar still usable
    }
    setLoading(false);
  }, [runners]);

  function handleRunnersToggle() {
    const opening = !runnersOpen;
    setRunnersOpen(opening);
    if (opening) fetchRunners();
  }

  const navLinkClass = (active: boolean) =>
    `block rounded-md px-3 py-2 text-sm font-medium mb-1 ${
      active
        ? "bg-gray-700 text-white"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">PB Running Coach</h1>
        </div>
        <nav className="flex-1 p-2">
          <Link href="/coach" className={navLinkClass(pathname === "/coach")}>
            Dashboard
          </Link>

          {/* Runners toggle + sub-list */}
          <button
            onClick={handleRunnersToggle}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-medium mb-1 flex items-center justify-between ${
              runnersActive
                ? "bg-gray-700 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            Runners
            <svg
              className={`w-3.5 h-3.5 transition-transform ${runnersOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {runnersOpen && (
            <div className="ml-3 mb-1">
              {loading && (
                <div className="px-3 py-1.5 text-xs text-gray-500">Loading...</div>
              )}
              {runners && runners.length === 0 && (
                <div className="px-3 py-1.5 text-xs text-gray-500">
                  No active plans
                </div>
              )}
              {runners &&
                runners.map((r) => {
                  const href = `/coach/runners/${r.id}`;
                  const isRunnerActive = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={r.id}
                      href={href}
                      className={`block rounded-md px-3 py-1.5 text-sm mb-0.5 ${
                        isRunnerActive
                          ? "bg-gray-700 text-white font-medium"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {r.name}
                    </Link>
                  );
                })}
              <Link
                href="/coach/runners"
                className="block px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 mt-1"
              >
                All Runners
              </Link>
            </div>
          )}

          <Link
            href="/coach/sessions"
            className={navLinkClass(pathname.startsWith("/coach/sessions"))}
          >
            Sessions
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left text-sm text-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
