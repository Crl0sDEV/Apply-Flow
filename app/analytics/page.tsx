"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Application {
  id: string;
  status: string;
  platform: string;
}

const STATUS_COLORS: Record<string, string> = {
  applied: '#94a3b8', // slate-400
  email_sent: '#fb923c', // orange-400
  interview: '#3b82f6', // blue-500
  hired: '#10b981', // emerald-500
  rejected: '#ef4444', // red-500
}

const PLATFORM_COLORS = '#6366f1' // indigo-500

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchApplications = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('applications')
      .select('id, status, platform')
      .eq('user_id', userId)

    if (error) {
      console.error("Fetch error:", error)
    } else {
      setApplications(data || [])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsAuthLoading(false)
      if (session?.user) fetchApplications(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchApplications(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [fetchApplications])

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <p>Please log in to view analytics.</p>
      </div>
    )
  }

  // Calculate Status Data for Pie Chart
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.keys(statusCounts).map(key => ({
    name: key.replace('_', ' ').toUpperCase(),
    value: statusCounts[key],
    color: STATUS_COLORS[key] || '#94a3b8'
  }));

  // Calculate Platform Data for Bar Chart
  const platformCounts = applications.reduce((acc, app) => {
    acc[app.platform] = (acc[app.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformData = Object.keys(platformCounts).map(key => ({
    name: key.toUpperCase(),
    Applications: platformCounts[key],
  }));

  return (
    <DashboardLayout userEmail={user.email}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground text-sm">Visualize your application progress</p>
          </div>
        </div>

        {isLoading ? (
           <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Pie Chart */}
            <Card className="bg-white dark:bg-card">
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Breakdown of all your job applications.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Applications']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No data to display</div>
                )}
              </CardContent>
            </Card>
            
            {/* Platform Bar Chart */}
            <Card className="bg-white dark:bg-card">
              <CardHeader>
                <CardTitle>Applications per Platform</CardTitle>
                <CardDescription>Where you're applying the most.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={platformData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip cursor={{fill: 'transparent'}} />
                      <Bar dataKey="Applications" fill={PLATFORM_COLORS} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No data to display</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
