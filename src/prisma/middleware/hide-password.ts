import { PrismaClient } from '@prisma/client';

// prisma/middleware/hide-password.ts
export function hidePasswordMiddleware(): Parameters<PrismaClient['$use']>[0] {
  return async (params: any, next: any) => {
    console.log('[Prisma Middleware] called', params.model, params.action);

    const result = await next(params);

    // only act on the User model (change 'User' if model name مختلف)
    if (params.model !== 'User') return result;

    // actions to strip password for
    const shouldStrip =
      typeof params.action === 'string' &&
      (params.action.startsWith('find') ||
       params.action === 'create' ||
       params.action === 'update' ||
       params.action === 'upsert' ||
       params.action === 'delete');

    if (!shouldStrip) return result;

    // recursive strip function
    const stripPasswords = (obj: any): any => {
      if (obj == null) return obj;
      if (Array.isArray(obj)) return obj.map(stripPasswords);
      if (typeof obj === 'object') {
        const { password, ...rest } = obj;
        // recursively process nested keys (relations)
        for (const k of Object.keys(rest)) {
          rest[k] = stripPasswords(rest[k]);
        }
        return rest;
      }
      return obj;
    };

    return stripPasswords(result);
  };
}
