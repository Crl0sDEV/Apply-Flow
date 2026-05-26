"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { isOfflineModeEnabled, addToSyncQueue, getFromLocalCache, saveToLocalCache } from "@/lib/offline-sync"

interface Application {
  id: string;
  company_name: string;
  position: string;
  platform: string;
  status: string;
  job_url: string | null;
  salary?: string | null;
  notes?: string | null;
  interview_date?: string | null;
  user_id?: string;
}

interface EditApplicationFormProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditApplicationForm({ application, open, onOpenChange, onSuccess }: EditApplicationFormProps) {
  const [loading, setLoading] = useState(false)
  
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [platform, setPlatform] = useState("linkedin")
  const [status, setStatus] = useState("applied")
  const [url, setUrl] = useState("")
  const [salary, setSalary] = useState("")
  const [notes, setNotes] = useState("")
  const [interviewDate, setInterviewDate] = useState("")

  useEffect(() => {
    if (application) {
      setCompany(application.company_name)
      setPosition(application.position)
      setPlatform(application.platform)
      setStatus(application.status)
      setUrl(application.job_url || "")
      setSalary(application.salary || "")
      setNotes(application.notes || "")
      
      // format interview_date for datetime-local input if exists
      if (application.interview_date) {
        const dateObj = new Date(application.interview_date);
        // Ensure local datetime format YYYY-MM-DDTHH:MM
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        setInterviewDate(dateObj.toISOString().slice(0, 16));
      } else {
        setInterviewDate("")
      }
    }
  }, [application])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!application) return;

    setLoading(true)

    const payload = { 
      company_name: company, 
      position: position, 
      platform: platform, 
      status: status, 
      job_url: url,
      salary: salary || null,
      notes: notes || null,
      interview_date: interviewDate ? new Date(interviewDate).toISOString() : null
    }

    const isOffline = !navigator.onLine;
    const offlineMode = await isOfflineModeEnabled();

    if (isOffline || offlineMode) {
      await addToSyncQueue({ action: 'UPDATE', table: 'applications', recordId: application.id, payload });
      
      const cacheKey = 'applications_data_' + (application.user_id || ''); // Assuming user_id is in application if we fetched it, though type might complain if not. Wait, the interface says `user_id?: string;`.
      if (application.user_id) {
        const cached: Application[] = await getFromLocalCache(cacheKey) || [];
        const updatedApps = cached.map(app => app.id === application.id ? { ...app, ...payload } : app);
        await saveToLocalCache(cacheKey, updatedApps);
      }
      
      setLoading(false)
      onOpenChange(false)
      onSuccess()
      return;
    }

    const { error } = await supabase
      .from('applications')
      .update(payload)
      .eq('id', application.id)

    if (!error && application.user_id) {
      const cacheKey = 'applications_data_' + application.user_id;
      const cached: Application[] = await getFromLocalCache(cacheKey) || [];
      const updatedApps = cached.map(app => app.id === application.id ? { ...app, ...payload } : app);
      await saveToLocalCache(cacheKey, updatedApps);
    }

    setLoading(false)

    if (error) {
      alert("Error: " + error.message)
    } else {
      onOpenChange(false)
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update the details of your job application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Company Name</Label>
              <Input id="edit-company" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-position">Position</Label>
              <Input id="edit-position" value={position} onChange={(e) => setPosition(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="upwork">Upwork</SelectItem>
                    <SelectItem value="jobstreet">Jobstreet</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="email_sent">Email Sent</SelectItem>
                    <SelectItem value="interview">Interviewing</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-salary">Expected Salary</Label>
                <Input id="edit-salary" placeholder="e.g. $50,000" value={salary} onChange={(e) => setSalary(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-interviewDate">Interview Date</Label>
                <Input id="edit-interviewDate" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">Job URL</Label>
              <Input id="edit-url" type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input id="edit-notes" placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Update Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
