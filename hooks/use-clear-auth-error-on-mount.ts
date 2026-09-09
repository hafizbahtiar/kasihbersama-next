"use client"

import { useEffect } from "react"

import { useAuth } from "@/components/auth/auth-provider"

export function useClearAuthErrorOnMount() {
  const { clearError } = useAuth()

  useEffect(() => {
    clearError()
  }, [clearError])
}
