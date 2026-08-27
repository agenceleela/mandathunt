"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button"; // Ajuste le chemin si tu n'utilises pas shadcn, ou remplace par <button>
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SubmitButton({ children, variant = "default", size = "default", className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending || props.disabled}
      className={`flex items-center justify-center gap-2 transition-all ${className}`}
      {...props}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
