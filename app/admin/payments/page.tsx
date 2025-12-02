"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Filter, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"

interface Payment {
  id: string
  nomPayeur: string
  telephone: string
  montant: number
  mode: string
  date: string
  admin: string
  reservationId: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modeFilter, setModeFilter] = useState<string>("tous")
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      loadPayments()
    }
  }, [router])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      const response = await api.payments.getAll()
      
      if (response.status === 200) {
        const raw = response.data?.payments || response.data || []
        
        const mapped: Payment[] = raw.map((p: any) => ({
          id: p.id,
          nomPayeur: p.reservation?.payeur_name || "—",
          telephone: p.reservation?.payeur_phone || "—",
          montant: p.amount,
          mode: p.method === "cash" ? "Cash" : p.method === "momo" ? "MoMo" : p.method,
          date: new Date(p.createdAt).toLocaleDateString("fr-FR"),
          admin: p.creator?.name || "Admin",
          reservationId: p.reservation_id || p.reservation?.id,
        }))
        
        setPayments(mapped)
        setFilteredPayments(mapped)
      }
    } catch (err) {
      console.error("Erreur chargement paiements:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let result = [...payments]

    if (search) {
      result = result.filter(
        (p) => p.nomPayeur.toLowerCase().includes(search.toLowerCase()) || p.telephone.includes(search)
      )
    }

    if (modeFilter !== "tous") {
      result = result.filter((p) => p.mode === modeFilter)
    }

    setFilteredPayments(result)
  }, [search, modeFilter, payments])

  if (isLoading || !isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AdminLayout>
    )
  }

  const totalMontant = filteredPayments.reduce((sum, p) => sum + p.montant, 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Paiements</h1>
          <p className="text-muted-foreground">
            Total: {filteredPayments.length} paiement(s) - {totalMontant.toLocaleString()} XAF
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors text-sm md:text-base"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors text-sm md:text-base appearance-none"
            >
              <option value="tous">Tous les modes</option>
              <option value="MoMo">Mobile Money (MoMo)</option>
              <option value="Cash">Espèces (Cash)</option>
              <option value="card">Carte bancaire</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Nombre de paiements</p>
            <p className="text-3xl font-bold text-foreground">{filteredPayments.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Montant total</p>
            <p className="text-3xl font-bold text-green-700">{totalMontant.toLocaleString()} XAF</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Montant moyen</p>
            <p className="text-3xl font-bold text-blue-700">
              {filteredPayments.length > 0 ? Math.round(totalMontant / filteredPayments.length).toLocaleString() : 0} XAF
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Nom du payeur
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Téléphone
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                    Montant
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Mode
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Admin
                  </th>
                  <th className="px-4 md:px-6 py-3 text-center text-sm font-semibold text-foreground whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-secondary/50 transition-colors border-t border-border">
                    <td className="px-4 md:px-6 py-3 text-sm text-foreground whitespace-nowrap font-medium">
                      {payment.nomPayeur}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {payment.telephone}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-right text-green-700 font-semibold whitespace-nowrap">
                      {payment.montant.toLocaleString()} XAF
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          payment.mode === "MoMo" ? "bg-blue-100 text-blue-900" : "bg-purple-100 text-purple-900"
                        }`}
                      >
                        {payment.mode}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">{payment.date}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">{payment.admin}</td>
                    <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/admin/reservation/${payment.reservationId}`)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                      >
                        <span className="hidden sm:inline">Voir</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Aucun paiement trouvé</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}