import { useLocation } from "wouter";
import { BarChart3, Home, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex justify-around items-center h-24 md:h-20 z-50 shadow-2xl">
      <Button
        variant={isActive("/") ? "default" : "ghost"}
        size="lg"
        className={`flex flex-col items-center gap-2 h-auto py-3 px-4 rounded-lg transition-all ${
          isActive("/")
            ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
        onClick={() => setLocation("/")}
      >
        <Home className="w-6 h-6" />
        <span className="text-xs font-bold">DASHBOARD</span>
      </Button>

      <Button
        variant={isActive("/expenses") ? "default" : "ghost"}
        size="lg"
        className={`flex flex-col items-center gap-2 h-auto py-3 px-4 rounded-lg transition-all ${
          isActive("/expenses")
            ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
        onClick={() => setLocation("/expenses")}
      >
        <BarChart3 className="w-6 h-6" />
        <span className="text-xs font-bold">GASTOS</span>
      </Button>

      <Button
        variant={isActive("/investments") ? "default" : "ghost"}
        size="lg"
        className={`flex flex-col items-center gap-2 h-auto py-3 px-4 rounded-lg transition-all ${
          isActive("/investments")
            ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
        onClick={() => setLocation("/investments")}
      >
        <TrendingUp className="w-6 h-6" />
        <span className="text-xs font-bold">AÇÕES</span>
      </Button>
    </div>
  );
}
