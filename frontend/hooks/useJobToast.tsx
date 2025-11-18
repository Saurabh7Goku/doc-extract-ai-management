// frontend/hooks/useJobToast.ts
import toast from 'react-hot-toast';
import { useTaskWebSocket } from '../app/api/websocket';
import { useEffect } from 'react';

export function useJobToast(taskId: string | null) {
    const { status, message, result, error } = useTaskWebSocket(taskId);

    useEffect(() => {
        if (!taskId) return;

        const toastId = toast.loading(message || 'Processing...', {
            id: taskId,
            style: { minWidth: '300px' },
        });

        return () => {
            toast.dismiss(toastId);
        };
    }, [taskId]);

    useEffect(() => {
        if (!taskId) return;

        if (status === 'running' && message) {
            toast.loading(message, { id: taskId });
        }

        if (status === 'finished' && result) {
            toast.success(
                <div>
                    <strong>Extraction Complete! </strong>
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(result.extracted || result, null, 2)}
                    </pre>

                    {
                        result.errors?.length > 0 && (
                            <p className="mt-2 text-xs text-orange-600">
                                Warning: {result.errors.length} validation issue(s)
                            </p>
                        )
                    }
                </div>,
                { id: taskId, duration: 8000 }
            );
        }

        if (status === 'failed') {
            toast.error(message || 'Processing failed', { id: taskId });
        }
    }, [status, message, result, error, taskId]);
}