'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface Job {
  id: number
  title: string
  prompt: string
  fields: Record<string, any>
  created_at: string
  status?: string
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchJobs = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<Job[]>('/v1/jobs')
      setJobs(response.data)
    } catch (err) {
      setError('Failed to load jobs. Are you an admin?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const toggleSelection = (jobId: number) => {
    setSelected((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    )
  }

  const deleteJobs = async (jobIds: number[]) => {
    if (!jobIds.length) return
    setIsDeleting(true)
    try {
      await api.delete('/v1/jobs', {
        data: { job_ids: jobIds },
      })
      toast.success(
        jobIds.length === 1 ? 'Job deleted successfully' : 'Jobs deleted successfully'
      )
      setSelected((prev) => prev.filter((id) => !jobIds.includes(id)))
      fetchJobs()
    } catch (err) {
      toast.error('Failed to delete jobs. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <div className="text-center py-10">Loading jobs...</div>
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Admin: Manage Jobs</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => deleteJobs(selected)}
            disabled={!selected.length || isDeleting}
            className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : `Delete Selected (${selected.length})`}
          </button>
          <Link
            href="/admin/jobs/create"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Create New Job
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>No jobs yet. Create your first job!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                <input
                  type="checkbox"
                  checked={selected.includes(job.id)}
                  onChange={() => toggleSelection(job.id)}
                  className="h-5 w-5 text-blue-600 rounded"
                />
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {job.prompt.substring(0, 120)}
              </p>
              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p>Fields: {Object.keys(job.fields).join(', ')}</p>
                <p>Status: {job.status ?? 'draft'}</p>
                <p>Created: {new Date(job.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/test/${job.id}`}
                  className="flex-1 bg-green-600 text-white text-center py-2 rounded hover:bg-green-700 text-sm"
                >
                  Test Prompt
                </Link>
                <Link
                  href={`/admin/jobs/edit/${job.id}`}
                  className="flex-1 bg-gray-600 text-white text-center py-2 rounded hover:bg-gray-700 text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteJobs([job.id])}
                  className="w-full bg-red-100 text-red-700 text-sm font-medium py-2 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}