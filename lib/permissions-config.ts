// Configuration des permissions avec descriptions user-friendly
export const permissionsConfig: Record<
  string,
  {
    group: string
    description: string
    icon: string
  }
> = {
  // PACKS
  "packs.create": {
    group: "Forfaits",
    description: "Créer de nouveaux forfaits",
    icon: "📦",
  },
  "packs.edit": {
    group: "Forfaits",
    description: "Modifier les forfaits existants",
    icon: "✏️",
  },
  "packs.delete": {
    group: "Forfaits",
    description: "Supprimer les forfaits",
    icon: "🗑️",
  },

  // RÉSERVATIONS
  "reservations.create": {
    group: "Réservations",
    description: "Créer de nouvelles réservations",
    icon: "📋",
  },
  "reservations.view": {
    group: "Réservations",
    description: "Voir toutes les réservations",
    icon: "👁️",
  },
  "reservations.edit": {
    group: "Réservations",
    description: "Modifier les réservations",
    icon: "✏️",
  },
  "reservations.delete.soft": {
    group: "Réservations",
    description: "Annuler les réservations",
    icon: "❌",
  },
  "reservations.delete.permanent": {
    group: "Réservations",
    description: "Supprimer définitivement les réservations",
    icon: "💥",
  },

  // PAIEMENTS
  "payments.create": {
    group: "Paiements",
    description: "Enregistrer de nouveaux paiements",
    icon: "💳",
  },
  "payments.edit": {
    group: "Paiements",
    description: "Modifier les paiements",
    icon: "✏️",
  },
  "payments.delete": {
    group: "Paiements",
    description: "Supprimer les paiements",
    icon: "🗑️",
  },
  "payments.statistics": {
    group: "Paiements",
    description: "Voir les statistiques de paiement",
    icon: "📊",
  },

  // TICKETS
  "tickets.view": {
    group: "Tickets",
    description: "Voir tous les tickets",
    icon: "🎫",
  },
  "tickets.generate": {
    group: "Tickets",
    description: "Générer des tickets QR",
    icon: "📱",
  },
  "tickets.preview": {
    group: "Tickets",
    description: "Prévisualiser les tickets",
    icon: "👁️",
  },
  "tickets.download": {
    group: "Tickets",
    description: "Télécharger les tickets",
    icon: "⬇️",
  },

  // SCAN
  "scan.decode": {
    group: "Scan",
    description: "Décoder les codes QR",
    icon: "📸",
  },
  "scan.search": {
    group: "Scan",
    description: "Rechercher les tickets scannés",
    icon: "🔍",
  },
  "scan.validate": {
    group: "Scan",
    description: "Valider l'entrée des participants",
    icon: "✔️",
  },
  "scan.statistics": {
    group: "Scan",
    description: "Voir les statistiques de scan",
    icon: "📊",
  },

  // UTILISATEURS
  "users.create": {
    group: "Utilisateurs",
    description: "Créer de nouveaux administrateurs",
    icon: "👤",
  },
  "users.edit": {
    group: "Utilisateurs",
    description: "Modifier les administrateurs",
    icon: "✏️",
  },
  "users.delete": {
    group: "Utilisateurs",
    description: "Supprimer les administrateurs",
    icon: "🗑️",
  },
  "users.view.all": {
    group: "Utilisateurs",
    description: "Voir tous les administrateurs",
    icon: "👥",
  },
  "users.edit.role": {
    group: "Utilisateurs",
    description: "Modifier le rôle des administrateurs",
    icon: "🛠️",
  },
}

// Permissions associées à chaque rôle
export const rolePermissions: Record<string, string[]> = {
  superadmin: [
    // Tous les droits
    "packs.create",
    "packs.edit",
    "packs.delete",
    "reservations.create",
    "reservations.view",
    "reservations.edit",
    "reservations.delete.soft",
    "reservations.delete.permanent",
    "payments.create",
    "payments.edit",
    "payments.delete",
    "payments.statistics",
    "tickets.view",
    "tickets.generate",
    "tickets.preview",
    "tickets.download",
    "scan.decode",
    "scan.search",
    "scan.validate",
    "scan.statistics",
    "users.create",
    "users.edit",
    "users.delete",
    "users.view.all",
    "users.edit.role",
  ],
  admin: [
    "packs.view",
    "reservations.create",
    "reservations.view",
    "reservations.edit",
    "reservations.delete.soft",
    "payments.create",
    "payments.edit",
    "payments.statistics",
    "tickets.view",
    "tickets.generate",
    "tickets.preview",
    "tickets.download",
    "scan.decode",
    "scan.search",
    "scan.validate",
    "scan.statistics",
  ],
  cashier: [
    "reservations.create",
    "reservations.view",
    "payments.create",
    "payments.edit",
    "tickets.view",
    "tickets.generate",
    "tickets.preview",
  ],
  scanner: ["tickets.view", "scan.decode", "scan.search", "scan.validate", "scan.statistics"],
  operator: [
    "reservations.create",
    "reservations.view",
    "reservations.edit",
    "reservations.delete.soft",
    "tickets.view",
    "tickets.generate",
    "tickets.preview",
    "scan.decode",
    "scan.search",
    "scan.validate",
  ],
}

// Fonction pour obtenir les permissions d'un rôle
export const getPermissionsForRole = (role: string): string[] => {
  return rolePermissions[role] || []
}

// Fonction pour grouper les permissions par catégorie
export const groupPermissionsByCategory = (
  permissions: string[],
): Record<string, Array<{ id: string; description: string; icon: string }>> => {
  const grouped: Record<string, Array<{ id: string; description: string; icon: string }>> = {}

  permissions.forEach((perm) => {
    const config = permissionsConfig[perm]
    if (config) {
      if (!grouped[config.group]) {
        grouped[config.group] = []
      }
      grouped[config.group].push({
        id: perm,
        description: config.description,
        icon: config.icon,
      })
    }
  })

  return grouped
}
