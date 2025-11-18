// frontend/app/api/websocket.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type TaskStatus = 'waiting' | 'running' | 'finished' | 'failed';

const buildWsUrl = (taskId: string) => {
    const baseEnv = process.env.NEXT_PUBLIC_WS_URL
        || (process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/i, 'ws')
            : 'ws://localhost:8000');
    const base = baseEnv.replace(/\/$/, '');
    return `${base}/ws/${taskId}`;
};

export function useTaskWebSocket(taskId: string | null) {

    const [status, setStatus] = useState<TaskStatus>('waiting');

    const [message, setMessage] = useState<string>('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnect = 5;
    const reconnectDelay = 2000;

    const connect = useCallback(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            setError('Authentication required');
            return;
        }

        if (!taskId) return;

        const wsUrl = buildWsUrl(taskId);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WS] Connected to:', wsUrl);
            reconnectAttempts.current = 0;
            try {
                ws.send(JSON.stringify({ type: 'auth', token }));
            } catch (err) {
                console.warn('[WS] Failed to send auth payload', err);
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.status) setStatus(data.status);
                if (data.message) setMessage(data.message);
                if (data.result) setResult(data.result);
                if (data.error) setError(data.error);
            } catch (e) {
                console.warn('[WS] Invalid JSON:', event.data);
            }
        };

        ws.onerror = () => {
            setError('WebSocket error');
        };

        ws.onclose = (ev) => {
            wsRef.current = null;
            if (reconnectAttempts.current < maxReconnect && !ev.wasClean) {
                const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);

                setTimeout(() => {
                    reconnectAttempts.current += 1;
                    connect();
                }, delay);
            } else if (status !== 'finished' && status !== 'failed') {
                setStatus('failed');
                setError('Connection lost');
            }
        };
    }, [taskId]);

    useEffect(() => {
        if (!taskId) return;
        connect();
        return () => {
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [taskId, connect]);

    return { status, message, result, error };
}