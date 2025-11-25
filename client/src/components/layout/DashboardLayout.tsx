import { ReactNode } from "react";
import { Activity, Zap, Moon, BarChart3, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

import bgImage from "@assets/generated_images/abstract_dark_neon_gradient_background_for_fitness_app.png";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Activity, path: "/", label: "Overview" },
    { icon: Zap, path: "/trends", label: "Trends" },
    { icon: Moon, path: "/sleep", label: "Sleep" },
    { icon: BarChart3, path: "/stats", label: "Stats" },
  ];

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden relative font-sans selection:bg-primary/30">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-60 pointer-events-none"
        style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      {/* Radial Gradient Overlay for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar - iPad Style */}
        <aside className="w-20 md:w-24 lg:w-28 flex flex-col items-center py-8 glass-strong border-r border-white/5">
          <div className="mb-12">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(132,204,22,0.5)]">
              <Activity className="text-black w-6 h-6" />
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-8 w-full px-4">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <a className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 group relative",
                    isActive ? "bg-white/10 text-primary" : "text-white/40 hover:text-white hover:bg-white/5"
                  )}>
                    <item.icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(132,204,22,0.5)]")} />
                    <span className="text-[10px] font-medium tracking-wider opacity-0 group-hover:opacity-100 absolute -bottom-4 transition-opacity whitespace-nowrap">
                      {item.label}
                    </span>
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(132,204,22,0.8)]" />
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-6">
            <button className="p-3 text-white/40 hover:text-white transition-colors">
                <User className="w-6 h-6" />
            </button>
            <button className="p-3 text-white/40 hover:text-white transition-colors">
                <Settings className="w-6 h-6" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}
