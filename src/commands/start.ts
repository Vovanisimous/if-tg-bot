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

  console.log('telegramId', telegramId);

  if (telegramId) {
    const { data: existingVisitor, error: fetchError } = await supabase
      .from('visitors')
      .select('id')
      .eq('id', telegramId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch visitor', fetchError);
    }

    if (existingVisitor) {
      await supabase.from('visitors').update({ last_visit_date: now }).eq('id', telegramId);
    } else {
      await supabase.from('visitors').insert({
        id: telegramId,
        username,
        name,
        creation_date: now,
        last_visit_date: now,
      });
    }
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
