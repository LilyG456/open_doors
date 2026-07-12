"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export type UserRow = {
  id: string
  email: string
  displayName: string | null
  role: string
  createdAt: string
}

const ROLE_OPTIONS = ["USER", "MODERATOR", "ADMIN"] as const

export function UserRoleTable({ rows: initialRows, currentUserId }: { rows: UserRow[]; currentUserId: string }) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function changeRole(id: string, newRole: string) {
    const row = rows.find((r) => r.id === id)
    if (!row || newRole === row.role) return
    if (!window.confirm(`Change ${row.email}'s role from ${row.role} to ${newRole}?`)) return

    setPendingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.")
        return
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role: newRole } : r)))
      router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">{error}</p>
      )}
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium text-foreground">{row.displayName ?? row.email}</p>
            <p className="text-xs text-muted-foreground">
              {row.email} · joined {new Date(row.createdAt).toLocaleDateString()}
            </p>
          </div>

          {row.id === currentUserId ? (
            <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {row.role} (you)
            </span>
          ) : (
            <select
              value={row.role}
              disabled={pendingId === row.id}
              onChange={(e) => changeRole(row.id, e.target.value)}
              className="h-9 rounded-full border border-border bg-background px-3 text-xs font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  )
}
