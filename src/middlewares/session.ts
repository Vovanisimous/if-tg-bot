import { Middleware } from 'telegraf';

export const session: Middleware<any> = async (ctx, next) => {
  // Session logic will go here
  await next();
};
