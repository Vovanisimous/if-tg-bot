# if-tg-bot

A simple Telegram bot project using [Telegraf](https://telegraf.js.org/) and TypeScript.

## Setup

1. Copy `.env.example` to `.env` and add your Telegram bot token:
   ```sh
   cp .env.example .env
   # Edit .env and set your BOT_TOKEN
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the bot in development mode:
   ```sh
   npx ts-node src/bot.ts
   ```

## Building and Running

To build the project:

```sh
npm run build
```

To run the compiled bot:

```sh
node dist/bot.js
```
