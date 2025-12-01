  "use client"

  import Link from "next/link"
  import { usePathname } from "next/navigation"
  import {
    LayoutDashboard,
    BookOpen,
    CreditCard,
    Ticket,
    Settings,
    Users,
    QrCode,
    Package,
    X,
  } from "lucide-react"

  interface SidebarProps {
    isOpen?: boolean
    onToggle?: () => void
  }

  export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
    const pathname = usePathname()
    const isActive = (href: string) => pathname === href

    const navItems = [
      { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/admin/reservation/create", label: "Créer réservation", icon: BookOpen },
      { href: "/admin/reservations", label: "Réservations", icon: BookOpen },
      { href: "/admin/payments", label: "Paiements", icon: CreditCard },
      { href: "/admin/tickets", label: "Tickets", icon: Ticket },
      { href: "/admin/scan", label: "Contrôle d'entrée", icon: QrCode },
      { href: "/admin/packs", label: "Packs", icon: Package },
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/settings", label: "Paramètres", icon: Settings },
    ]

    return (
      <>
        {/* Overlay mobile */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={onToggle}
          />
        )}

        <aside
          className={`fixed md:static top-0 left-0 h-screen bg-sidebar z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? "w-64" : "w-20"}
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Close button mobile */}
          <div className="md:hidden absolute top-4 right-4">
            <button onClick={onToggle} className="p-2 hover:bg-sidebar-accent rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo */}
          {/* <div className="p-6 border-b border-sidebar-border flex items-center gap-2"> */}
          <div className="h-20 px-6 border-b border-sidebar-border flex items-center gap-2">

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">🎬</span>
            </div>
            {isOpen && (
              <h2 className="text-sm font-bold text-sidebar-foreground">
                Movie in the Park
              </h2>
            )}
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    // fermer uniquement sur mobile
                    if (window.innerWidth < 768) {
                      onToggle?.()
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all
                    ${active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>

              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            {isOpen && <p className="text-xs text-center text-sidebar-foreground/50">v0.2.0</p>}
          </div>
        </aside>
      </>
    )
  }
