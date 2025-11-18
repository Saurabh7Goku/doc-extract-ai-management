'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface FormState {
  title: string
  description: string
  prompt: string
  fields: string
  assigned_emails: string
  status?: string
}

export default function EditJobPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [formData, setFormData] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await api.get(`/v1/jobs/${id}`)
        const job = response.data
        setFormData({
          title: job.title,
          description: job.description ?? '',
          prompt: job.prompt,
          fields: JSON.stringify(job.fields, null, 2),
          assigned_emails: JSON.stringify(job.assigned_emails, null, 2),
          status: job.status,
        })
      } catch (err) {
        toast.error('Failed to load job details')
        router.push('/admin/jobs')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadJob()
    }
  }, [id, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setSaving(true)
    try {
      await api.put(`/v1/jobs/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        prompt: formData.prompt.trim(),
        status: formData.status,
        fields: JSON.parse(formData.fields),
        assigned_emails: JSON.parse(formData.assigned_emails),
      })
      toast.success('Job updated successfully')
      router.push('/admin/jobs')
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || err.message || 'Failed to update job. Please try again.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !formData) {
    return <div className="text-center py-10">Loading job...</div>
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-6">Edit Job</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            rows={5}
            className="w-full border rounded px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Fields JSON</label>
          <textarea
            name="fields"
            value={formData.fields}
            onChange={handleChange}
            rows={8}
            className="w-full border rounded px-4 py-2 font-mono text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Assigned Emails JSON</label>
          <textarea
            name="assigned_emails"
            value={formData.assigned_emails}
            onChange={handleChange}
            rows={5}
            className="w-full border rounded px-4 py-2 font-mono text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Updating...' : 'Update Job'}
        </button>
      </form>
    </div>
  )
}