"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MoreHorizontal, ExternalLink, Pencil, Trash2, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddApplicationForm } from "@/components/forms/add-application-form"
import { EditApplicationForm } from "@/components/forms/edit-application-form"
import { Auth } from "@/components/auth/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from "@/components/kanban-board"
import { getFromLocalCache, saveToLocalCache, processSyncQueue, addToSyncQueue, isOfflineModeEnabled } from "@/lib/offline-sync"

interface Application {
  id: string;
  company_name: string;
  position: string;
  platform: string;
  status: string;
  job_url: string | null;
  created_at: string;
  user_id?: string;
  salary?: string | null;
  notes?: string | null;
  interview_date?: string | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const userId = user?.id;

  const fetchApplications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    
    // 1. Fast path: load from local cache
    const cached = await getFromLocalCache('applications_data_' + userId);
    if (cached) setApplications(cached);

    // 2. Try fetching from network if online
    if (navigator.onLine) {
      await processSyncQueue(); // Flush offline actions first
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApplications(data);
        await saveToLocalCache('applications_data_' + userId, data);
      } else if (error) {
        console.error("Fetch error:", error);
      }
    }
    
    setLoading(false);
  }, [userId]);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch when user is available
  useEffect(() => {
    if (userId) {
      fetchApplications();
    }
  }, [userId, fetchApplications]);

  // Online listener
  useEffect(() => {
    const handleOnline = () => {
      fetchApplications();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchApplications]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this application?")) {
      const isOffline = !navigator.onLine;
      const offlineMode = await isOfflineModeEnabled();

      if (isOffline || offlineMode) {
        await addToSyncQueue({ action: 'DELETE', table: 'applications', recordId: id, payload: {} });
        const updatedApps = applications.filter(app => app.id !== id);
        setApplications(updatedApps);
        await saveToLocalCache('applications_data_' + user.id, updatedApps);
        return;
      }

      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (!error) {
        fetchApplications();
      } else {
        console.error("Delete error:", error);
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user) return;
    // Optimistic update for snappy UI
    const updatedApps = applications.map(app => app.id === id ? { ...app, status: newStatus } : app);
    setApplications(updatedApps);
    
    const isOffline = !navigator.onLine;
    const offlineMode = await isOfflineModeEnabled();

    if (isOffline || offlineMode) {
      await addToSyncQueue({ action: 'UPDATE', table: 'applications', recordId: id, payload: { status: newStatus } });
      await saveToLocalCache('applications_data_' + user.id, updatedApps);
      return;
    }
    
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', id)
      
    if (error) {
      console.error("Update error:", error);
      fetchApplications(); // Revert on error
    } else {
      await saveToLocalCache('applications_data_' + user.id, updatedApps);
    }
  }

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setIsEditModalOpen(true);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage) || 1;
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50/50"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
  }

  if (!user) {
    return <Auth />
  }

  return (
    <DashboardLayout userEmail={user.email}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
            <p className="text-muted-foreground text-sm">Manage your job applications</p>
          </div>
          <AddApplicationForm onSuccess={fetchApplications} userId={user.id} />
        </div>

        {/* Basic Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-blue-600/80 dark:text-blue-400">Total Applications</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{applications.length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-yellow-50/50 dark:bg-yellow-900/10">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-yellow-600/80 dark:text-yellow-400">Interviews</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{applications.filter(app => app.status === 'interview').length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-emerald-600/80 dark:text-emerald-400">Hired</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{applications.filter(app => app.status === 'hired').length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase text-red-600/80 dark:text-red-400">Rejected</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{applications.filter(app => app.status === 'rejected').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search company or position..."
              className="pl-9 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="email_sent">Email Sent</SelectItem>
                <SelectItem value="interview">Interviewing</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <div className="flex justify-end mb-4">
            <TabsList className="bg-slate-100 dark:bg-slate-900">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="board">Board View</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="space-y-4">
            <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-card">
              {loading ? (
                <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-100/50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="hidden md:table-cell">Platform</TableHead>
                      <TableHead className="hidden lg:table-cell">Interview Date</TableHead>
                      <TableHead className="hidden xl:table-cell">Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApplications.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No records found.</TableCell></TableRow>
                    ) : (
                      paginatedApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-semibold text-slate-700 dark:text-slate-200">{app.company_name}</TableCell>
                          <TableCell>{app.position}</TableCell>
                          <TableCell className="hidden md:table-cell capitalize text-xs">{app.platform}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {app.interview_date ? new Date(app.interview_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-xs text-slate-600 dark:text-slate-400">
                            {app.salary || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`capitalize font-bold border-none
                                ${app.status === 'interview' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200' : ''}
                                ${app.status === 'hired' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' : ''}
                                ${app.status === 'applied' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200' : ''}
                                ${app.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 hover:bg-red-200' : ''}
                                ${app.status === 'email_sent' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 hover:bg-orange-200' : ''}
                              `}
                              variant="secondary"
                            >
                              {app.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {app.job_url && (
                                  <DropdownMenuItem onClick={() => window.open(app.job_url || '', '_blank')}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Job Post
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleEdit(app)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                  onClick={() => handleDelete(app.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Application
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>

            {/* Pagination Controls */}
            {!loading && filteredApplications.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                <p className="text-sm text-slate-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of {filteredApplications.length} entries
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400 px-2 font-medium">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="board">
            <KanbanBoard applications={filteredApplications} onStatusChange={handleStatusChange} />
          </TabsContent>
        </Tabs>
      </div>

      <EditApplicationForm 
        application={editingApp}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={fetchApplications}
      />
    </DashboardLayout>
  )
}