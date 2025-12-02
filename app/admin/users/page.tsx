"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api } from "@/lib/api"

interface AdminUser {
  id: string
  nom: string
  email: string
  role: string
  statut: "actif" | "inactif"
  derniere_connexion: string
}

export default function UsersPage() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)   // <-- modal suppression
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null)

  const [newAdmin, setNewAdmin] = useState({
    nom: "",
    email: "",
    role: "scanner",
  })

  const roles = ["superadmin", "admin", "cashier", "scanner"]

  // =========================
  // AUTH + FETCH USERS
  // =========================
  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    setIsAuthenticated(true)
    loadAdmins()
  }, [router])

  const loadAdmins = async () => {
    try {
      const res = await api.users.list()
      const users = res.data || []

      const mapped: AdminUser[] = users.map((u: any) => ({
        id: u.id,
        nom: u.name,
        email: u.email,
        role: u.role,
        statut: "actif",
        derniere_connexion: "-",
      }))

      setAdmins(mapped)
    } catch (err) {
      setErrorMessage("Impossible de charger les utilisateurs.")
    } finally {
      setIsLoading(false)
    }
  }

  // =========================
  // CREATE ADMIN
  // =========================
  const generatePassword = () => Math.random().toString(36).slice(-8)

  const handleAddAdmin = async () => {
    setErrorMessage("")

    if (!newAdmin.nom || !newAdmin.email) {
      setErrorMessage("Veuillez remplir tous les champs.")
      return
    }

    try {
      await api.users.create({
        name: newAdmin.nom,
        email: newAdmin.email,
        phone: "",
        role: newAdmin.role,
        password: generatePassword(),
      })

      await loadAdmins()

      setNewAdmin({ nom: "", email: "", role: "scanner" })
      setShowAddModal(false)
    } catch (err: any) {
      const msg = err?.data?.message || "Erreur lors de la création."
      setErrorMessage(msg)
    }
  }

  // =========================
  // OPEN DELETE MODAL
  // =========================
  const openDeleteModal = (admin: AdminUser) => {
    setAdminToDelete(admin)
    setShowDeleteModal(true)
  }

  // =========================
  // CONFIRM DELETE
  // =========================
  const confirmDelete = async () => {
    if (!adminToDelete) return

    try {
      await api.users.delete(adminToDelete.id)
      setAdmins(admins.filter((a) => a.id !== adminToDelete.id))
    } catch (err: any) {
      alert(err?.data?.message || "Erreur lors de la suppression")
    }

    setShowDeleteModal(false)
    setAdminToDelete(null)
  }

  // =========================
  // Toggle Status
  // =========================
  const handleToggleStatus = (id: string) => {
    setAdmins(
      admins.map((a) =>
        a.id === id ? { ...a, statut: a.statut === "actif" ? "inactif" : "actif" } : a
      )
    )
  }

  if (isLoading || !isAuthenticated) return null

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les administrateurs et leurs droits d'accès</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
          >
            <Plus className="w-4 h-4" /> Ajouter un admin
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}

        {/* Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
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
                  <tr key={admin.id} className="border-t">
                    <td>{admin.nom}</td>
                    <td className="text-muted-foreground">{admin.email}</td>

                    <td>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs">
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
                        {admin.statut === "actif" ? "Actif" : "Inactif"}
                      </div>
                    </td>

                    <td className="text-muted-foreground">{admin.derniere_connexion}</td>

                    <td className="text-right flex justify-end gap-2">

                      <button onClick={() => handleToggleStatus(admin.id)}>
                        {admin.statut === "actif" ? (
                          <XCircle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </button>

                      <button onClick={() => openDeleteModal(admin)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>

      {/* ███████████████████████████████████████████████████ */}
      {/*                 MODAL AJOUT USER                   */}
      {/* ███████████████████████████████████████████████████ */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Créer un nouvel administrateur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMessage && (
              <div className="p-2 bg-red-100 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block mb-1">Nom complet</label>
              <input
                type="text"
                value={newAdmin.nom}
                onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block mb-1">Rôle</label>
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-secondary rounded">
              Annuler
            </button>
            <button onClick={handleAddAdmin} className="px-4 py-2 bg-primary text-white rounded">
              Créer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ███████████████████████████████████████████████████ */}
      {/*          MODAL CONFIRMATION SUPPRESSION            */}
      {/* ███████████████████████████████████████████████████ */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmation de suppression</DialogTitle>
          </DialogHeader>

          <p className="py-4">
            Voulez-vous vraiment supprimer{" "}
            <strong>{adminToDelete?.nom}</strong> ({adminToDelete?.email}) ?
            <br />
            Cette action est irréversible.
          </p>

          <DialogFooter>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-secondary rounded"
            >
              Annuler
            </button>

            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Supprimer définitivement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  )
}
