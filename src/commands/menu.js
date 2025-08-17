"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const botInstance_1 = require("../botInstance");
const constants_1 = require("../constants");
const menuScene_1 = require("../scenes/menuScene");
botInstance_1.bot.hears(constants_1.BUTTON_MENU, (ctx) => ctx.scene.enter(menuScene_1.MENU_SCENE_ID));
