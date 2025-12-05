import { groupPermissionsByCategory } from "@/lib/permissions-config"

interface PermissionsDisplayProps {
  role: string
  permissions?: string[]
  compact?: boolean
}

export function PermissionsDisplay({ role, permissions, compact = false }: PermissionsDisplayProps) {
  const displayPermissions = permissions || []
  const groupedPermissions = groupPermissionsByCategory(displayPermissions)

  if (Object.keys(groupedPermissions).length === 0) {
    return <div className="text-sm text-muted-foreground">Aucune permission configurée</div>
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {displayPermissions.map((perm) => (
          <span
            key={perm}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-900"
            title={perm}
          >
            {perm}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedPermissions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, perms]) => (
          <div key={category}>
            <h4 className="font-semibold text-sm mb-2 text-foreground">{category}</h4>
            <ul className="space-y-1">
              {perms.map((perm) => (
                <li key={perm.id} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-base">{perm.icon}</span>
                  <span>{perm.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  )
}
