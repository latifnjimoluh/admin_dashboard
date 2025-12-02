"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api } from "@/lib/api"

interface Pack {
  id: string
  name: string
  price: number
  description: string
  capacity: number
  is_active: boolean
}

export default function PacksPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editData, setEditData] = useState({ name: "", price: "", description: "", capacity: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      loadPacks()
    }
  }, [router])

  const loadPacks = async () => {
    try {
      setError(null)
      setIsLoading(true)
      const response = await api.packs.getAll("?is_active=true")

      if (response.status === 200) {
        const packsList = Array.isArray(response.data) ? response.data : response.data?.packs || []
        setPacks(packsList)
      } else {
        setError("Erreur lors du chargement des packs")
      }
    } catch (err: any) {
      console.error("Error loading packs:", err)
      setError(err.message || "Erreur lors du chargement des packs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (pack: Pack) => {
    setSelectedPack(pack)
    setEditData({
      name: pack.name,
      price: pack.price.toString(),
      description: pack.description,
      capacity: pack.capacity?.toString() || "",
    })
    setShowEditModal(true)
  }

  const handleCreateClick = () => {
    setEditData({ name: "", price: "", description: "", capacity: "" })
    setSelectedPack(null)
    setShowCreateModal(true)
  }

  const handleSaveChanges = async () => {
    if (!selectedPack) return

    try {
      setIsSaving(true)
      setError(null)

      const updateData = {
        name: editData.name || selectedPack.name,
        price: Number.parseInt(editData.price) || selectedPack.price,
        description: editData.description || selectedPack.description,
        capacity: editData.capacity ? Number.parseInt(editData.capacity) : selectedPack.capacity,
      }

      const response = await api.packs.update(selectedPack.id, updateData)

      if (response.status === 200) {
        setSuccess("Pack modifié avec succès")
        await loadPacks()
        setShowEditModal(false)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || "Erreur lors de la modification du pack")
      }
    } catch (err: any) {
      console.error("Error updating pack:", err)
      setError(err.message || "Erreur lors de la modification du pack")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreatePack = async () => {
    if (!editData.name || !editData.price) {
      setError("Le nom et le prix sont requis")
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const newPackData = {
        name: editData.name,
        price: Number.parseInt(editData.price),
        description: editData.description,
        capacity: editData.capacity ? Number.parseInt(editData.capacity) : null,
      }

      const response = await api.packs.create(newPackData)

      if (response.status === 201) {
        setSuccess("Pack créé avec succès")
        await loadPacks()
        setShowCreateModal(false)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || "Erreur lors de la création du pack")
      }
    } catch (err: any) {
      console.error("Error creating pack:", err)
      setError(err.message || "Erreur lors de la création du pack")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePack = async (packId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce pack ?")) return

    try {
      setError(null)
      const response = await api.packs.delete(packId)

      if (response.status === 200) {
        setSuccess("Pack supprimé avec succès")
        await loadPacks()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(response.message || "Erreur lors de la suppression du pack")
      }
    } catch (err: any) {
      console.error("Error deleting pack:", err)
      setError(err.message || "Erreur lors de la suppression du pack")
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des packs</h1>
            <p className="text-muted-foreground">Modifiez, créez ou supprimez les packs</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer un pack
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Packs Grid */}
        {packs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun pack trouvé</p>
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium"
            >
              Créer le premier pack
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground">{pack.name}</h2>
                    <p className="text-2xl font-bold text-primary mt-1">{pack.price.toLocaleString()} XAF</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(pack)}
                      className="p-2 hover:bg-secondary rounded-md transition-colors text-foreground"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePack(pack.id)}
                      className="p-2 hover:bg-red-500/20 rounded-md transition-colors text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{pack.description}</p>

                {pack.capacity && (
                  <div className="bg-secondary p-2 rounded text-sm text-foreground">
                    Capacité: {pack.capacity} participant(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Modifier {selectedPack?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nom</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Prix (XAF)</label>
              <input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Capacité (optionnel)</label>
              <input
                type="number"
                value={editData.capacity}
                onChange={(e) => setEditData({ ...editData, capacity: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm disabled:opacity-50"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Créer un nouveau pack</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nom *</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                placeholder="Ex: Pack VIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Prix (XAF) *</label>
              <input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                placeholder="Description du pack"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Capacité (optionnel)</label>
              <input
                type="number"
                value={editData.capacity}
                onChange={(e) => setEditData({ ...editData, capacity: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                placeholder="Nombre de participants"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleCreatePack}
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm disabled:opacity-50"
            >
              {isSaving ? "Création..." : "Créer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}