import { bot } from '../botInstance';
import { supabase } from '../supabaseClient';
import { BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES } from '../constants';

bot.start(async (ctx) => {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || null;
  const name = ctx.from?.first_name
    ? `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}`
    : null;
  const now = new Date().toISOString();

  if (telegramId) {
    await supabase.from('visitors').upsert(
      [
        {
          id: telegramId,
          username,
          name,
          creation_date: now,
          last_visit_date: now,
        },
      ],
      { onConflict: 'id', ignoreDuplicates: false },
    );
    // If record exists, only last_visit_date will be updated
    await supabase.from('visitors').update({ last_visit_date: now }).eq('id', telegramId);
  }

  ctx.reply(
    `Привет, ${ctx.from?.first_name}, я бот бара If you know!
    Чем могу помочь?
    `,
    {
      reply_markup: {
        keyboard: [[{ text: BUTTON_BOOKING }, { text: BUTTON_MENU }, { text: BUTTON_RULES }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    },
  );
});

bot.hears(BUTTON_BOOKING, async (ctx) => {
  ctx.scene.enter('booking-wizard');
});
