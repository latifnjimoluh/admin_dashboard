"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Pack {
  id: string
  nom: string
  prix: number
  description: string
  avantages: string[]
}

export default function PacksPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([
    {
      id: "simple",
      nom: "PACK SIMPLE",
      prix: 3000,
      description: "Accès aux deux projections",
      avantages: [
        "Accès aux deux projections",
        "Snack: Popcorn + Boisson",
        "Siège confortable",
        "Accès standard",
        "Zone photo payante",
      ],
    },
    {
      id: "vip",
      nom: "PACK VIP",
      prix: 5000,
      description: "Expérience VIP ultime",
      avantages: [
        "Accès aux deux films",
        "Zone photo gratuite",
        "Siège premium (matelas + couverture + oreiller)",
        "Snack + boisson + repas",
        "Accès prioritaire",
        "Espace VIP",
      ],
    },
    {
      id: "couple",
      nom: "PACK COUPLE",
      prix: 8000,
      description: "Expérience VIP ultime en amoureux",
      avantages: [
        "Deux sièges premium côte à côte",
        "Snacks + boissons + repas",
        "Photo professionnelle",
        "Zone VIP",
        "Accès activités",
      ],
    },
    {
      id: "famille",
      nom: "PACK FAMILLE",
      prix: 10000,
      description: "Expérience VIP ultime en famille",
      avantages: [
        "3 à 5 personnes",
        "Tous les avantages VIP",
        "Accès gratuit pour enfants",
        "Snacks + boissons + repas",
        "Zone photo gratuite",
      ],
    },
  ])
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({ prix: "", description: "" })

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  const handleEditClick = (pack: Pack) => {
    setSelectedPack(pack)
    setEditData({ prix: pack.prix.toString(), description: pack.description })
    setShowEditModal(true)
  }

  const handleSaveChanges = () => {
    if (!selectedPack) return

    setPacks(
      packs.map((p) =>
        p.id === selectedPack.id
          ? { ...p, prix: Number.parseInt(editData.prix), description: editData.description }
          : p,
      ),
    )

    setShowEditModal(false)
    setSelectedPack(null)
  }

  if (isLoading || !isAuthenticated) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des packs</h1>
          <p className="text-muted-foreground">Modifiez les prix et descriptions des packs</p>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{pack.nom}</h2>
                  <p className="text-2xl font-bold text-primary mt-1">{pack.prix.toLocaleString()} XAF</p>
                </div>
                <button
                  onClick={() => handleEditClick(pack)}
                  className="p-2 hover:bg-secondary rounded-md transition-colors text-foreground"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{pack.description}</p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground uppercase">Avantages</p>
                <ul className="space-y-2">
                  {pack.avantages.map((avantage, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{avantage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Modifier {selectedPack?.nom}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Prix (XAF)</label>
              <input
                type="number"
                value={editData.prix}
                onChange={(e) => setEditData({ ...editData, prix: e.target.value })}
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
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
