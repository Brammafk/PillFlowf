"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AccountPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to settings page since account and settings should be the same
    router.replace("/settings")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to settings...</p>
    </div>
  )
} 