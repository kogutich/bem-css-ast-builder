'use strict';

const _ = require('lodash');
const {walkImmediateDecls} = require('./postcss');
const varRegex = /var\((--.+?)\)/g;

/**
 * Преобразовывает имя custom property
 * Ex.: "--color-alert" -> "theme.color.alert"
 * @param {String} prop Имя переменной
 * @returns {String}
 */
const transformVarName = (prop) => `theme.${_.trim(prop, '-').replace(/-/g, '.')}`;

/**
 * Достаёт зависимости из объявления css-свойства
 * Ex.: "calc(var(--x) + var(--y))" зависит от ['--x', '--y']
 * @param {String} decl значение css-свойства
 * @returns {?Array<String>}
 */
const getDeclDeps = (decl) => {
	const deps = [];
	let matched = varRegex.exec(decl);

	while (matched) {
		deps.push(matched[1]);
		matched = varRegex.exec(decl);
	}

	return deps;
};

/**
 * Обрабатывает значение свойства
 * @param {String} decl Свойство
 * @returns {String|Object}
 */
const getUpdatedDeclValue = (decl) => {
	// Если в значении не используются custom properties ничего не делаем
	if (!varRegex.test(decl)) {
		return decl;
	}

	const updatedValueBody = decl.replace(varRegex, (match, prop) => {
		return `$\{${transformVarName(prop)}}`;
	});

	// eslint-disable-next-line no-new-func
	const updatedValue = new Function('{theme}', `return \`${updatedValueBody}\``);
	const updatedValueStringified = `({theme}) => \`${updatedValueBody}\``;

	return {
		updated: updatedValue,
		updatedStringified: updatedValueStringified,
		original: decl
	};
};

/**
 * Возвращает объект с css свойствами
 * @param {Object} node Узел css дерева
 * @returns {Object}
 */
const getDeclsObject = (node) => {
	const decls = {};

	walkImmediateDecls(node, ({prop, value}) => {
		decls[prop] = getUpdatedDeclValue(value);
	});

	return decls;
};

module.exports = {
	transformVarName,
	getDeclDeps,
	getUpdatedDeclValue,
	getDeclsObject
};
