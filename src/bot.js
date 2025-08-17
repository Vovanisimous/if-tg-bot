"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const botInstance_1 = require("./botInstance");
const telegraf_1 = require("telegraf");
const bookingScene_1 = __importDefault(require("./scenes/bookingScene"));
const menuScene_1 = __importDefault(require("./scenes/menuScene"));
const stage = new telegraf_1.Scenes.Stage([bookingScene_1.default, menuScene_1.default]);
botInstance_1.bot.use((0, telegraf_1.session)());
botInstance_1.bot.use(stage.middleware());
// Import command handlers AFTER middleware registration
require("./commands/start");
require("./commands/rules");
require("./commands/menu");
require("./commands/booking");
botInstance_1.bot.launch();
process.once('SIGINT', () => botInstance_1.bot.stop('SIGINT'));
process.once('SIGTERM', () => botInstance_1.bot.stop('SIGTERM'));
