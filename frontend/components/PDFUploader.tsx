// frontend/components/PDFUploader.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import React from 'react';

type Props = {
    jobId: number;
    onTaskCreated?: (taskId: string) => void;
};

export default function PDFUploader({ jobId, onTaskCreated }: Props) {
    const [status, setStatus] = useState<string>('');
    const [taskId, setTaskId] = useState<string | null>(null);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('job_id', jobId.toString());

            try {
                setStatus('Uploading...');
                const res = await axios.post('http://localhost:8000/api/v1/upload-pdf/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                const newTaskId = res.data.task_id;
                setTaskId(newTaskId);
                setStatus('Processing...');
                if (onTaskCreated) onTaskCreated(newTaskId);
            } catch (err: any) {
                setStatus(`Upload failed: ${err.response?.data?.detail || err.message}`);
            }
        },
        [jobId, onTaskCreated]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
            >
                <input {...getInputProps()} />
                <p className="text-gray-600">
                    {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF, or click to select'}
                </p>
            </div>

            {status && (
                <p className="mt-4 text-sm font-medium text-gray-700">{status}</p>
            )}

            {taskId && (
                <p className="mt-2 text-xs text-gray-500">Task ID: {taskId}</p>
            )}
        </div>
    );
}