import 'dotenv/config';
import { bot, BotContext } from './botInstance';
import { Scenes, session } from 'telegraf';
import bookingScene from './scenes/bookingScene';
import menuScene from './scenes/menuScene';
import express from 'express';

const stage = new Scenes.Stage<BotContext>([bookingScene, menuScene]);
bot.use(session());
bot.use(stage.middleware());

// Import command handlers AFTER middleware registration
import './commands/start';
import './commands/rules';
import './commands/menu';
import './commands/booking';

// Express app for webhook
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Bot is running!');
});

// Webhook endpoint
app.post('/webhook', (req: express.Request, res: express.Response) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

// Start server and bot
async function startBot() {
  try {
    // Start Express server
    app.listen(PORT, () => {
      console.log(`HTTP server running on port ${PORT}`);
    });

    // Set webhook for production
    if (process.env.NODE_ENV === 'production') {
      const webhookUrl = `https://if-tg-bot.onrender.com/webhook`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook set to: ${webhookUrl}`);
    } else {
      // Use polling for development
      await bot.launch();
      console.log('Bot started with polling (development mode)');
    }
    
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
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});
