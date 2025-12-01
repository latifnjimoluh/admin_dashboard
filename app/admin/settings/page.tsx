"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"

export default function SettingsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    lieu: "Parc National de Cameroun",
    dateEvenement: "2025-12-20",
    heureFilm1: "19:00",
    heureFilm2: "21:30",
    telephoneMoMo: "+237 6 70 123 456",
    emailContact: "contact@movieinthepark.cm",
    instagram: "@movieintheparkCM",
    clePublique: "MTP_PUBLIC_KEY_2025",
    formatQR: "QR_V10",
    prefixeTicket: "MTP2025-",
    modeClair: false,
    langue: "FR",
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (isLoading || !isAuthenticated) return null

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">Configurez les paramètres généraux de l'événement</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Paramètres mis à jour avec succès</p>
          </div>
        )}

        {/* Configuration générale */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Configuration générale</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Lieu de l'événement</label>
            <input
              type="text"
              value={settings.lieu}
              onChange={(e) => setSettings({ ...settings, lieu: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date de l'événement</label>
              <input
                type="date"
                value={settings.dateEvenement}
                onChange={(e) => setSettings({ ...settings, dateEvenement: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Heure du premier film</label>
              <input
                type="time"
                value={settings.heureFilm1}
                onChange={(e) => setSettings({ ...settings, heureFilm1: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Heure du deuxième film</label>
            <input
              type="time"
              value={settings.heureFilm2}
              onChange={(e) => setSettings({ ...settings, heureFilm2: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Téléphone MoMo</label>
            <input
              type="text"
              value={settings.telephoneMoMo}
              onChange={(e) => setSettings({ ...settings, telephoneMoMo: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email de contact</label>
              <input
                type="email"
                value={settings.emailContact}
                onChange={(e) => setSettings({ ...settings, emailContact: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Lien Instagram</label>
              <input
                type="text"
                value={settings.instagram}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Paramètres techniques */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Paramètres techniques</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Clé publique QR</label>
            <input
              type="text"
              value={settings.clePublique}
              readOnly
              className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Format QR</label>
              <select
                value={settings.formatQR}
                onChange={(e) => setSettings({ ...settings, formatQR: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              >
                <option value="QR_V10">QR V10</option>
                <option value="QR_V20">QR V20</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Préfixe des tickets</label>
              <input
                type="text"
                value={settings.prefixeTicket}
                onChange={(e) => setSettings({ ...settings, prefixeTicket: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Paramètres interface */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Paramètres interface</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Langue</label>
              <select
                value={settings.langue}
                onChange={(e) => setSettings({ ...settings, langue: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              >
                <option value="FR">Français</option>
                <option value="EN">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full px-4 py-3 bg-primary hover:bg-accent text-primary-foreground rounded-lg font-medium transition-colors"
        >
          Enregistrer les paramètres
        </button>
      </div>
    </AdminLayout>
  )
}
