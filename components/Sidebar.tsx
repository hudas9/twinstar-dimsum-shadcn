"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Products", href: "/products", icon: "📦" },
  { label: "Orders", href: "/orders", icon: "🛒" },
  { label: "Members", href: "/members", icon: "👥" },
  { label: "Expenses", href: "/expenses", icon: "💸" },
  { label: "Incomes", href: "/incomes", icon: "💰" },
  { label: "Reports", href: "/reports", icon: "📈" },
  // Admin removed - user management handled in Supabase
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-900 text-white flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold">TwinStar POS</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <SignOutButton />
      </div>
    </aside>
  );
}
