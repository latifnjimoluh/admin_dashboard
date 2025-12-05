"use client"

const ACTIONS = ["create", "read", "update", "delete"]
const ENTITY_TYPES = ["user", "admin", "reservation", "payment", "ticket", "pack", "scan"]
const PERMISSIONS = [
  "users.create",
  "users.edit",
  "users.delete",
  "users.view",
  "packs.create",
  "packs.edit",
  "packs.delete",
  "reservations.create",
  "reservations.view",
  "reservations.edit",
  "payments.create",
  "payments.edit",
  "tickets.generate",
  "tickets.view",
]

interface AuditFiltersProps {
  filterUser: string
  setFilterUser: (value: string) => void
  filterAction: string
  setFilterAction: (value: string) => void
  filterEntity: string
  setFilterEntity: (value: string) => void
  filterPermission: string
  setFilterPermission: (value: string) => void
  sortBy: string
  setSortBy: (value: string) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (value: "asc" | "desc") => void
}

export function AuditFilters({
  filterUser,
  setFilterUser,
  filterAction,
  setFilterAction,
  filterEntity,
  setFilterEntity,
  filterPermission,
  setFilterPermission,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}: AuditFiltersProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Filter by User */}
      <div>
        <label className="block text-sm font-medium mb-2">Administrateur</label>
        <input
          type="text"
          placeholder="Nom ou ID..."
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-card text-sm"
        />
      </div>

      {/* Filter by Action */}
      <div>
        <label className="block text-sm font-medium mb-2">Action</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-card text-sm"
        >
          <option value="">Toutes</option>
          {ACTIONS.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by Entity Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Type d'entité</label>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-card text-sm"
        >
          <option value="">Toutes</option>
          {ENTITY_TYPES.map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by Permission */}
      <div>
        <label className="block text-sm font-medium mb-2">Permission</label>
        <select
          value={filterPermission}
          onChange={(e) => setFilterPermission(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-card text-sm"
        >
          <option value="">Toutes</option>
          {PERMISSIONS.map((perm) => (
            <option key={perm} value={perm}>
              {perm}
            </option>
          ))}
        </select>
      </div>

      {/* Sort by */}
      <div>
        <label className="block text-sm font-medium mb-2">Trier par</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-card text-sm"
        >
          <option value="date">Date</option>
          <option value="admin">Administrateur</option>
          <option value="action">Action</option>
          <option value="entity">Entité</option>
        </select>
      </div>

      {/* Sort order */}
      <div>
        <label className="block text-sm font-medium mb-2">Ordre</label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          className="w-full px-3 py-2 border rounded-lg bg-card text-sm"
        >
          <option value="desc">Décroissant</option>
          <option value="asc">Croissant</option>
        </select>
      </div>
    </div>
  )
}
