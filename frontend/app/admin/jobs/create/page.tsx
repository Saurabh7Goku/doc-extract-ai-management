'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

interface FormData {
  title: string
  description: string
  prompt: string
  fields: string
  assigned_emails: string
}

interface GeneratedCredential {
  email: string
  password: string
}

const generatePassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function CreateJobPage() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    prompt: '',
    fields: '{\n  \n}',
    assigned_emails: '[\n  \n]',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<GeneratedCredential[]>([])
  const router = useRouter()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev
        return rest
      })
    }
  }

  const formatJson = (value: string) => {
    try {
      const parsed = JSON.parse(value)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return value
    }
  }

  const validateJson = (field: 'fields' | 'assigned_emails'): boolean => {
    try {
      JSON.parse(formData[field])
      return true
    } catch {
      setErrors((prev) => ({
        ...prev,
        [field]: `Invalid JSON in ${field === 'fields' ? 'Fields' : 'Emails'}`,
      }))
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    setCredentials([])

    const fieldsOk = validateJson('fields')
    const emailsOk = validateJson('assigned_emails')
    if (!fieldsOk || !emailsOk) {
      toast.error('Please fix the JSON errors before submitting.')
      setLoading(false)
      return
    }

    try {
      const assignedEmails: string[] = JSON.parse(formData.assigned_emails)
      if (!Array.isArray(assignedEmails)) {
        throw new Error('assigned_emails must be an array of emails')
      }

      const normalizedEmails = assignedEmails
        .map((email) => email?.trim())
        .filter((email): email is string => Boolean(email))

      const newCredentials: GeneratedCredential[] = []
      const alreadyRegistered: string[] = []

      await api.post('/v1/jobs/', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        prompt: formData.prompt.trim(),
        fields: JSON.parse(formData.fields),
        assigned_emails: normalizedEmails,
      })

      for (const email of normalizedEmails) {
        try {
          const password = generatePassword()
          await api.post('/v1/auth/register-member', { email, password })
          newCredentials.push({ email, password })
        } catch (inviteError: any) {
          const detail = inviteError?.response?.data?.detail || ''
          if (
            inviteError?.response?.status === 400 &&
            typeof detail === 'string' &&
            detail.toLowerCase().includes('already exists')
          ) {
            alreadyRegistered.push(email)
            continue
          }
          toast.error(`Failed to invite ${email}`)
        }
      }

      if (newCredentials.length) {
        setCredentials(newCredentials)
        toast.success('Job created. Share credentials with assigned members below.')
        if (alreadyRegistered.length) {
          toast(`Already registered: ${alreadyRegistered.join(', ')}`)
        }
      } else {
        if (alreadyRegistered.length === normalizedEmails.length && normalizedEmails.length > 0) {
          toast.success('Job created. All assigned members already have accounts.')
        } else {
          toast.success('Job created successfully')
        }
        router.push('/admin/jobs')
      }
    } catch (err: any) {
      const raw = err?.response?.data?.detail
      const message = Array.isArray(raw)
        ? raw
            .map((entry: any) =>
              typeof entry === 'string'
                ? entry
                : entry?.msg || JSON.stringify(entry)
            )
            .join(', ')
        : typeof raw === 'string'
        ? raw
        : err?.message || 'Failed to create job. Please try again.'

      setErrors({ submit: message })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Create New Job</h1>
          <p className="text-gray-600 mt-2">Define your PDF extraction task</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Invoice Data Extraction"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional notes about this job..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prompt Template <span className="text-red-500">*</span>
              </label>
              <textarea
                name="prompt"
                value={formData.prompt}
                onChange={handleChange}
                placeholder={'Extract the following fields from this text: {text}\nReturn JSON with: {fields}'}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fields JSON <span className="text-red-500">*</span>
              </label>
              <textarea
                name="fields"
                value={formData.fields}
                onChange={handleChange}
                onBlur={(e) =>
                  setFormData((prev) => ({ ...prev, fields: formatJson(e.target.value) }))
                }
                placeholder={`{
  "invoice_number": { "type": "string", "required": true },
  "total_amount": { "type": "float", "required": true }
}`}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.fields && (
                <p className="text-red-500 text-xs mt-1">{errors.fields}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assigned Emails (JSON array) <span className="text-red-500">*</span>
              </label>
              <textarea
                name="assigned_emails"
                value={formData.assigned_emails}
                onChange={handleChange}
                onBlur={(e) =>
                  setFormData((prev) => ({ ...prev, assigned_emails: formatJson(e.target.value) }))
                }
                placeholder='["john@example.com", "jane@example.com"]'
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.assigned_emails && (
                <p className="text-red-500 text-xs mt-1">{errors.assigned_emails}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg"
            >
              {loading ? 'Creating Job...' : 'Create Job'}
            </button>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
                {errors.submit}
              </div>
            )}
          </form>
          {credentials.length > 0 && (
            <div className="mt-8 border rounded-xl p-6 bg-slate-50">
              <h3 className="text-lg font-semibold mb-2">New Member Credentials</h3>
              <p className="text-sm text-slate-600 mb-4">
                Share these temporary passwords with the corresponding members. Encourage them to log in and change their password immediately.
              </p>
              <div className="space-y-2">
                {credentials.map((cred) => (
                  <div
                    key={cred.email}
                    className="flex flex-wrap justify-between items-center bg-white border rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{cred.email}</p>
                      <p className="text-sm text-slate-500">
                        Password: <span className="font-mono">{cred.password}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/admin/jobs')}
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                Go to Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
