"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHONE_REGEX_PATTERNS = exports.BUTTON_RULES = exports.BUTTON_MENU = exports.BUTTON_BOOKING = void 0;
exports.BUTTON_BOOKING = '📅 Бронь';
exports.BUTTON_MENU = '📋 Меню';
exports.BUTTON_RULES = '🧵 Правила';
exports.PHONE_REGEX_PATTERNS = [
    /^7\d{10}$/,
    /^8\d{10}$/,
    /^\+7\d{10}$/,
    /^\+7\s?\d{3}\s?\d{3}-?\d{2}-?\d{2}$/,
    /^\+7\s?\(\d{3}\)\s?\d{7}$/,
    /^\+7\s?\(\d{3}\)\s?\d{3}-?\d{2}-?\d{2}$/,
];
