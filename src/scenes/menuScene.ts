import { Scenes, Markup } from 'telegraf';
import fs from 'fs';
import path from 'path';
import type { BotContext } from '../botInstance';
import { BUTTON_BOOKING, BUTTON_MENU, BUTTON_RULES } from '../constants';

const KITCHEN = 'Кухня';
const BAR = 'Бар';
const BACK = 'Назад';
const BAR_SPECIAL = 'Special';
const BAR_MAIN = 'Основное';
const BAR_CLASSIC = 'Классика';

async function sendImages(
  ctx: BotContext,
  directory: string,
  notFoundText: string,
  doneText: string,
  keyboardButtons?: string[][],
) {
  let files: string[] = [];
  try {
    files = fs.readdirSync(directory).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
  } catch {
    await ctx.reply(notFoundText);
    return;
  }

  if (files.length === 0) {
    await ctx.reply(notFoundText);
    return;
  }

  const loaderMsg = await ctx.reply('Загружаю фотографии...');
  for (const file of files) {
    const filePath = path.join(directory, file);
    try {
      // Use path string so Telegram preserves filename and image type
      await ctx.replyWithPhoto({ source: filePath });
    } catch (err) {
      try {
        // Fallback as document with explicit filename
        await ctx.replyWithDocument({
          source: fs.createReadStream(filePath),
          filename: path.basename(filePath),
        });
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  try {
    await ctx.deleteMessage(loaderMsg.message_id);
  } catch {}

  await ctx.reply(
    doneText,
    Markup.keyboard(keyboardButtons ?? [[KITCHEN, BAR], [BACK]])
      .resize()
      .oneTime(),
  );
}

async function handleMenuSelection(ctx: BotContext) {
  if (ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text;
    if (text === KITCHEN) {
      const kitchenDir = path.join(__dirname, '../../assets/kitchen');
      await sendImages(
        ctx,
        kitchenDir,
        'Фотографии кухни не найдены.',
        'Фото кухни. Для возврата выберите другой раздел или нажмите "Назад".',
      );
    } else if (text === BAR) {
      await ctx.reply(
        'Выберите раздел бара:',
        Markup.keyboard([[BAR_SPECIAL, BAR_MAIN, BAR_CLASSIC], [BACK]])
          .resize()
          .oneTime(),
      );
      return;
    } else if (text === BAR_SPECIAL) {
      const dir = path.join(__dirname, '../../assets/bar/special');
      await sendImages(
        ctx,
        dir,
        'Фотографии раздела Special не найдены.',
        'Special. Для возврата выберите другой раздел или нажмите "Назад".',
        [[BAR_SPECIAL, BAR_MAIN, BAR_CLASSIC], [BACK]],
      );
    } else if (text === BAR_MAIN) {
      const dir = path.join(__dirname, '../../assets/bar/main');
      await sendImages(
        ctx,
        dir,
        'Фотографии раздела Основное не найдены.',
        'Основное. Для возврата выберите другой раздел или нажмите "Назад".',
        [[BAR_SPECIAL, BAR_MAIN, BAR_CLASSIC], [BACK]],
      );
    } else if (text === BAR_CLASSIC) {
      const dir = path.join(__dirname, '../../assets/bar/classic');
      await sendImages(
        ctx,
        dir,
        'Фотографии раздела Классика не найдены.',
        'Классика. Для возврата выберите другой раздел или нажмите "Назад".',
        [[BAR_SPECIAL, BAR_MAIN, BAR_CLASSIC], [BACK]],
      );
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
