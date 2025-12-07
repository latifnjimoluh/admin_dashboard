"use client"

import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronDown } from "lucide-react"
import { useState, Fragment } from "react"

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
  user?: {
    id: string
    name: string
    email: string
  }
}

interface AuditTableProps {
  logs: ActivityLog[]
  isLoading: boolean
}

export function AuditTable({ logs, isLoading }: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-900"
      case "update":
        return "bg-blue-100 text-blue-900"
      case "delete":
        return "bg-red-100 text-red-900"
      case "read":
        return "bg-gray-100 text-gray-900"
      case "export":
        return "bg-purple-100 text-purple-900"
      case "validate":
        return "bg-orange-100 text-orange-900"
      default:
        return "bg-gray-100 text-gray-900"
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Chargement des logs...</p>
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Aucun log d'audit trouvé</p>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-4 font-medium">Administrateur</th>
              <th className="text-left p-4 font-medium">Action</th>
              <th className="text-left p-4 font-medium">Permission</th>
              <th className="text-left p-4 font-medium">Entité</th>
              <th className="text-left p-4 font-medium">Date & Heure</th>
              <th className="text-center p-4 font-medium">Détails</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <Fragment key={log.id}>
                <tr className="border-t hover:bg-muted/50 transition">
                  <td className="p-4">
                    <div className="font-medium">{log.user?.name || log.admin_name || "Utilisateur inconnu"}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {log.user?.email || log.user_id}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>

                  <td className="p-4">
                    <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                      {log.permission}
                    </code>
                  </td>

                  <td className="p-4">
                    <div className="text-sm">{log.entity_type}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      ID: {log.entity_id}
                    </div>
                  </td>

                  <td className="p-4 text-xs whitespace-nowrap">
                    <div>{new Date(log.created_at).toLocaleDateString("fr-FR")}</div>
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { locale: fr, addSuffix: true })}
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="inline-flex items-center justify-center w-6 h-6 hover:bg-muted rounded transition"
                    >
                      <ChevronDown className={`w-4 h-4 transition ${expandedId === log.id ? "rotate-180" : ""}`} />
                    </button>
                  </td>
                </tr>

                {expandedId === log.id && (
                  <tr className="border-t bg-muted/30">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Description de l'action</h4>
                          <p className="text-muted-foreground break-words">
                            {log.description || log.details || "Aucune description disponible"}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Informations techniques</h4>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div>
                              <strong className="text-foreground">IP Address:</strong> {log.ip_address || "N/A"}
                            </div>
                            <div className="break-all">
                              <strong className="text-foreground">User Agent:</strong> {log.user_agent || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
