"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--toast-success-bg, #eff6ff)",
          "--success-text": "var(--toast-success-text, #2563eb)",
          "--success-border": "var(--toast-success-border, #dbeafe)",
          "--error-bg": "var(--toast-error-bg, #fef2f2)",
          "--error-border": "var(--toast-error-border, #fee2e2)",
          "--error-text": "var(--toast-error-text, #dc2626)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
