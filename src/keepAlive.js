// Keep-alive script to prevent Render from sleeping
const https = require('https');

function keepAlive() {
  const url = 'https://if-tg-bot.onrender.com';
  
  https.get(url, (res) => {
    console.log(`Keep-alive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    console.log(`Keep-alive error: ${err.message}`);
  });
}

// Ping every 14 minutes (before 15-minute sleep)
setInterval(keepAlive, 14 * 60 * 1000);

// Initial ping
keepAlive();

console.log('Keep-alive script started');
