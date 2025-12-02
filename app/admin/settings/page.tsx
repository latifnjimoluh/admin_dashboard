"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { api } from "@/lib/api"

export default function SettingsPage() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  /* --------------------------
     INFOS DU COMPTE CONNECTÉ
  ---------------------------*/
  const [me, setMe] = useState({
    name: "",
    email: "",
    role: "",
  })

  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [pwMessage, setPwMessage] = useState("")
  const [pwError, setPwError] = useState("")

  /* --------------------------
     PARAMÈTRES GÉNÉRAUX
  ---------------------------*/
  const [saved, setSaved] = useState(false)

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
    langue: "FR",
  })

  /* --------------------------
        AUTH + LOAD USER
  ---------------------------*/
  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    setIsAuthenticated(true)
    loadMe()
  }, [router])

  const loadMe = async () => {
    try {
      const res = await api.users.me()
      setMe({
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
      })
    } catch (e) {
      console.log("Erreur chargement profil", e)
    } finally {
      setIsLoading(false)
    }
  }

  /* --------------------------
     MODIFIER MOT DE PASSE
  ---------------------------*/
  const handlePasswordChange = async () => {
    setPwMessage("")
    setPwError("")

    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError("Tous les champs sont obligatoires.")
      return
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas.")
      return
    }

    try {
      await api.users.updatePassword({
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      })

      setPwMessage("Mot de passe mis à jour avec succès.")
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err: any) {
      setPwError(err?.data?.message || "Erreur lors de la mise à jour du mot de passe.")
    }
  }

  /* --------------------------
     SAUVEGARDE DES PARAMÈTRES
  ---------------------------*/
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (isLoading || !isAuthenticated) return null

  /* ============================================================
                        RENDER PAGE
  ============================================================ */

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Gérez les paramètres et votre compte</p>
        </div>

        {/* SUCCÈS GLOBAL */}
        {saved && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">Paramètres mis à jour avec succès.</p>
          </div>
        )}

        {/* =====================================================
              1) VOLET INFO DU COMPTE CONNECTÉ
        ====================================================== */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Mon compte</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Nom complet</label>
            <input
              type="text"
              value={me.name}
              readOnly
              className="w-full px-3 py-2 bg-secondary border border-border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="text"
              value={me.email}
              readOnly
              className="w-full px-3 py-2 bg-secondary border border-border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rôle</label>
            <input
              type="text"
              value={me.role}
              readOnly
              className="w-full px-3 py-2 bg-secondary border border-border rounded-md"
            />
          </div>
        </div>

        {/* =====================================================
              2) VOLET MODIFIER LE MOT DE PASSE
        ====================================================== */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Modifier le mot de passe</h2>

          {pwMessage && <div className="p-3 bg-green-100 text-green-800 rounded">{pwMessage}</div>}
          {pwError && <div className="p-3 bg-red-100 text-red-800 rounded">{pwError}</div>}

          <div>
            <label className="block text-sm font-medium mb-2">Ancien mot de passe</label>
            <input
              type="password"
              value={pwForm.oldPassword}
              onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg"
          >
            Mettre à jour le mot de passe
          </button>
        </div>

        {/* =====================================================
              3) PARAMÈTRES GÉNÉRAUX (ton code original)
        ====================================================== */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Configuration générale</h2>

          {/* LIEU */}
          <div>
            <label className="block text-sm font-medium mb-2">Lieu de l'événement</label>
            <input
              type="text"
              value={settings.lieu}
              onChange={(e) => setSettings({ ...settings, lieu: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-border rounded-md"
            />
          </div>

          {/* ... (TOUT LE RESTE EST IDENTIQUE À TON CODE) ... */}
        </div>

        {/* BOUTON SAVE */}
        <button
          onClick={handleSave}
          className="w-full px-4 py-3 bg-primary text-white rounded-lg"
        >
          Enregistrer les paramètres
        </button>
      </div>
    </AdminLayout>
  )
}
