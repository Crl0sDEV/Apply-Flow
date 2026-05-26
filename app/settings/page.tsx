"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { isOfflineModeEnabled, setOfflineModeEnabled } from "@/lib/offline-sync"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [password, setPassword] = useState("")
  const [offlineEnabled, setOfflineEnabled] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
    })
    
    isOfflineModeEnabled().then(setOfflineEnabled)
  }, [])

  const handleToggleOffline = async (checked: boolean) => {
    setOfflineEnabled(checked)
    await setOfflineModeEnabled(checked)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsUpdating(false)
    if (error) {
      alert("Error updating password: " + error.message)
    } else {
      alert("Password updated successfully!")
      setPassword("")
    }
  }

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950"><p>Please log in to view settings.</p></div>
  }

  return (
    <DashboardLayout userEmail={user.email}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground text-sm">Manage your account and preferences.</p>
        </div>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your current login information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input disabled value={user.email || ""} className="bg-slate-50 dark:bg-slate-950/50" />
              <p className="text-xs text-muted-foreground">Email changes are currently disabled.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white dark:bg-slate-950/50"
                />
              </div>
              <Button type="submit" disabled={isUpdating || !password}>
                {isUpdating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-card">
          <CardHeader>
            <CardTitle>Offline Sync</CardTitle>
            <CardDescription>Allow the app to function without internet and sync later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 p-4 rounded-lg bg-slate-50 dark:bg-slate-950/50">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Offline Mode</Label>
                <p className="text-sm text-muted-foreground">Save changes locally when offline.</p>
              </div>
              <Switch checked={offlineEnabled} onCheckedChange={handleToggleOffline} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
