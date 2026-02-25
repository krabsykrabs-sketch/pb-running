"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/runner", label: "Dashboard" },
  { href: "/runner/calendar", label: "Calendar" },
  { href: "/runner/history", label: "History" },
  { href: "/runner/profile", label: "Profile" },
];

export default function RunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const timer: ReturnType<typeof setInterval> = setInterval(fetchUnread, 60000);

    async function fetchUnread() {
      try {
        const res = await fetch("/api/runner/unread-comments");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count ?? 0);
        }
      } catch {
        // silently fail
      }
    }

    fetchUnread();
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">PB Running</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 bg-gray-50 p-4">{children}</main>

      {/* Bottom tab navigation */}
      <nav className="bg-white border-t border-gray-200 flex">
        {navItems.map((item) => {
          const isActive =
            item.href === "/runner"
              ? pathname === "/runner"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-3 text-center text-xs font-medium relative ${
                isActive
                  ? "text-blue-600 border-t-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
              {item.href === "/runner" && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1/4 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
