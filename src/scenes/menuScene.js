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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MENU_SCENE_ID = void 0;
const telegraf_1 = require("telegraf");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const KITCHEN = 'Кухня';
const BAR = 'Бар';
const BACK = 'Назад';
function handleMenuSelection(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ctx.message && 'text' in ctx.message) {
            const text = ctx.message.text;
            if (text === KITCHEN) {
                const kitchenDir = path_1.default.join(__dirname, '../../assets/kitchen');
                let files = [];
                try {
                    files = fs_1.default.readdirSync(kitchenDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
                }
                catch (e) {
                    yield ctx.reply('Фотографии кухни не найдены.');
                    return;
                }
                if (files.length > 0) {
                    const loaderMsg = yield ctx.reply('Загружаю фотографии...');
                    for (const file of files) {
                        yield ctx.replyWithPhoto({ source: path_1.default.join(kitchenDir, file) });
                    }
                    try {
                        yield ctx.deleteMessage(loaderMsg.message_id);
                    }
                    catch (e) { }
                    yield ctx.reply('Фото кухни. Для возврата выберите другой раздел или нажмите "Назад".', telegraf_1.Markup.keyboard([[KITCHEN, BAR], [BACK]])
                        .resize()
                        .oneTime());
                }
                else {
                    yield ctx.reply('Фотографии кухни не найдены.', telegraf_1.Markup.keyboard([[KITCHEN, BAR], [BACK]])
                        .resize()
                        .oneTime());
                }
            }
            else if (text === BAR) {
                const barDir = path_1.default.join(__dirname, '../../assets/bar');
                let files = [];
                try {
                    files = fs_1.default.readdirSync(barDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
                }
                catch (e) {
                    yield ctx.reply('Фотографии бара не найдены.');
                    return;
                }
                if (files.length > 0) {
                    const loaderMsg = yield ctx.reply('Загружаю фотографии...');
                    for (const file of files) {
                        yield ctx.replyWithPhoto({ source: path_1.default.join(barDir, file) });
                    }
                    try {
                        yield ctx.deleteMessage(loaderMsg.message_id);
                    }
                    catch (e) { }
                    yield ctx.reply('Фото бара. Для возврата выберите другой раздел или нажмите "Назад".', telegraf_1.Markup.keyboard([[KITCHEN, BAR], [BACK]])
                        .resize()
                        .oneTime());
                }
                else {
                    yield ctx.reply('Фотографии бара не найдены.', telegraf_1.Markup.keyboard([[KITCHEN, BAR], [BACK]])
                        .resize()
                        .oneTime());
                }
            }
            else if (text === BACK) {
                // Если мы находимся на первом шаге (выбор меню) — выходим в главное меню
                if (ctx.wizard.cursor === 1) {
                    yield ctx.reply('Главное меню', telegraf_1.Markup.keyboard([[constants_1.BUTTON_BOOKING, constants_1.BUTTON_MENU, constants_1.BUTTON_RULES]]).resize());
                    return ctx.scene.leave();
                }
                else {
                    // На остальных шагах возвращаем к выбору меню
                    yield ctx.reply('Выберите раздел меню:', telegraf_1.Markup.keyboard([[KITCHEN, BAR], [BACK]])
                        .resize()
                        .oneTime());
                    return ctx.wizard.selectStep(1);
                }
            }
        }
    });
}
exports.MENU_SCENE_ID = 'menu-wizard';
const menuScene = new telegraf_1.Scenes.WizardScene(exports.MENU_SCENE_ID, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Выберите раздел меню:', telegraf_1.Markup.keyboard([[KITCHEN, BAR], [BACK]])
        .resize()
        .oneTime());
    return ctx.wizard.next();
}), handleMenuSelection, handleMenuSelection);
exports.default = menuScene;
