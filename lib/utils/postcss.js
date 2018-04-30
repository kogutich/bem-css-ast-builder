'use strict';

const postcss = require('postcss');
const postcssMixins = require('postcss-mixins');
const postcssSimpleVars = require('postcss-simple-vars');
const postcssNested = require('postcss-nested');
const postcssFunctions = require('postcss-functions');
const postcssCssnext = require('postcss-cssnext');
const postcssUrl = require('postcss-url');

/**
 * Типы узлов css-дерева
 * @type {Object}
 */
const NODE_TYPE = {
	ROOT: 'root',
	AT_RULE: 'atrule',
	RULE: 'rule',
	DECL: 'decl',
	COMMENT: 'comment'
};

/**
 * Возвращает postcss процессор с подключенными плагинами
 * @returns {Function}
 */
const getPostcssProcessor = () => (
	postcss([
		postcssMixins,
		postcssSimpleVars,
		postcssNested,
		postcssFunctions({
			functions: {
				// Функция, преобразующая пиксели в rem-единицы.
				pixrem(px) {
					return `${px / 16}rem`;
				}
			}
		}),
		postcssCssnext({
			browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1'],
			features: {
				customProperties: {
					preserve: true
				},
				autoprefixer: {
					add: false
				}
			}
		}),
		postcssUrl({
			url: ({url, absolutePath}) => {
				if (url.substring(0, 4) === 'data') {
					return;
				}

				if (url.charAt(0) === '/') {
					return url;
				}

				return absolutePath;
			}
		})
	])
);

/**
 * Функция, удаляющая все комментарии внутри узла
 * @param {Object} node Узел css-дерева
 */
const removeNodeComments = (node) => {
	node.walkComments && node.walkComments((comment) => {
		comment.remove();
	});
};

/**
 * Возвращает функцию для обхода прямых потомков
 * @param {String} nodeType тип нод, для которых осуществляется обход
 * @returns {Function}
 */
const walkImmediate = (nodeType) => {
	const typePropMap = {
		[NODE_TYPE.RULE]: 'selector',
		[NODE_TYPE.AT_RULE]: 'name',
		[NODE_TYPE.DECL]: 'prop'
	};

	return (node, callback, name) => {
		node.each && node.each((childNode) => {
			if (childNode.type === nodeType && (!name || childNode[typePropMap[nodeType]] === name)) {
				callback(childNode);
			}
		});
	};
};

/**
 * Аналог функции walkRules из postcss, но обходит не всех, а только прямых потомков
 * @type {Function}
 */
const walkImmediateRules = walkImmediate(NODE_TYPE.RULE);

/**
 * Аналог функции walkAtRules из postcss, но обходит не всех, а только прямых потомков
 * @type {Function}
 */
const walkImmediateAtRules = walkImmediate(NODE_TYPE.AT_RULE);

/**
 * Аналог функции walkDecls из postcss, но обходит не всех, а только прямых потомков
 * @type {Function}
 */
const walkImmediateDecls = walkImmediate(NODE_TYPE.DECL);

module.exports = {
	NODE_TYPE,
	getPostcssProcessor,
	removeNodeComments,
	walkImmediateRules,
	walkImmediateAtRules,
	walkImmediateDecls
};
