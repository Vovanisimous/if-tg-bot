import { bot } from '../botInstance';
import { BUTTON_MENU } from '../constants';
import { MENU_SCENE_ID } from '../scenes/menuScene';

bot.hears(BUTTON_MENU, (ctx) => ctx.scene.enter(MENU_SCENE_ID));
