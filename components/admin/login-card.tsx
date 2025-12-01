"use client"

import type React from "react"

import { useState } from "react"
import { Loader2 } from "lucide-react"

interface LoginCardProps {
  onLogin: (email: string, password: string) => Promise<void>
  isLoading: boolean
  error: string
}

export function LoginCard({ onLogin, isLoading, error }: LoginCardProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isShaking, setIsShaking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin(email, password)

    if (error) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  return (
    <div
      className={`w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        isShaking ? "animate-shake" : ""
      }`}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>

      <div className="bg-[#121212] rounded-lg p-8 border border-red-900/30 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#F8F8F8] mb-2">Admin Login</h1>
          <p className="text-gray-400">Movie in the Park</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#F8F8F8]">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@moviepark.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-[#F8F8F8] placeholder-gray-500 focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/50 transition-colors disabled:opacity-50"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[#F8F8F8]">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-[#F8F8F8] placeholder-gray-500 focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/50 transition-colors disabled:opacity-50"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-md animate-in fade-in duration-300">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3 bg-[#A00000] hover:bg-[#CC0000] active:bg-[#800000] text-[#F8F8F8] font-semibold rounded-md transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(160,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center mb-2">Demo credentials:</p>
          <p className="text-xs text-gray-600 text-center font-mono">admin@moviepark.com / admin123</p>
        </div>
      </div>
    </div>
  )
}
