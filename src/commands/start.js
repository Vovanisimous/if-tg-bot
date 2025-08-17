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
const botInstance_1 = require("../botInstance");
const supabaseClient_1 = require("../supabaseClient");
const constants_1 = require("../constants");
botInstance_1.bot.start((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    const username = ((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.username) || null;
    const name = ((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name)
        ? `${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}`
        : null;
    const now = new Date().toISOString();
    if (telegramId) {
        yield supabaseClient_1.supabase.from('visitors').upsert([
            {
                id: telegramId,
                username,
                name,
                creation_date: now,
                last_visit_date: now,
            },
        ], { onConflict: 'id', ignoreDuplicates: false });
        // If record exists, only last_visit_date will be updated
        yield supabaseClient_1.supabase.from('visitors').update({ last_visit_date: now }).eq('id', telegramId);
    }
    ctx.reply(`Привет, ${(_d = ctx.from) === null || _d === void 0 ? void 0 : _d.first_name}, я бот бара If you know!
    Чем могу помочь?
    `, {
        reply_markup: {
            keyboard: [[{ text: constants_1.BUTTON_BOOKING }, { text: constants_1.BUTTON_MENU }, { text: constants_1.BUTTON_RULES }]],
            resize_keyboard: true,
            one_time_keyboard: false,
        },
    });
}));
botInstance_1.bot.hears(constants_1.BUTTON_BOOKING, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.scene.enter('booking-wizard');
}));
