"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Temayı değiştir"
    >
      {resolvedTheme === "dark" ? (
        <SunMedium className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
