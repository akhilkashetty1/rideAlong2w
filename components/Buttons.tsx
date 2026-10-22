import Link from "next/link";
import { cn } from "@/lib/utils";

/** The 2W button language: lime for forward, orange for back, black text. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60 sm:text-base";
export const buttonStyles = {
  next: cn(base, "bg-neon shadow-[0_4px_12px_rgba(0,0,0,.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,.3)] active:translate-y-0"),
  back: cn(base, "bg-az shadow-[0_4px_12px_rgba(0,0,0,.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,.3)] active:translate-y-0"),
  ghost: cn(base, "border border-line bg-paper hover:border-black"),
};

export function LinkButton({
  href,
  variant = "next",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonStyles;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(buttonStyles[variant], className)}>
      {children}
    </Link>
  );
}
