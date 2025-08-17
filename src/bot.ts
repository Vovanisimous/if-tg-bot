import 'dotenv/config';
import { bot, BotContext } from './botInstance';
import { Scenes, session } from 'telegraf';
import bookingScene from './scenes/bookingScene';
import menuScene from './scenes/menuScene';
import http from 'http';

const stage = new Scenes.Stage<BotContext>([bookingScene, menuScene]);
bot.use(session());
bot.use(stage.middleware());

// Import command handlers AFTER middleware registration
import './commands/start';
import './commands/rules';
import './commands/menu';
import './commands/booking';

// Simple HTTP server for health check
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Function to start bot with retry logic
async function startBot() {
  try {
    await bot.launch();
    console.log('Bot started successfully!');
  } catch (error: any) {
    if (error.response?.error_code === 409) {
      console.log('Bot conflict detected. Waiting 5 seconds before retry...');
      setTimeout(startBot, 5000);
    } else {
      console.error('Bot startup error:', error);
      process.exit(1);
    }
  }
}

// Start the bot
startBot();

process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});
