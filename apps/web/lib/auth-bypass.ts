export const isDevAuthBypassEnabled =
  process.env.NODE_ENV === 'development' && process.env.AUTH_SKIP_LOGIN === 'true';

export const devUserEmail = 'dev@openrush.local';
export const devUserName = 'Local Dev User';
