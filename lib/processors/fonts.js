'use strict';

const {getDeclsObject} = require('../utils/common');

/**
 * Функция, которая обрабатывает root и вытаскивает из него шрифты
 * @param {Object} root Главная нода css-дерева
 * @returns {Array<Object>} Шрифты
 */
const processFonts = (root) => {
	const fonts = [];

	root.walkAtRules('font-face', (node) => {
		const font = getDeclsObject(node);
		fonts.push(font);
	});

	return fonts;
};

module.exports = processFonts;
