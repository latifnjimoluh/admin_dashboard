"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-[#A00000] hover:bg-[#CC0000] text-[#F8F8F8] rounded-md transition-all duration-200 font-medium shadow-lg hover:shadow-[0_0_15px_rgba(160,0,0,0.5)]"
    >
      <LogOut className="w-4 h-4" />
      Déconnexion
    </button>
  )
}
