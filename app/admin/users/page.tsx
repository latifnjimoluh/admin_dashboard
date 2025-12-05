"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Plus, Trash2, CheckCircle, XCircle, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { PermissionsDisplay } from "@/components/admin/permissions-display"
import { rolePermissions } from "@/lib/permissions-config"

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
  const [currentUserRole, setCurrentUserRole] = useState<string>("")

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null)
  const [adminToChangeRole, setAdminToChangeRole] = useState<AdminUser | null>(null)
  const [newRoleValue, setNewRoleValue] = useState("")

  const [expandedAdminId, setExpandedAdminId] = useState<string | null>(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedAdminForPermissions, setSelectedAdminForPermissions] = useState<AdminUser | null>(null)

  const [newAdmin, setNewAdmin] = useState({
    nom: "",
    email: "",
    role: "scanner",
  })

  const roles = ["superadmin", "admin", "cashier", "scanner", "operator"]

  // AUTH + FETCH USERS
  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    const userRole = localStorage.getItem("admin_role")
    if (!token) {
      router.push("/admin/login")
      return
    }

    setCurrentUserRole(userRole || "")
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
        derniere_connexion: u.last_login ? formatLastLogin(u.last_login) : "-",
      }))

      setAdmins(mapped)
    } catch (err) {
      setErrorMessage("Impossible de charger les utilisateurs.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatLastLogin = (dateString: string | null): string => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins}m`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`

    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

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

  const openDeleteModal = (admin: AdminUser) => {
    setAdminToDelete(admin)
    setShowDeleteModal(true)
  }

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

  const openRoleChangeModal = (admin: AdminUser) => {
    setAdminToChangeRole(admin)
    setNewRoleValue(admin.role)
    setShowRoleChangeModal(true)
  }

  const confirmRoleChange = async () => {
    if (!adminToChangeRole || !newRoleValue) return

    try {
      await api.users.updateRole(adminToChangeRole.id, newRoleValue)
      setAdmins(admins.map((a) => (a.id === adminToChangeRole.id ? { ...a, role: newRoleValue } : a)))
      setShowRoleChangeModal(false)
      setAdminToChangeRole(null)
    } catch (err: any) {
      alert(err?.data?.message || "Erreur lors de la modification du rôle")
    }
  }

  const handleToggleStatus = (id: string) => {
    setAdmins(admins.map((a) => (a.id === id ? { ...a, statut: a.statut === "actif" ? "inactif" : "actif" } : a)))
  }

  const openPermissionsModal = (admin: AdminUser) => {
    setSelectedAdminForPermissions(admin)
    setShowPermissionsModal(true)
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
        {errorMessage && <div className="p-3 bg-red-100 text-red-700 rounded-md">{errorMessage}</div>}

        {/* Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-4">Nom</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Rôle</th>
                  <th className="text-left p-4">Permissions</th>
                  <th className="text-left p-4">Statut</th>
                  <th className="text-left p-4">Dernière connexion</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">{admin.nom}</td>
                    <td className="p-4 text-muted-foreground">{admin.email}</td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-medium">
                        {admin.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => openPermissionsModal(admin)}
                        className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-medium hover:bg-purple-200 transition"
                      >
                        Voir les droits
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {admin.statut === "actif" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        {admin.statut === "actif" ? "Actif" : "Inactif"}
                      </div>
                    </td>

                    <td className="p-4 text-muted-foreground text-xs">{admin.derniere_connexion}</td>

                    <td className="p-4 text-right flex justify-end gap-2">
                      {currentUserRole === "superadmin" && (
                        <button
                          onClick={() => openRoleChangeModal(admin)}
                          title="Modifier le rôle"
                          className="p-1 hover:bg-muted rounded transition"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                      )}

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

      {/* MODAL AJOUT USER */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouvel administrateur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMessage && <div className="p-2 bg-red-100 text-red-700 rounded-md">{errorMessage}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium text-sm">Nom complet</label>
                <input
                  type="text"
                  value={newAdmin.nom}
                  onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Nexus"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-sm">Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="latifnjimoluh@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium text-sm">Rôle</label>
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
              <p className="text-xs text-muted-foreground mt-2">
                Les permissions seront automatiquement assignées en fonction du rôle sélectionné.
              </p>
            </div>

            <div className="border-t pt-4 max-h-64 overflow-y-auto">
              <h4 className="font-medium text-sm mb-3">Droits d'accès associés au rôle:</h4>
              <PermissionsDisplay role={newAdmin.role} permissions={rolePermissions[newAdmin.role] || []} />
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

      {/* MODAL VOIR LES PERMISSIONS */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="bg-card max-w-2xl">
          <DialogHeader>
            <DialogTitle>Droits d'accès de {selectedAdminForPermissions?.nom}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Rôle:</strong> {selectedAdminForPermissions?.role}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {selectedAdminForPermissions?.email}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3">Permissions détaillées:</h4>
              <PermissionsDisplay
                role={selectedAdminForPermissions?.role || ""}
                permissions={rolePermissions[selectedAdminForPermissions?.role || ""] || []}
              />
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setShowPermissionsModal(false)} className="px-4 py-2 bg-primary text-white rounded">
              Fermer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleChangeModal} onOpenChange={setShowRoleChangeModal}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le rôle de {adminToChangeRole?.nom}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez le nouveau rôle pour <strong>{adminToChangeRole?.email}</strong>
            </p>

            <div>
              <label className="block mb-2 font-medium text-sm">Nouveau rôle</label>
              <select
                value={newRoleValue}
                onChange={(e) => setNewRoleValue(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {newRoleValue && (
              <div className="border-t pt-4 max-h-64 overflow-y-auto">
                <h4 className="font-medium text-sm mb-3">Nouveaux droits d'accès:</h4>
                <PermissionsDisplay role={newRoleValue} permissions={rolePermissions[newRoleValue] || []} />
              </div>
            )}
          </div>

          <DialogFooter>
            <button onClick={() => setShowRoleChangeModal(false)} className="px-4 py-2 bg-secondary rounded">
              Annuler
            </button>
            <button onClick={confirmRoleChange} className="px-4 py-2 bg-primary text-white rounded">
              Confirmer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMATION SUPPRESSION */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmation de suppression</DialogTitle>
          </DialogHeader>

          <p className="py-4">
            Voulez-vous vraiment supprimer <strong>{adminToDelete?.nom}</strong> ({adminToDelete?.email}) ?
            <br />
            Cette action est irréversible.
          </p>

          <DialogFooter>
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-secondary rounded">
              Annuler
            </button>

            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded">
              Supprimer définitivement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
