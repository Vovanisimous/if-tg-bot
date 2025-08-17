"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botInstance_1 = require("../botInstance");
const constants_1 = require("../constants");
const bookingScene_1 = require("../scenes/bookingScene");
botInstance_1.bot.hears(constants_1.BUTTON_BOOKING, (ctx) => ctx.scene.enter(bookingScene_1.BOOKING_SCENE_ID));
