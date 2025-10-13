import { Scenes, Markup } from 'telegraf';
import type { BotContext } from '../botInstance';
import { BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES } from '../constants';
import { getNextBookingDates, getBookingTimes, combineDateAndTimeToISO } from '../utils/date';
import {
  isValidRussianPhoneNumber,
  formatRussianPhoneNumber,
  isValidRussianHumanName,
} from '../utils/validators';
import { supabase } from '../supabaseClient';

const CANCEL_BOOKING = 'Отменить бронирование';

const MAX_GUESTS = 8;

type BookingWizardState = {
  date?: string;
  time?: string;
  guests?: string;
  phone?: string;
  real_name?: string;
};

type ActiveBookingRecord = {
  id: number;
  date: string;
  visitors_count: number;
};

const createMainMenuKeyboard = () =>
  Markup.keyboard([[BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES]]).resize();

const createCancelKeyboard = () =>
  Markup.keyboard([[CANCEL_BOOKING]])
    .resize()
    .oneTime();

const createPhoneRequestKeyboard = () =>
  Markup.keyboard([[Markup.button.contactRequest('Отправить номер телефона')], [CANCEL_BOOKING]])
    .resize()
    .oneTime();

function getWizardState(ctx: BotContext): BookingWizardState {
  return ctx.wizard.state as BookingWizardState;
}

function formatBookingDateTime(isoDate: string) {
  const bookingDate = new Date(isoDate);
  return {
    date: bookingDate.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    }),
    time: bookingDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function buildInlineButtons(
  values: string[],
  prefix: string,
): ReturnType<typeof Markup.button.callback>[] {
  return values.map((value) => Markup.button.callback(value, `${prefix}:${value}`));
}

async function fetchLatestActiveBooking(userId: number): Promise<ActiveBookingRecord | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, date, visitors_count')
    .eq('userid', userId)
    .in('status', ['active', 'confirmed'])
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch latest active booking', { userId, error });
    return null;
  }

  return data ?? null;
}

async function safeAnswerCbQuery(ctx: BotContext, text?: string) {
  try {
    // Answer callback queries, but ignore cases where the query is too old/invalid
    await ctx.answerCbQuery(text);
  } catch (error: any) {
    if (
      error?.response?.error_code === 400 &&
      typeof error?.response?.description === 'string' &&
      error.response.description.includes('query is too old')
    ) {
      return; // ignore expired callback query errors
    }
    // Re-throw other errors so they are not silenced accidentally
    throw error;
  }
}

function isCancel(ctx: BotContext) {
  return ctx.message && 'text' in ctx.message && ctx.message.text === CANCEL_BOOKING;
}

async function cancelBooking(ctx: BotContext) {
  await ctx.reply('Бронирование отменено.', createMainMenuKeyboard());
  return ctx.scene.leave();
}

export const BOOKING_SCENE_ID = 'booking-wizard';

