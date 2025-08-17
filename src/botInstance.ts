import { Telegraf, Scenes } from 'telegraf';

export interface BotContext extends Scenes.WizardContext {}

export const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);
