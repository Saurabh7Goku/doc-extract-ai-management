'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PDFUploader from '@/components/PDFUploader'
import { useTaskWebSocket } from '@/app/api/websocket'
import { useJobToast } from '@/hooks/useJobToast'
import api from '@/lib/api'
import React from 'react'

interface Job {
  id: number
  title: string
  assigned_emails: string[]
}

export default function Working() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<number>(0)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [memberEmail, setMemberEmail] = useState<string | null>(null)
  const router = useRouter()

  const { status, message, result, error: wsError } = useTaskWebSocket(taskId)
  useJobToast(taskId)

  useEffect(() => {
    const existingTaskId = typeof window !== 'undefined' ? localStorage.getItem('activeTaskId') : null
    if (existingTaskId) {
      setTaskId(existingTaskId)
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.replace('/member/login')
      return
    }

    const loadJobs = async () => {
      try {
        const userRes = await api.get('/v1/users/me')
        setMemberEmail(userRes.data.email)

        const jobsRes = await api.get<Job[]>('/v1/jobs/assigned')
        setJobs(jobsRes.data)
      } catch (err) {
        setError('Failed to load jobs. Please ensure you have assignments.')
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  const handleTaskCreated = (newTaskId: string) => {
    setTaskId(newTaskId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTaskId', newTaskId)
    }
  }

  useEffect(() => {
    if (!taskId) return
    if (status === 'finished' || status === 'failed') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('activeTaskId')
      }
    }
  }, [status, taskId])

  if (loading) {
    return <div className="text-center py-10">Loading jobs...</div>
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600">
        No jobs assigned to {memberEmail ?? 'you'} yet. Please contact your admin.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold mb-2">Member Workspace</h1>
        <p className="text-sm text-gray-600">
          Signed in as {memberEmail}. Select a job assigned to you to upload PDFs.
        </p>
      </header>

      <div>
        <label className="block text-sm font-medium mb-2">Select Job</label>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(Number(e.target.value))}
          className="w-full p-3 border rounded-lg"
        >
          <option value={0} disabled>
            -- Choose a job --
          </option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      {selectedJob > 0 ? (
        <PDFUploader jobId={selectedJob} onTaskCreated={handleTaskCreated} />
      ) : (
        <div className="text-sm text-gray-500">Select a job to begin uploading PDFs.</div>
      )}

      {taskId && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">Task Progress</h2>

          <div className="flex items-center gap-3 mb-2">
            <span className="font-medium">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'finished'
                  ? 'bg-green-100 text-green-800'
                  : status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : status === 'running'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>

          {message && <p className="text-sm text-gray-600 mb-3">{message}</p>}

          {(error || wsError) && (
            <p className="text-sm text-red-600 mb-3">{error || wsError}</p>
          )}

          {result && (
            <div className="mt-4">
              <h3 className="font-medium text-lg mb-2">Extracted Data</h3>
              <pre className="p-3 bg-white rounded border text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>

              {result.errors?.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                  <p className="font-medium text-red-800">Validation Errors:</p>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {result.errors.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}