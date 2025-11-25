import { ReactNode } from "react";
import { User, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import bgImage from "@assets/generated_images/abstract_dark_neon_gradient_background_for_fitness_app.png";

export function DashboardLayout({ children }: { children: ReactNode }) {
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

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <button className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all duration-500">
          <RefreshCw className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
          <span className="text-xs font-medium text-white/80">Sync Fit</span>
        </button>
        
        <button className="p-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300">
          <Settings className="w-5 h-5 text-white/80" />
        </button>
        
        <button className="p-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px]">
             <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
               <User className="w-4 h-4 text-white" />
             </div>
           </div>
        </button>
      </div>

      {/* Main Content */}
      <main className="relative z-10 h-screen overflow-y-auto scrollbar-hide p-4 md:p-8 lg:p-12">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col">
            {children}
        </div>
      </main>
    </div>
  );
}
