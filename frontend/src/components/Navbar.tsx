"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, ShieldAlert, MessageSquare, LogIn, LayoutDashboard, Sun, Moon, UserCircle, LogOut } from "lucide-react";
import { api } from "@/lib/api";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      try {
        await api.get("/profile");
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [pathname]);
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tracker", href: "/tracker", icon: Activity },
    { name: "Scanner", href: "/scanner", icon: ShieldAlert },
    { name: "Advisor Chat", href: "/chat", icon: MessageSquare },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-b-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                ClearFinance
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            

          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-foreground/10">
                  <UserCircle className="h-5 w-5" />
                  My Profile
                </button>
                <div className="absolute right-0 mt-2 w-48 py-2 bg-background border border-foreground/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col">
                  <Link href="/dashboard" className="px-4 py-2 text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button onClick={async () => { try { await api.post("/auth/logout"); } catch(e){} window.location.href="/"; }} className="px-4 py-2 text-sm text-danger hover:bg-danger/10 text-left flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
