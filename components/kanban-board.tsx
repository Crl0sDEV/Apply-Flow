"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Application {
  id: string;
  company_name: string;
  position: string;
  status: string;
}

interface KanbanBoardProps {
  applications: Application[];
  onStatusChange: (id: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: 'applied', label: 'Applied', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'email_sent', label: 'Email Sent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  { id: 'interview', label: 'Interviewing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { id: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
]

export function KanbanBoard({ applications, onStatusChange }: KanbanBoardProps) {
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("applicationId", id)
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("applicationId")
    if (id) {
      onStatusChange(id, status)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[60vh] mt-4">
      {COLUMNS.map((column) => (
        <div 
          key={column.id} 
          className="flex-1 min-w-[280px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{column.label}</h3>
            <Badge variant="secondary" className="rounded-full">
              {applications.filter(a => a.status === column.id).length}
            </Badge>
          </div>
          <div className="space-y-3 min-h-[100px]">
            {applications.filter(app => app.status === column.id).map(app => (
              <Card 
                key={app.id} 
                draggable 
                onDragStart={(e) => handleDragStart(e, app.id)}
                className="cursor-grab active:cursor-grabbing border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-card"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="font-semibold text-sm leading-none">{app.company_name}</div>
                  <div className="text-xs text-muted-foreground">{app.position}</div>
                  <Badge className={`text-[10px] mt-2 border-none ${column.color}`} variant="outline">
                    {column.label}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {applications.filter(app => app.status === column.id).length === 0 && (
               <div className="text-xs text-center text-slate-400 dark:text-slate-600 py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                 Drop here
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
