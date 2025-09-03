import type { NextApiResponse } from 'next';

export interface RoleForbiddenMeta { allowed?: string[]; appId?: string }

export function roleForbidden(res: NextApiResponse, meta: RoleForbiddenMeta) {
  return res.status(403).json({ success: false, error: 'FORBIDDEN_ROLE', code: 'ROLE_FORBIDDEN', allowed: meta.allowed, appId: meta.appId });
}

export function methodNotAllowed(res: NextApiResponse) {
  return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED', code: 'METHOD_NOT_ALLOWED' });
}

export function badRequest(res: NextApiResponse, message: string) {
  return res.status(400).json({ success: false, error: 'BAD_REQUEST', code: 'BAD_REQUEST', message });
}

export function notFound(res: NextApiResponse, message: string) {
  return res.status(404).json({ success: false, error: 'NOT_FOUND', code: 'NOT_FOUND', message });
}

export function unauthorized(res: NextApiResponse, message = 'Unauthorized') {
  return res.status(401).json({ success: false, error: 'UNAUTHORIZED', code: 'UNAUTHORIZED', message });
}

export function internalError(res: NextApiResponse, detail?: string) {
  return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', code: 'INTERNAL_ERROR', detail });
}
