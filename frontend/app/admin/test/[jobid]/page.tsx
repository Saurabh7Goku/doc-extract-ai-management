'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import PDFUploader from '../../../../components/PDFUploader';
import { useTaskWebSocket } from '../../../../app/api/websocket';
import React from 'react';

export default function TestPrompt() {
    const { jobId } = useParams<{ jobId: string }>();
    const [taskId, setTaskId] = useState<string | null>(null);
    const { status, message, result, error } = useTaskWebSocket(taskId || '');

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Test Prompt – Job #{jobId}</h1>

            <PDFUploader jobId={Number(jobId)} onTaskCreated={setTaskId} />

            {taskId && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-3">Live Test Results</h2>

                    <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">Status:</span>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${status === 'finished'
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
                    {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                    {result && (
                        <div className="mt-4">
                            <h3 className="font-medium text-lg mb-2">Extracted Fields</h3>
                            <pre className="p-3 bg-white rounded border text-xs overflow-auto max-h-96">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}