const bookingScene = new Scenes.WizardScene<BotContext>(
  BOOKING_SCENE_ID,
  // Step 1: Check for existing booking
  async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
      const existingBooking = await fetchLatestActiveBooking(userId);
      if (existingBooking?.date && existingBooking.visitors_count) {
        const { date, time } = formatBookingDateTime(existingBooking.date);
        await ctx.reply(
          `У вас есть бронь на ${date} в ${time} на ${existingBooking.visitors_count} гостей`,
          Markup.inlineKeyboard([
            [Markup.button.callback('Отменить бронь', `cancel_booking:${existingBooking.id}`)],
          ]),
        );
        await ctx.reply(
          'Для создания новой брони сначала отмените текущую или вернитесь в главное меню.',
          createMainMenuKeyboard(),
        );
        return;
      }
    }
    const dates = getNextBookingDates();
    const dateButtons = buildInlineButtons(dates, 'date');
    await ctx.reply(
      'Отлично! Выберите, пожалуйста, дату, когда вы хотите нас посетить',
      Markup.inlineKeyboard(dateButtons, { columns: 2 }),
    );
    await ctx.reply('Для отмены бронирования используйте кнопку ниже.', createCancelKeyboard());
    return ctx.wizard.next();
  },
  // Step 2: Date
  async (ctx) => {
    if (isCancel(ctx)) {
      return cancelBooking(ctx);
    }
    const callbackQuery = ctx.callbackQuery as { data?: string } | undefined;
    if (callbackQuery?.data && callbackQuery.data.startsWith('date:')) {
      const chosenDate = callbackQuery.data.substring(5);
      const wizardState = getWizardState(ctx);
      wizardState.date = chosenDate;
      const times = getBookingTimes(chosenDate);
      await safeAnswerCbQuery(ctx);
      const timeButtons = buildInlineButtons(times, 'time');
      await ctx.reply(
        `Вы выбрали дату: ${chosenDate}. Теперь выберите время:`,
        Markup.inlineKeyboard(timeButtons, { columns: 4 }),
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
    const callbackQuery = ctx.callbackQuery as { data?: string } | undefined;
    if (callbackQuery?.data && callbackQuery.data.startsWith('time:')) {
      let chosenTime = callbackQuery.data.substring(5);
      if (/^\d{1,2}$/.test(chosenTime)) {
        chosenTime = chosenTime.padStart(2, '0') + ':00';
      } else if (/^\d{1,2}:\d{2}$/.test(chosenTime)) {
        const [h, m] = chosenTime.split(':');
        chosenTime = h.padStart(2, '0') + ':' + m.padStart(2, '0');
      }
      const wizardState = getWizardState(ctx);
      wizardState.time = chosenTime;
      const chosenDate = wizardState.date;
      const guests = Array.from({ length: MAX_GUESTS }, (_, i) => (i + 1).toString());
      await safeAnswerCbQuery(ctx);
      const guestsButtons = buildInlineButtons(guests, 'guests');
      await ctx.reply(
        `Вы выбрали: ${chosenDate} в ${chosenTime}. Теперь выберите количество гостей (от 1 до ${MAX_GUESTS}):`,
        Markup.inlineKeyboard(guestsButtons, { columns: 4 }),
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
    const callbackQuery = ctx.callbackQuery as { data?: string } | undefined;
    if (callbackQuery?.data && callbackQuery.data.startsWith('guests:')) {
      const wizardState = getWizardState(ctx);
      wizardState.guests = callbackQuery.data.substring(7);
      await safeAnswerCbQuery(ctx);
      await ctx.reply(
        `Вы выбрали: ${wizardState.date} в ${wizardState.time} для ${wizardState.guests} гостей. Теперь отправьте свой номер телефона для бронирования.`,
        createPhoneRequestKeyboard(),
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
      const wizardState = getWizardState(ctx);
      wizardState.phone = formattedPhone;
      await ctx.reply(
        'Как к вам обращаться? Введите ваше имя кириллицей (2–40 символов).',
        createCancelKeyboard(),
      );
      return ctx.wizard.next();
    } else {
      await ctx.reply(
        'Неправильно набран номер телефона попробуйте еще раз',
        createPhoneRequestKeyboard(),
      );
    }
  },
  // Step 6: Ask for real name and finalize
  async (ctx) => {
    if (isCancel(ctx)) {
      return cancelBooking(ctx);
    }
    if (ctx.message && 'text' in ctx.message) {
      const enteredName = ctx.message.text.trim();
      if (!isValidRussianHumanName(enteredName)) {
        await ctx.reply(
          'Пожалуйста, введите корректное имя кириллицей (2–40 символов).',
          createCancelKeyboard(),
        );
        return; // stay on the same step
      }
      const wizardState = getWizardState(ctx);
      wizardState.real_name = enteredName;
      // Persist real_name to visitors
      if (ctx.from?.id) {
        const { error: visitorUpdateError } = await supabase
          .from('visitors')
          .update({ real_name: enteredName })
          .eq('id', ctx.from.id);
        if (visitorUpdateError) {
          console.error('Failed to update visitor name', {
            visitorId: ctx.from.id,
            visitorUpdateError,
          });
        }
      }
      // Save booking to DB
      const { date, time, guests, phone } = wizardState;
      if (!date || !time || !guests || !phone) {
        console.error('Wizard state is incomplete on booking finalize', {
          userId: ctx.from?.id,
          wizardState,
        });
        await ctx.reply(
          'Не удалось сохранить бронь из-за неполных данных. Пожалуйста, попробуйте начать заново.',
          createMainMenuKeyboard(),
        );
        return ctx.scene.leave();
      }
      const bookingDate = combineDateAndTimeToISO(date, time);
      if (ctx.from) {
        const { error: bookingInsertError } = await supabase.from('bookings').insert([
          {
            userid: ctx.from.id,
            date: bookingDate,
            visitors_count: Number(guests),
            phone,
          },
        ]);
        if (bookingInsertError) {
          console.error('Failed to create booking', {
            userid: ctx.from.id,
            bookingInsertError,
          });
          await ctx.reply(
            'Не удалось сохранить бронь. Пожалуйста, попробуйте позже.',
            createMainMenuKeyboard(),
          );
          return ctx.scene.leave();
        }
      }
      const nameSuffix = enteredName ? `, ${enteredName}` : '';
      await ctx.reply(
        `Спасибо${nameSuffix}! Ваше место забронировано на ${date} в ${time} для ${guests} гостей. Номер телефона: ${phone}.

Наш бар спрятан по адресу: Бульвар Чавайна, 36.
Вход во двор с улицы Советская или со стороны Бульвара Чавайна. Ваш ориентир — красный козырёк Nami Izakaya.

Когда будете на месте, позвоните по номеру +79677575910, и мы встретим вас у входа.

Пожалуйста, приходите вовремя. Если вы задержитесь больше чем на двадцать минут, мы можем не успеть вас принять.
Пунктуальность — часть ритуала. Мы будем ждать.

До скорой встречи в If You Know.`,
        createMainMenuKeyboard(),
      );
      return ctx.scene.leave();
    } else {
      await ctx.reply('Пожалуйста, отправьте текстовое имя кириллицей.', createCancelKeyboard());
    }
  },
);

// Handle cancel booking callback
bookingScene.action(/cancel_booking:(\d+)/, async (ctx) => {
  await safeAnswerCbQuery(ctx);
  const bookingIdParam = ctx.match[1];
  const bookingId = Number(bookingIdParam);
  try {
    await supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId);
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply('Бронь отменена');
    await ctx.reply(
      'Теперь вы можете создать новую бронь или выбрать другие опции.',
      createMainMenuKeyboard(),
    );
  } catch (error) {
    console.error('Failed to cancel booking', { bookingId, error });
    await ctx.reply('Не удалось отменить бронь. Пожалуйста, попробуйте позже.');
  }
  return ctx.scene.leave();
});

export default bookingScene;
