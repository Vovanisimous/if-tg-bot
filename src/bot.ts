import 'dotenv/config';
import { bot, BotContext } from './botInstance';
import { Scenes, session } from 'telegraf';
import bookingScene from './scenes/bookingScene';
import menuScene from './scenes/menuScene';

const stage = new Scenes.Stage<BotContext>([bookingScene, menuScene]);
bot.use(session());
bot.use(stage.middleware());

// Import command handlers AFTER middleware registration
import './commands/start';
import './commands/rules';
import './commands/menu';
import './commands/booking';

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
