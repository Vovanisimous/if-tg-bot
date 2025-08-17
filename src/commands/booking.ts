import { bot } from "../botInstance";
import { BUTTON_BOOKING } from "../constants";
import { BOOKING_SCENE_ID } from "../scenes/bookingScene";

bot.hears(BUTTON_BOOKING, (ctx) => ctx.scene.enter(BOOKING_SCENE_ID));
