'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface JobFormData {
    title: string;
    description: string;
    prompt: string;
    fields: string;           // JSON string
    assigned_emails: string;  // JSON string
}

interface JobFormProps {
    initialData?: Partial<JobFormData>;
    onSuccess?: () => void;
    submitUrl: string;
    submitButtonText?: string;
}

export default function JobForm({
    initialData = {},
    onSuccess,
    submitUrl,
    submitButtonText = 'Save Job',
}: JobFormProps) {
    const [formData, setFormData] = useState<JobFormData>({
        title: initialData.title || '',
        description: initialData.description || '',
        prompt: initialData.prompt || '',
        fields: initialData.fields || '{\n  \n}',
        assigned_emails: initialData.assigned_emails || '[\n  \n]',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // Auto-format JSON on blur
    const formatJson = (value: string, field: 'fields' | 'assigned_emails') => {
        try {
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return value;
        }
    };

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

    const validateJsonField = (field: 'fields' | 'assigned_emails'): boolean => {
        try {
            JSON.parse(formData[field]);
            return true;
        } catch (err) {
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

        const fieldsValid = validateJsonField('fields');
        const emailsValid = validateJsonField('assigned_emails');
        if (!fieldsValid || !emailsValid) {
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in first.');
                setLoading(false);
                return;
            }

            await axios.post(
                submitUrl,
                {
                    title: formData.title,
                    description: formData.description,
                    prompt: formData.prompt,
                    fields: JSON.parse(formData.fields),
                    assigned_emails: JSON.parse(formData.assigned_emails),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            onSuccess?.();
        } catch (err: any) {
            const msg =
                err.response?.data?.detail ||
                err.message ||
                'Failed to save job.';
            setErrors({ submit: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            {/* Title */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                </label>
                < input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Invoice Data Extraction"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                />
                {errors.title && <p className="text-red-500 text-xs mt-1"> {errors.title} </p>}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" >
                    Description
                </label>
                < textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Optional notes..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Prompt */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" >
                    Prompt Template < span className="text-red-500" >* </span>
                </label>
                < textarea
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleChange}
                    placeholder="Extract {fields} from this text: {text}"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                    required
                />
                {errors.prompt && <p className="text-red-500 text-xs mt-1"> {errors.prompt} </p>}
            </div>

            {/* Fields JSON */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" >
                    Fields JSON < span className="text-red-500" >* </span>
                </label>
                < textarea
                    name="fields"
                    value={formData.fields}
                    onChange={handleChange}
                    onBlur={(e) => {
                        const formatted = formatJson(e.target.value, 'fields');
                        setFormData((prev) => ({ ...prev, fields: formatted }));
                    }
                    }
                    placeholder={`{
  "invoice_number": { "type": "string", "required": true },
  "total": { "type": "float", "required": true }
}`}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    required
                />
                {errors.fields && <p className="text-red-500 text-xs mt-1"> {errors.fields} </p>}
            </div>

            {/* Assigned Emails */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" >
                    Assigned Emails(JSON array) < span className="text-red-500" >* </span>
                </label>
                < textarea
                    name="assigned_emails"
                    value={formData.assigned_emails}
                    onChange={handleChange}
                    onBlur={(e) => {
                        const formatted = formatJson(e.target.value, 'assigned_emails');
                        setFormData((prev) => ({ ...prev, assigned_emails: formatted }));
                    }}
                    placeholder='["user1@example.com", "user2@example.com"]'
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                    required
                />
                {
                    errors.assigned_emails && (
                        <p className="text-red-500 text-xs mt-1"> {errors.assigned_emails} </p>
                    )
                }
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-shadow shadow-md"
            >
                {loading ? 'Saving...' : submitButtonText}
            </button>

            {
                errors.submit && (
                    <p className="text-center text-red-600 bg-red-50 p-3 rounded-lg" >
                        {errors.submit}
                    </p>
                )
            }
        </form>
    );
}