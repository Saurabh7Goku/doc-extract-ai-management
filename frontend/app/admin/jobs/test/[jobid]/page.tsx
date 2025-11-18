'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import PDFUploader from '../../../../../components/PDFUploader';
import { useTaskWebSocket } from '../../../../../app/api/websocket';

export default function TestJob() {
    const { jobId } = useParams<{ jobId: string }>();
    const [taskId, setTaskId] = useState<string | null>(null);

    const { status, message, result, error } = useTaskWebSocket(taskId || '');

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2">Test Job #{jobId}</h1>
            <p className="text-gray-600 mb-8">
                Upload a PDF to test your prompt and see live extraction.
            </p>

            <div className="bg-white p-6 rounded-xl shadow-md border">
                <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
                <PDFUploader jobId={Number(jobId)} onTaskCreated={setTaskId} />
            </div>

            {taskId && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow-md border">
                    <h2 className="text-xl font-semibold mb-4">Live Results</h2>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3 mb-4">
                        <span className="font-medium">Status:</span>
                        <span
                            className={`px-4 py-1.5 rounded-full text-sm font-medium ${status === 'finished'
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

                    {/* Progress Message */}
                    {message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mb-4">
                            {message}
                        </p>
                    )}

                    {/* Connection Error */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">
                            Connection error: {error}
                        </p>
                    )}

                    {/* Final Result */}
                    {result && status === 'finished' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium text-lg mb-2">Extracted Data</h3>
                                <pre className="p-4 bg-gray-50 rounded border text-xs overflow-auto max-h-96 font-mono">
                                    {JSON.stringify(result.extracted, null, 2)}
                                </pre>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="p-4 bg-red-50 rounded border border-red-200">
                                    <p className="font-medium text-red-800 mb-2">
                                        Validation Errors ({result.errors.length})
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                        {result.errors.map((err: string, i: number) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}