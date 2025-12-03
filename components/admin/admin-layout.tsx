"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/admin/sidebar"
import { ThemeToggle } from "@/components/admin/theme-toggle"
import { Menu } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Top Bar */}
        <div className="bg-card border-b border-border h-20 flex items-center justify-between px-4 md:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary rounded-md transition-colors duration-150"
            aria-label="Basculer la barre latérale"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="text-foreground font-semibold hidden sm:block">Movie in the Park Admin</div>

          <ThemeToggle />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
