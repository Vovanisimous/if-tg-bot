import { bot } from '../botInstance';
import { supabase } from '../supabaseClient';
import { BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES } from '../constants';

const PRIVACY_POLICY_URL = 'https://taplink.cc/politic_privacy_ifyouknow_bot';

// Функция для показа главного меню
async function showMainMenu(ctx: any) {
  await ctx.reply(
    `Привет, ${ctx.from?.first_name}, я бот бара If you know!
Чем могу помочь?`,
    {
      reply_markup: {
        keyboard: [[{ text: BUTTON_BOOKING }, { text: BUTTON_MENU }, { text: BUTTON_RULES }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    },
  );
}

// Функция для сохранения данных пользователя в БД
async function saveVisitorData(ctx: any) {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || null;
  const name = ctx.from?.first_name
    ? `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}`
    : null;
  const now = new Date().toISOString();

  if (telegramId) {
    await supabase.from('visitors').insert({
      id: telegramId,
      username,
      name,
      creation_date: now,
      last_visit_date: now,
    });
  }
}

bot.start(async (ctx) => {
  const telegramId = ctx.from?.id;
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
      // Пользователь уже существует - обновляем дату последнего визита
      await supabase.from('visitors').update({ last_visit_date: now }).eq('id', telegramId);
      await showMainMenu(ctx);
    } else {
      // Новый пользователь - показываем согласие с политикой
      await ctx.reply(
        `Для продолжения необходимо
Ваше согласие на обработку
персональных данных.

Ознакомиться с соглашением по
ссылке: ${PRIVACY_POLICY_URL}`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '✅ Согласен', callback_data: 'accept_privacy_policy' }]],
          },
        },
      );
    }
  }
});

// Обработчик нажатия на кнопку "Согласен"
bot.action('accept_privacy_policy', async (ctx) => {
  await ctx.answerCbQuery();

  // Сохраняем данные пользователя в БД
  await saveVisitorData(ctx);

  // Удаляем сообщение с согласием
  await ctx.deleteMessage();

  // Показываем главное меню
  await showMainMenu(ctx);
});

bot.hears(BUTTON_BOOKING, async (ctx) => {
  ctx.scene.enter('booking-wizard');
});
