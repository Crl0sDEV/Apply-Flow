"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusCircle, Loader2 } from "lucide-react"
import { isOfflineModeEnabled, addToSyncQueue, getFromLocalCache, saveToLocalCache } from "@/lib/offline-sync"

// DITO NATIN FINIX YUNG ERROR: Define the props interface
interface AddApplicationFormProps {
  onSuccess: () => void;
  userId?: string;
}

export function AddApplicationForm({ onSuccess, userId }: AddApplicationFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [platform, setPlatform] = useState("linkedin")
  const [status, setStatus] = useState("applied")
  const [url, setUrl] = useState("")
  const [salary, setSalary] = useState("")
  const [notes, setNotes] = useState("")
  const [interviewDate, setInterviewDate] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload: any = { 
      company_name: company, 
      position: position, 
      platform: platform, 
      status: status, 
      job_url: url,
      salary: salary || null,
      notes: notes || null,
      interview_date: interviewDate ? new Date(interviewDate).toISOString() : null
    };

    // Include user_id if provided (highly recommended for RLS)
    if (userId) {
      payload.user_id = userId;
    }

    const isOffline = !navigator.onLine;
    const offlineMode = await isOfflineModeEnabled();

    if (isOffline || offlineMode) {
      payload.id = crypto.randomUUID();
      payload.created_at = new Date().toISOString();
      await addToSyncQueue({ action: 'INSERT', table: 'applications', recordId: payload.id, payload });
      
      if (userId) {
        const cacheKey = 'applications_data_' + userId;
        const cached = await getFromLocalCache(cacheKey) || [];
        await saveToLocalCache(cacheKey, [payload, ...cached]);
      }
      
      setLoading(false)
      setOpen(false)
      setCompany("")
      setPosition("")
      setUrl("")
      setSalary("")
      setNotes("")
      setInterviewDate("")
      onSuccess()
      return;
    }

    const { error } = await supabase
      .from('applications')
      .insert([payload])

    if (!error && userId) {
      const cacheKey = 'applications_data_' + userId;
      const cached = await getFromLocalCache(cacheKey) || [];
      await saveToLocalCache(cacheKey, [payload, ...cached]);
    }

    setLoading(false)

    if (error) {
      alert("Error: " + error.message)
    } else {
      setOpen(false)
      setCompany("")
      setPosition("")
      setUrl("")
      setSalary("")
      setNotes("")
      setInterviewDate("")
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex gap-2 shadow-md">
          <PlusCircle size={18} /> New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogDescription>
              Keep track of your job hunt. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} required />
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
                <Label htmlFor="salary">Expected Salary</Label>
                <Input id="salary" placeholder="e.g. $50,000" value={salary} onChange={(e) => setSalary(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interviewDate">Interview Date</Label>
                <Input id="interviewDate" type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Job URL</Label>
              <Input id="url" type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}