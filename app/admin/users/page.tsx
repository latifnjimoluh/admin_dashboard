"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface AdminUser {
  id: string
  nom: string
  email: string
  role: "SuperAdmin" | "Comptabilité" | "Contrôle Entrée" | "Gestion Packs" | "Lecture seule"
  statut: "actif" | "inactif"
  derniere_connexion: string
}

export default function UsersPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [admins, setAdmins] = useState<AdminUser[]>([
    {
      id: "1",
      nom: "Admin Principal",
      email: "admin@moviepark.cm",
      role: "SuperAdmin",
      statut: "actif",
      derniere_connexion: "2025-12-28 14:30",
    },
    {
      id: "2",
      nom: "Jean Comptable",
      email: "jean@moviepark.cm",
      role: "Comptabilité",
      statut: "actif",
      derniere_connexion: "2025-12-28 09:15",
    },
  ])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ nom: "", email: "", role: "Contrôle Entrée" as const })

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  const handleAddAdmin = () => {
    if (!newAdmin.nom || !newAdmin.email) return

    const admin: AdminUser = {
      id: Date.now().toString(),
      nom: newAdmin.nom,
      email: newAdmin.email,
      role: newAdmin.role,
      statut: "actif",
      derniere_connexion: "-",
    }

    setAdmins([...admins, admin])
    setNewAdmin({ nom: "", email: "", role: "Contrôle Entrée" })
    setShowAddModal(false)
  }

  const handleDeleteAdmin = (id: string) => {
    setAdmins(admins.filter((a) => a.id !== id))
  }

  const handleToggleStatus = (id: string) => {
    setAdmins(admins.map((a) => (a.id === id ? { ...a, statut: a.statut === "actif" ? "inactif" : "actif" } : a)))
  }

  if (isLoading || !isAuthenticated) return null

  const roles = ["SuperAdmin", "Comptabilité", "Contrôle Entrée", "Gestion Packs", "Lecture seule"]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les administrateurs et leurs droits d'accès</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un admin
          </button>
        </div>

        {/* Admins Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Nom</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Rôle</th>
                  <th className="text-left">Statut</th>
                  <th className="text-left">Dernière connexion</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="font-medium text-foreground">{admin.nom}</td>
                    <td className="text-muted-foreground">{admin.email}</td>
                    <td>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-900">
                        {admin.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {admin.statut === "actif" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-foreground">{admin.statut === "actif" ? "Actif" : "Inactif"}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{admin.derniere_connexion}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(admin.id)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                        >
                          {admin.statut === "actif" ? (
                            <XCircle className="w-4 h-4 text-orange-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ajouter un administrateur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nom complet</label>
              <input
                type="text"
                value={newAdmin.nom}
                onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })}
                placeholder="Jean Dupont"
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="jean@moviepark.cm"
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Rôle</label>
              <select
                value={newAdmin.role}
                onChange={(e) =>
                  setNewAdmin({
                    ...newAdmin,
                    role: e.target.value as
                      | "SuperAdmin"
                      | "Comptabilité"
                      | "Contrôle Entrée"
                      | "Gestion Packs"
                      | "Lecture seule",
                  })
                }
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleAddAdmin}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Créer l'admin
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
