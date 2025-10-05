"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOKING_SCENE_ID = void 0;
const telegraf_1 = require("telegraf");
const constants_1 = require("../constants");
const date_1 = require("../utils/date");
const validators_1 = require("../utils/validators");
const supabaseClient_1 = require("../supabaseClient");
const CANCEL_BOOKING = 'Отменить бронирование';
function isCancel(ctx) {
    return ctx.message && 'text' in ctx.message && ctx.message.text === CANCEL_BOOKING;
}
function cancelBooking(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply('Бронирование отменено.', telegraf_1.Markup.keyboard([[constants_1.BUTTON_BOOKING, constants_1.BUTTON_MENU, constants_1.BUTTON_RULES]]).resize());
        return ctx.scene.leave();
    });
}
exports.BOOKING_SCENE_ID = 'booking-wizard';
const bookingScene = new telegraf_1.Scenes.WizardScene(exports.BOOKING_SCENE_ID, 
// Step 1: Check for existing booking
(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (userId) {
        const { data } = yield supabaseClient_1.supabase
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
            yield ctx.reply(`У вас есть бронь на ${dateStr} в ${timeStr} на ${data.visitors_count} гостей`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('Отменить бронь', `cancel_booking:${data.id}`)],
            ]));
            return;
        }
    }
    const dates = (0, date_1.getNextBookingDates)();
    const inline_keyboard = [];
    for (let i = 0; i < dates.length; i += 2) {
        const row = [telegraf_1.Markup.button.callback(dates[i], `date:${dates[i]}`)];
        if (dates[i + 1])
            row.push(telegraf_1.Markup.button.callback(dates[i + 1], `date:${dates[i + 1]}`));
        inline_keyboard.push(row);
    }
    yield ctx.reply('Отлично! Выберите, пожалуйста, дату, когда вы хотите нас посетить', telegraf_1.Markup.inlineKeyboard(inline_keyboard));
    yield ctx.reply('Для отмены бронирования используйте кнопку ниже.', telegraf_1.Markup.keyboard([[CANCEL_BOOKING]])
        .resize()
        .oneTime());
    return ctx.wizard.next();
}), 
// Step 2: Date
(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (isCancel(ctx)) {
        return cancelBooking(ctx);
    }
    const callbackQuery = ctx.callbackQuery;
    if ((callbackQuery === null || callbackQuery === void 0 ? void 0 : callbackQuery.data) && callbackQuery.data.startsWith('date:')) {
        const chosenDate = callbackQuery.data.substring(5);
        ctx.wizard.state.date = chosenDate;
        const times = (0, date_1.getBookingTimes)(chosenDate);
        const inline_keyboard = [];
        for (let i = 0; i < times.length; i += 4) {
            const row = times.slice(i, i + 4).map((t) => telegraf_1.Markup.button.callback(t, `time:${t}`));
            inline_keyboard.push(row);
        }
        yield ctx.answerCbQuery();
        yield ctx.reply(`Вы выбрали дату: ${chosenDate}. Теперь выберите время:`, telegraf_1.Markup.inlineKeyboard(inline_keyboard));
        return ctx.wizard.next();
    }
    else {
        yield ctx.reply('Пожалуйста, выберите дату с помощью кнопок.');
    }
}), 
// Step 3: Time
(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (isCancel(ctx)) {
        return cancelBooking(ctx);
    }
    const callbackQuery = ctx.callbackQuery;
    if ((callbackQuery === null || callbackQuery === void 0 ? void 0 : callbackQuery.data) && callbackQuery.data.startsWith('time:')) {
        let chosenTime = callbackQuery.data.substring(5);
        if (/^\d{1,2}$/.test(chosenTime)) {
            chosenTime = chosenTime.padStart(2, '0') + ':00';
        }
        else if (/^\d{1,2}:\d{2}$/.test(chosenTime)) {
            const [h, m] = chosenTime.split(':');
            chosenTime = h.padStart(2, '0') + ':' + m.padStart(2, '0');
        }
        ctx.wizard.state.time = chosenTime;
        const chosenDate = ctx.wizard.state.date;
        const numbers = Array.from({ length: 8 }, (_, i) => (i + 1).toString());
        const inline_keyboard = [];
        for (let i = 0; i < numbers.length; i += 4) {
            const row = numbers.slice(i, i + 4).map((n) => telegraf_1.Markup.button.callback(n, `guests:${n}`));
            inline_keyboard.push(row);
        }
        yield ctx.answerCbQuery();
        yield ctx.reply(`Вы выбрали: ${chosenDate} в ${chosenTime}. Теперь выберите количество гостей (от 1 до 8):`, telegraf_1.Markup.inlineKeyboard(inline_keyboard));
        return ctx.wizard.next();
    }
    else {
        yield ctx.reply('Пожалуйста, выберите время с помощью кнопок.');
    }
}), 
// Step 4: Guests
(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (isCancel(ctx)) {
        return cancelBooking(ctx);
    }
    const callbackQuery = ctx.callbackQuery;
    if ((callbackQuery === null || callbackQuery === void 0 ? void 0 : callbackQuery.data) && callbackQuery.data.startsWith('guests:')) {
        ctx.wizard.state.guests = callbackQuery.data.substring(7);
        yield ctx.answerCbQuery();
        yield ctx.reply(`Вы выбрали: ${ctx.wizard.state.date} в ${ctx.wizard.state.time} для ${ctx.wizard.state.guests} гостей. Теперь отправьте свой номер телефона для бронирования.`, telegraf_1.Markup.keyboard([
            [telegraf_1.Markup.button.contactRequest('Отправить номер телефона')],
            [CANCEL_BOOKING],
        ])
            .resize()
            .oneTime());
        return ctx.wizard.next();
    }
    else {
        yield ctx.reply('Пожалуйста, выберите количество гостей с помощью кнопок.');
    }
}), 
// Step 5: Phone input (contact or text)
(ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (isCancel(ctx)) {
        return cancelBooking(ctx);
    }
    let phone = '';
    if (ctx.message && 'contact' in ctx.message && ctx.message.contact.phone_number) {
        phone = ctx.message.contact.phone_number;
    }
    else if (ctx.message &&
        'text' in ctx.message &&
        (0, validators_1.isValidRussianPhoneNumber)(ctx.message.text)) {
        phone = ctx.message.text;
    }
    if (phone && (0, validators_1.isValidRussianPhoneNumber)(phone)) {
        const formattedPhone = (0, validators_1.formatRussianPhoneNumber)(phone);
        ctx.wizard.state.phone = formattedPhone;
        // Save booking to DB
        const { date, time, guests } = ctx.wizard.state;
        const bookingDate = (0, date_1.combineDateAndTimeToISO)(date, time);
        if (ctx.from) {
            yield supabaseClient_1.supabase.from('bookings').insert([
                {
                    userid: ctx.from.id,
                    date: bookingDate,
                    visitors_count: Number(guests),
                    phone: formattedPhone,
                },
            ]);
        }
        yield ctx.reply(`Спасибо! Ваше место забронировано на ${date} в ${time} для ${guests} гостей. Номер телефона: ${formattedPhone}.

Наш бар спрятан по адресу: Бульвар Чавайна, 36.
Вход во двор с улицы Советская или со стороны Бульвара Чавайна. Ваш ориентир — красный козырёк Nami Izakaya.

Когда будете на месте, позвоните по номеру +79677575910, и мы встретим вас у входа.

Пожалуйста, приходите вовремя. Если вы задержитесь больше чем на двадцать минут, мы можем не успеть вас принять.
Пунктуальность — часть ритуала. Мы будем ждать.

До скорой встречи в If You Know.`, telegraf_1.Markup.keyboard([[constants_1.BUTTON_BOOKING, constants_1.BUTTON_MENU, constants_1.BUTTON_RULES]]).resize());
        return ctx.scene.leave();
    }
    else {
        yield ctx.reply('Неправильно набран номер телефона попробуйте еще раз', telegraf_1.Markup.keyboard([
            [telegraf_1.Markup.button.contactRequest('Отправить номер телефона')],
            [CANCEL_BOOKING],
        ])
            .resize()
            .oneTime());
    }
}));
// Handle cancel booking callback
bookingScene.action(/cancel_booking:(\d+)/, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const bookingId = ctx.match[1];
    yield supabaseClient_1.supabase.from('bookings').update({ status: 'canceled' }).eq('id', bookingId);
    yield ctx.editMessageReplyMarkup(undefined); // remove inline keyboard
    yield ctx.reply('Бронь отменена');
    return ctx.scene.leave();
}));
exports.default = bookingScene;
