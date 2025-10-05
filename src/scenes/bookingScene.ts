import { Scenes, Markup } from 'telegraf';
import type { BotContext } from '../botInstance';
import { BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES } from '../constants';
import { getNextBookingDates, getBookingTimes, combineDateAndTimeToISO } from '../utils/date';
import { isValidRussianPhoneNumber, formatRussianPhoneNumber } from '../utils/validators';
import { supabase } from '../supabaseClient';

const CANCEL_BOOKING = 'Отменить бронирование';

function isCancel(ctx: BotContext) {
  return ctx.message && 'text' in ctx.message && ctx.message.text === CANCEL_BOOKING;
}

async function cancelBooking(ctx: BotContext) {
  await ctx.reply(
    'Бронирование отменено.',
    Markup.keyboard([[BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES]]).resize(),
  );
  return ctx.scene.leave();
}

export const BOOKING_SCENE_ID = 'booking-wizard';

const bookingScene = new Scenes.WizardScene<BotContext>(
  BOOKING_SCENE_ID,
  // Step 1: Check for existing booking
  async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
      const { data } = await supabase
        .from('bookings')
        .select('id, date, visitors_count, status')
        .eq('userid', userId)
        .in('status', ['active', 'confirmed'])
        .order('date', { ascending: false })
        .limit(1)
        .single();
      if (data && data.date && data.visitors_count) {
        const bookingDate = new Date(data.date);
        const dateStr = bookingDate.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
        });
        const timeStr = bookingDate.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        await ctx.reply(
          `У вас есть бронь на ${dateStr} в ${timeStr} на ${data.visitors_count} гостей`,
          Markup.inlineKeyboard([
            [Markup.button.callback('Отменить бронь', `cancel_booking:${data.id}`)],
          ]),
        );
        // Добавляем кнопку для возврата в главное меню
        await ctx.reply(
          'Для создания новой брони сначала отмените текущую или вернитесь в главное меню.',
          Markup.keyboard([[BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES]]).resize(),
        );
        return ctx.scene.leave();
      }
    }
    const dates = getNextBookingDates();
    const inline_keyboard = [];
    for (let i = 0; i < dates.length; i += 2) {
      const row = [Markup.button.callback(dates[i], `date:${dates[i]}`)];
      if (dates[i + 1]) row.push(Markup.button.callback(dates[i + 1], `date:${dates[i + 1]}`));
      inline_keyboard.push(row);
    }
    await ctx.reply(
      'Отлично! Выберите, пожалуйста, дату, когда вы хотите нас посетить',
      Markup.inlineKeyboard(inline_keyboard),
    );
    await ctx.reply(
      'Для отмены бронирования используйте кнопку ниже.',
      Markup.keyboard([[CANCEL_BOOKING]])
        .resize()
        .oneTime(),
    );
    return ctx.wizard.next();
  },
  // Step 2: Date
  async (ctx) => {
    if (isCancel(ctx)) {
      return cancelBooking(ctx);
    }
    const callbackQuery = ctx.callbackQuery as { data?: string };
    if (callbackQuery?.data && callbackQuery.data.startsWith('date:')) {
      const chosenDate = callbackQuery.data.substring(5);
      (ctx.wizard.state as any).date = chosenDate;
      const times = getBookingTimes(chosenDate);
      const inline_keyboard = [];
      for (let i = 0; i < times.length; i += 4) {
        const row = times.slice(i, i + 4).map((t) => Markup.button.callback(t, `time:${t}`));
        inline_keyboard.push(row);
      }
      await ctx.answerCbQuery();
      await ctx.reply(
        `Вы выбрали дату: ${chosenDate}. Теперь выберите время:`,
        Markup.inlineKeyboard(inline_keyboard),
      );
      return ctx.wizard.next();
    } else {
      await ctx.reply('Пожалуйста, выберите дату с помощью кнопок.');
    }
  },
  // Step 3: Time
  async (ctx) => {
    if (isCancel(ctx)) {
      return cancelBooking(ctx);
    }
    const callbackQuery = ctx.callbackQuery as { data?: string };
    if (callbackQuery?.data && callbackQuery.data.startsWith('time:')) {
      let chosenTime = callbackQuery.data.substring(5);
      if (/^\d{1,2}$/.test(chosenTime)) {
        chosenTime = chosenTime.padStart(2, '0') + ':00';
      } else if (/^\d{1,2}:\d{2}$/.test(chosenTime)) {
        const [h, m] = chosenTime.split(':');
        chosenTime = h.padStart(2, '0') + ':' + m.padStart(2, '0');
      }
      (ctx.wizard.state as any).time = chosenTime;
      const chosenDate = (ctx.wizard.state as any).date;
      const numbers = Array.from({ length: 8 }, (_, i) => (i + 1).toString());
      const inline_keyboard = [];
      for (let i = 0; i < numbers.length; i += 4) {
        const row = numbers.slice(i, i + 4).map((n) => Markup.button.callback(n, `guests:${n}`));
        inline_keyboard.push(row);
      }
      await ctx.answerCbQuery();
      await ctx.reply(
        `Вы выбрали: ${chosenDate} в ${chosenTime}. Теперь выберите количество гостей (от 1 до 8):`,
        Markup.inlineKeyboard(inline_keyboard),
      );
      return ctx.wizard.next();
    } else {
      await ctx.reply('Пожалуйста, выберите время с помощью кнопок.');
    }
  },
  // Step 4: Guests
  async (ctx) => {
    if (isCancel(ctx)) {
      return cancelBooking(ctx);
    }
    const callbackQuery = ctx.callbackQuery as { data?: string };
    if (callbackQuery?.data && callbackQuery.data.startsWith('guests:')) {
      (ctx.wizard.state as any).guests = callbackQuery.data.substring(7);
      await ctx.answerCbQuery();
      await ctx.reply(
        `Вы выбрали: ${(ctx.wizard.state as any).date} в ${(ctx.wizard.state as any).time} для ${
          (ctx.wizard.state as any).guests
        } гостей. Теперь отправьте свой номер телефона для бронирования.`,
        Markup.keyboard([
          [Markup.button.contactRequest('Отправить номер телефона')],
          [CANCEL_BOOKING],
        ])
          .resize()
          .oneTime(),
      );
      return ctx.wizard.next();
    } else {
      await ctx.reply('Пожалуйста, выберите количество гостей с помощью кнопок.');
    }
  },
  // Step 5: Phone input (contact or text)
  async (ctx) => {
    if (isCancel(ctx)) {
      return cancelBooking(ctx);
    }
    let phone = '';
    if (ctx.message && 'contact' in ctx.message && ctx.message.contact.phone_number) {
      phone = ctx.message.contact.phone_number;
    } else if (
      ctx.message &&
      'text' in ctx.message &&
      isValidRussianPhoneNumber(ctx.message.text)
    ) {
      phone = ctx.message.text;
    }
    if (phone && isValidRussianPhoneNumber(phone)) {
      const formattedPhone = formatRussianPhoneNumber(phone);
      (ctx.wizard.state as any).phone = formattedPhone;
      // Save booking to DB
      const { date, time, guests } = ctx.wizard.state as any;
      const bookingDate = combineDateAndTimeToISO(date, time);
      if (ctx.from) {
        await supabase.from('bookings').insert([
          {
            userid: ctx.from.id,
            date: bookingDate,
            visitors_count: Number(guests),
            phone: formattedPhone,
          },
        ]);
      }
      await ctx.reply(
        `Спасибо! Ваше место забронировано на ${date} в ${time} для ${guests} гостей. Номер телефона: ${formattedPhone}.

Наш бар спрятан по адресу: Бульвар Чавайна, 36.
Вход во двор с улицы Советская или со стороны Бульвара Чавайна. Ваш ориентир — красный козырёк Nami Izakaya.

Когда будете на месте, позвоните по номеру +79677575910, и мы встретим вас у входа.

Пожалуйста, приходите вовремя. Если вы задержитесь больше чем на двадцать минут, мы можем не успеть вас принять.
Пунктуальность — часть ритуала. Мы будем ждать.

До скорой встречи в If You Know.`,
        Markup.keyboard([[BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES]]).resize(),
      );
      return ctx.scene.leave();
    } else {
      await ctx.reply(
        'Неправильно набран номер телефона попробуйте еще раз',
        Markup.keyboard([
          [Markup.button.contactRequest('Отправить номер телефона')],
          [CANCEL_BOOKING],
        ])
          .resize()
          .oneTime(),
      );
    }
  },
);

// Handle cancel booking callback
bookingScene.action(/cancel_booking:(\d+)/, async (ctx) => {
  const bookingId = ctx.match[1];
  await supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId);
  await ctx.editMessageReplyMarkup(undefined); // remove inline keyboard
  await ctx.reply('Бронь отменена');
  await ctx.reply(
    'Теперь вы можете создать новую бронь или выбрать другие опции.',
    Markup.keyboard([[BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES]]).resize(),
  );
  return ctx.scene.leave();
});

export default bookingScene;
