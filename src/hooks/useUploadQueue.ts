'use client';

import { useReducer, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';

export interface UploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    result?: { key: string; url: string; thumbnailUrl: string };
}

type Action =
    | { type: 'ADD_FILES'; files: File[] }
    | { type: 'START_NEXT' }
    | { type: 'PROGRESS'; id: string; progress: number }
    | { type: 'SUCCESS'; id: string; result: UploadItem['result'] }
    | { type: 'ERROR'; id: string; error: string }
    | { type: 'REMOVE'; id: string }
    | { type: 'CLEAR_COMPLETED' };

function reducer(state: UploadItem[], action: Action): UploadItem[] {
    switch (action.type) {
        case 'ADD_FILES':
            return [
                ...state,
                ...action.files.map(file => ({
                    id: uuid(),
                    file,
                    status: 'pending' as const,
                    progress: 0,
                })),
            ];
        case 'START_NEXT': {
            const idx = state.findIndex(i => i.status === 'pending');
            if (idx === -1) return state;
            return state.map((item, i) =>
                i === idx ? { ...item, status: 'uploading' as const, progress: 0 } : item
            );
        }
        case 'PROGRESS':
            return state.map(item =>
                item.id === action.id ? { ...item, progress: action.progress } : item
            );
        case 'SUCCESS':
            return state.map(item =>
                item.id === action.id
                    ? { ...item, status: 'success' as const, progress: 100, result: action.result }
                    : item
            );
        case 'ERROR':
            return state.map(item =>
                item.id === action.id
                    ? { ...item, status: 'error' as const, error: action.error }
                    : item
            );
        case 'REMOVE':
            return state.filter(item => item.id !== action.id);
        case 'CLEAR_COMPLETED':
            return state.filter(item => item.status !== 'success');
        default:
            return state;
    }
}

export function useUploadQueue() {
    const [items, dispatch] = useReducer(reducer, []);
    const uploadingRef = useRef(false);

    const processNext = useCallback(() => {
        const pending = items.find(i => i.status === 'pending');
        const uploading = items.find(i => i.status === 'uploading');
        if (!pending || uploading || uploadingRef.current) return;

        uploadingRef.current = true;
        dispatch({ type: 'START_NEXT' });

        const item = pending;
        const formData = new FormData();
        formData.append('file', item.file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable) {
                dispatch({
                    type: 'PROGRESS',
                    id: item.id,
                    progress: Math.round((e.loaded / e.total) * 100),
                });
            }
        });

        xhr.onload = () => {
            uploadingRef.current = false;
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const res = JSON.parse(xhr.responseText);
                    dispatch({
                        type: 'SUCCESS',
                        id: item.id,
                        result: { key: res.key, url: res.url, thumbnailUrl: res.thumbnailUrl },
                    });
                } catch {
                    dispatch({ type: 'ERROR', id: item.id, error: 'Invalid response' });
                }
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    dispatch({ type: 'ERROR', id: item.id, error: err.error || 'Upload failed' });
                } catch {
                    dispatch({ type: 'ERROR', id: item.id, error: `HTTP ${xhr.status}` });
                }
            }
        };

        xhr.onerror = () => {
            uploadingRef.current = false;
            dispatch({ type: 'ERROR', id: item.id, error: 'Network error' });
        };

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
    }, [items]);

    const addFiles = useCallback(
        (files: File[]) => {
            dispatch({ type: 'ADD_FILES', files });
        },
        []
    );

    const removeFile = useCallback((id: string) => {
        dispatch({ type: 'REMOVE', id });
    }, []);

    const clearCompleted = useCallback(() => {
        dispatch({ type: 'CLEAR_COMPLETED' });
    }, []);

    const isUploading = items.some(i => i.status === 'uploading');

    return { items, addFiles, removeFile, clearCompleted, processNext, isUploading };
}
