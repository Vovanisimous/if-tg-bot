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
const constants_1 = require("../constants");
botInstance_1.bot.hears(constants_1.BUTTON_RULES, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.reply(`📜 ПРАВИЛА БАРА:\n\nB IF YOU KNOW каждый гость очень важен и получает особое внимание, поэтому мы работаем исключительно по предварительной записи. Минимальное окно между записью и встречей в баре — 10 минут.\nФормат нашего заведения предполагает наличие комнаты для курения. Курение вне этой комнаты не разрешается.\nМы за культуру пития и гастрономию, поэтому у наших бартендеров есть полномочия остановить поток коктейлей к вашему столику.\n"Speak-Easy" в дословном переводе означает "ГовориТише" . Именно такую атмосферу мы стараемся поддерживать в нашем баре, просим вас уважать это стремление.\nЛюди до 18 лет не допускаются в бар. Даже в сопровождении взрослого.\nМы оставляем за собой право отказать в обслуживании и попросить вас покинуть помещение бара.`);
}));
