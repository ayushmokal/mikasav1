import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const Logo = ({ size = "md", showText = true, className, glow = false }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl"
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/mikasa_logo.png"
        alt="SubVault Logo"
        className={cn(
          "object-contain",
          sizeClasses[size],
          glow && "netflix-glow"
        )}
      />
      {showText && (
        <h1 className={cn(
          "font-bold netflix-text",
          textSizeClasses[size]
        )}>
          SubVault
        </h1>
      )}
    </div>
  );
};
