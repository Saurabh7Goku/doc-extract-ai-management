'use client';

import { useTaskWebSocket } from '../app/api/websocket';
import { useEffect, useState } from 'react';

interface StatusNotifierProps {
    taskId: string | null;
    onComplete?: (result: any) => void;
}

export default function StatusNotifier({ taskId, onComplete }: StatusNotifierProps) {
    const { status, message, result, error } = useTaskWebSocket(taskId || '');
    const [show, setShow] = useState(false);

    // Auto-show when task starts
    useEffect(() => {
        if (taskId) setShow(true);
    }, [taskId]);

    // Call onComplete when finished
    useEffect(() => {
        if (status === 'finished' && result) {
            onComplete?.(result);
        }
    }, [status, result, onComplete]);

    if (!show || !taskId) return null;

    return (
        <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-xl shadow-2xl border border-gray-200 p-5 z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                    {status === 'waiting' && (
                        <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></div>
                    )}
                    {status === 'running' && (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                    )}
                    {status === 'finished' && (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {status === 'failed' && (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 capitalize">{status}</p>
                    {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
                    {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

                    {/* Result Preview */}
                    {status === 'finished' && result && (
                        <details className="mt-3 text-xs">
                            <summary className="cursor-pointer text-blue-600 hover:underline">
                                View Result
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded border text-xs overflow-auto max-h-40 font-mono">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setShow(false)}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}