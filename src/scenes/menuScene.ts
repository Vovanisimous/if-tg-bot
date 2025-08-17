import { Scenes, Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';
import type { BotContext } from '../botInstance';
import { BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES } from '../constants';

const KITCHEN = 'Кухня';
const BAR = 'Бар';
const BACK = 'Назад';

async function handleMenuSelection(ctx: BotContext) {
  if (ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text;
    if (text === KITCHEN) {
      const kitchenDir = path.join(__dirname, '../../assets/kitchen');
      let files: string[] = [];
      try {
        files = fs.readdirSync(kitchenDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
      } catch (e) {
        await ctx.reply('Фотографии кухни не найдены.');
        return;
      }
      if (files.length > 0) {
        const loaderMsg = await ctx.reply('Загружаю фотографии...');
        for (const file of files) {
          await ctx.replyWithPhoto({ source: path.join(kitchenDir, file) });
        }
        try {
          await ctx.deleteMessage(loaderMsg.message_id);
        } catch (e) {}
        await ctx.reply(
          'Фото кухни. Для возврата выберите другой раздел или нажмите "Назад".',
          Markup.keyboard([[KITCHEN, BAR], [BACK]])
            .resize()
            .oneTime(),
        );
      } else {
        await ctx.reply(
          'Фотографии кухни не найдены.',
          Markup.keyboard([[KITCHEN, BAR], [BACK]])
            .resize()
            .oneTime(),
        );
      }
    } else if (text === BAR) {
      const barDir = path.join(__dirname, '../../assets/bar');
      let files: string[] = [];
      try {
        files = fs.readdirSync(barDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
      } catch (e) {
        await ctx.reply('Фотографии бара не найдены.');
        return;
      }
      if (files.length > 0) {
        const loaderMsg = await ctx.reply('Загружаю фотографии...');
        for (const file of files) {
          await ctx.replyWithPhoto({ source: path.join(barDir, file) });
        }
        try {
          await ctx.deleteMessage(loaderMsg.message_id);
        } catch (e) {}
        await ctx.reply(
          'Фото бара. Для возврата выберите другой раздел или нажмите "Назад".',
          Markup.keyboard([[KITCHEN, BAR], [BACK]])
            .resize()
            .oneTime(),
        );
      } else {
        await ctx.reply(
          'Фотографии бара не найдены.',
          Markup.keyboard([[KITCHEN, BAR], [BACK]])
            .resize()
            .oneTime(),
        );
      }
    } else if (text === BACK) {
      // Если мы находимся на первом шаге (выбор меню) — выходим в главное меню
      if (ctx.wizard.cursor === 1) {
        await ctx.reply(
          'Главное меню',
          Markup.keyboard([[BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES]]).resize(),
        );
        return ctx.scene.leave();
      } else {
        // На остальных шагах возвращаем к выбору меню
        await ctx.reply(
          'Выберите раздел меню:',
          Markup.keyboard([[KITCHEN, BAR], [BACK]])
            .resize()
            .oneTime(),
        );
        return ctx.wizard.selectStep(1);
      }
    }
  }
}

export const MENU_SCENE_ID = 'menu-wizard';

const menuScene = new Scenes.WizardScene<BotContext>(
  MENU_SCENE_ID,
  async (ctx) => {
    await ctx.reply(
      'Выберите раздел меню:',
      Markup.keyboard([[KITCHEN, BAR], [BACK]])
        .resize()
        .oneTime(),
    );
    return ctx.wizard.next();
  },
  handleMenuSelection,
  handleMenuSelection,
);

export default menuScene;
