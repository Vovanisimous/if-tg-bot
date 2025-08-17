import { Middleware } from 'telegraf';

export const logger: Middleware<any> = async (ctx, next) => {
  console.log('Received update:', ctx.update);
  await next();
};
