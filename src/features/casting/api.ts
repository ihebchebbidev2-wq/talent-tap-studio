import type { z } from 'zod';
import type { submissionSchema } from './schema';

export const backendUrl = (import.meta.env['VITE_BACKEND_URL'] as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!backendUrl) throw new ApiError(503, 'Le service sera disponible après la connexion du serveur.');
  const response = await fetch(`${backendUrl}/api${path}`, {
    ...options, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error ?? 'Le service est momentanément indisponible.');
  }
  return response.json() as Promise<T>;
}

export function submitApplication(data: z.infer<typeof submissionSchema>) {
  return api<{ reference: string }>('/applications', { method: 'POST', body: JSON.stringify(data) });
}