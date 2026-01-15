import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  isActive?: boolean;
}

export default function ModeCard({ title, description, icon: Icon, onClick, className, isActive }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "group relative overflow-hidden rounded-lg border-2 border-border bg-card p-6 text-left transition-all duration-300",
        "hover:border-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:scale-105",
        "active:scale-95",
        isActive && "border-secondary shadow-[0_0_30px_hsl(var(--secondary)/0.5)] bg-secondary/5",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {isActive && (
        <div className="absolute top-2 right-2 z-20 bg-secondary text-secondary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}

      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="absolute bottom-0 right-0 h-32 w-32 translate-x-8 translate-y-8 rounded-full bg-primary/5 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
    </button>
  );
}
