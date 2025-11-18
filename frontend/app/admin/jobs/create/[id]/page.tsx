'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface FormData {
    title: string;
    description: string;
    prompt: string;
    fields: string;
    assigned_emails: string;
}

export default function CreateJob() {
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        prompt: '',
        fields: '{\n  \n}',
        assigned_emails: '[\n  \n]',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const { [name]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const formatJson = (value: string) => {
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return value;
        }
    };

    const validateJson = (field: 'fields' | 'assigned_emails'): boolean => {
        try {
            JSON.parse(formData[field]);
            return true;
        } catch {
            setErrors((prev) => ({
                ...prev,
                [field]: `Invalid JSON in ${field === 'fields' ? 'Fields' : 'Emails'}`,
            }));
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        const fieldsOk = validateJson('fields');
        const emailsOk = validateJson('assigned_emails');
        if (!fieldsOk || !emailsOk) {
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Session expired. Please log in again.');
                router.push('/login');
                return;
            }

            await axios.post(
                'http://localhost:8000/api/v1/jobs/',
                {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    prompt: formData.prompt.trim(),
                    fields: JSON.parse(formData.fields),
                    assigned_emails: JSON.parse(formData.assigned_emails),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            router.push('/admin/dashboard');
        } catch (err: any) {
            const msg =
                err.response?.data?.detail ||
                err.message ||
                'Failed to create job. Please try again.';
            setErrors({ submit: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800">Create New Job</h1>
                    <p className="text-gray-600 mt-2">Define your PDF extraction task</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Title */}
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

                        {/* Description */}
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

                        {/* Prompt */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Prompt Template <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="prompt"
                                value={formData.prompt}
                                onChange={handleChange}
                                placeholder="Extract the following fields from this text: {text}\nReturn JSON with: {fields}"
                                rows={5}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Fields JSON */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Fields JSON <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="fields"
                                value={formData.fields}
                                onChange={handleChange}
                                onBlur={(e) => {
                                    const formatted = formatJson(e.target.value);
                                    setFormData((prev) => ({ ...prev, fields: formatted }));
                                }}
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

                        {/* Assigned Emails */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Assigned Emails (JSON array) <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="assigned_emails"
                                value={formData.assigned_emails}
                                onChange={handleChange}
                                onBlur={(e) => {
                                    const formatted = formatJson(e.target.value);
                                    setFormData((prev) => ({ ...prev, assigned_emails: formatted }));
                                }}
                                placeholder='["john@example.com", "jane@example.com"]'
                                rows={5}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {errors.assigned_emails && (
                                <p className="text-red-500 text-xs mt-1">{errors.assigned_emails}</p>
                            )}
                        </div>

                        {/* Submit */}
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
                </div>
            </div>
        </div>
    );
}