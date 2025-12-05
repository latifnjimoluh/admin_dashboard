"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Download } from "lucide-react"
import { api } from "@/lib/api"
import { AuditTable } from "@/components/admin/audit-table"
import { AuditFilters } from "@/components/admin/audit-filters"

interface ActivityLog {
  id: string
  user_id: string
  admin_name: string
  action: string
  permission: string
  entity_type: string
  entity_id: string
  description: string
  details: string
  ip_address: string
  user_agent: string
  created_at: string
}

export default function AuditPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string>("")
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [filterUser, setFilterUser] = useState("")
  const [filterAction, setFilterAction] = useState("")
  const [filterEntity, setFilterEntity] = useState("")
  const [filterPermission, setFilterPermission] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const [page, setPage] = useState(0)
  const itemsPerPage = 20

  // AUTH + FETCH LOGS
  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    const userRole = localStorage.getItem("admin_role")
    if (!token) {
      router.push("/admin/login")
      return
    }

    setCurrentUserRole(userRole || "")
    setIsAuthenticated(true)
    loadLogs()
  }, [router])

  useEffect(() => {
    loadLogs()
  }, [page, sortBy, sortOrder, filterUser, filterAction, filterEntity, filterPermission])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: (page * itemsPerPage).toString(),
      })

      if (filterUser) params.append("userId", filterUser)
      if (filterAction) params.append("action", filterAction)
      if (filterEntity) params.append("entityType", filterEntity)
      if (filterPermission) params.append("permission", filterPermission)

      const res = await api.audit.getAllLogs(params.toString())
      setLogs(res.data || [])
      setTotalLogs(res.total || 0)
    } catch (err: any) {
      setErrorMessage("Impossible de charger les logs d'audit.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = () => {
    const csv = [
      ["Admin", "Action", "Permission", "Entité", "Date", "Description"],
      ...logs.map((log) => [
        log.admin_name,
        log.action,
        log.permission,
        `${log.entity_type}:${log.entity_id}`,
        new Date(log.created_at).toLocaleString("fr-FR"),
        log.description || log.details,
      ]),
    ]

    const csvContent = csv.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const clearFilters = () => {
    setFilterUser("")
    setFilterAction("")
    setFilterEntity("")
    setFilterPermission("")
    setSearchQuery("")
    setPage(0)
  }

  if (isLoading && !isAuthenticated) return null

  const totalPages = Math.ceil(totalLogs / itemsPerPage)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit des activités</h1>
            <p className="text-muted-foreground">Consultez l'historique de toutes les actions du système</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Download className="w-4 h-4" /> Exporter en CSV
          </button>
        </div>

        {/* Error message */}
        {errorMessage && <div className="p-3 bg-red-100 text-red-700 rounded-md">{errorMessage}</div>}

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par admin, action, entité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-card"
            />
          </div>
          <button onClick={clearFilters} className="px-4 py-2 border rounded-lg hover:bg-muted transition text-sm">
            Réinitialiser
          </button>
        </div>

        {/* Filters */}
        <AuditFilters
          filterUser={filterUser}
          setFilterUser={setFilterUser}
          filterAction={filterAction}
          setFilterAction={setFilterAction}
          filterEntity={filterEntity}
          setFilterEntity={setFilterEntity}
          filterPermission={filterPermission}
          setFilterPermission={setFilterPermission}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* Table */}
        <AuditTable logs={logs} isLoading={isLoading} />

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage de {logs.length > 0 ? page * itemsPerPage + 1 : 0} à{" "}
            {Math.min((page + 1) * itemsPerPage, totalLogs)} sur {totalLogs} entrées
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Précédent
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i
                if (totalPages > 5 && page > 2) {
                  pageNum = page - 2 + i
                }
                if (pageNum < totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        pageNum === page ? "bg-primary text-white" : "border hover:bg-muted"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                }
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}