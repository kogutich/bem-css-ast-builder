'use strict';

const _ = require('lodash');
const {transformVarName, getDeclDeps, getUpdatedDeclValue} = require('../utils/common');
const {walkImmediateRules, walkImmediateAtRules} = require('../utils/postcss');
const bemNaming = require('@bem/sdk.naming.entity');

/**
 * Функция для обхода селекторов :root в файле с темой для вытаскивания оттуда переменных
 * @param {Object} root Корневая нода, в которой ищем переменные
 * @param {Object} themeBemName Bemjson файла с темой (представления имени файла темы в виде БЭМ-объекта)
 * @param {Object} variables Набор переменных, вычисленных на данный момент
 * @param {String} [media] Значения @media, внутри которой объявлены переменные
 */
const walkThemeRules = ({root, themeBemName, variables, media}) => {
	walkImmediateRules(root, (rule) => {
		rule.walkDecls(({prop, value}) => {
			const customPropertyRegex = /^--.+/;
			// Признак наличия переменной с таким же модификатором у theme и таким же @media
			const variableExists = _.get(variables, `${prop}.values`, []).some((value) => {
				return value.media === media;
			});

			if (!customPropertyRegex.test(prop) || variableExists) {
				return;
			}

			const dependencies = getDeclDeps(value);

			const preparedValue = {
				value: getUpdatedDeclValue(value),
				owner: themeBemName.toJSON(),
				media
			};

			const currentResultValue = variables[prop];

			if (currentResultValue) {
				currentResultValue.values.push(preparedValue);
				currentResultValue.dependencies = _.uniq((currentResultValue.dependencies || []).concat(dependencies));
			} else {
				variables[prop] = {
					name: transformVarName(prop),
					values: [preparedValue],
					dependencies
				};
			}
		});
	}, ':root');
};

/**
 * Функция для обработки конкретного файла с темой (обрабатывает конкретный модификатор theme)
 * @param {Object} themeFile Разобрыннй файл темы
 * @param {Object} variables Набор переменных, вычисленных на данный момент
 */
const processThemeFile = (themeFile, variables) => {
	const {css: {root: themeCssRoot}, fileName: themeFilename} = themeFile;
	const themeName = themeFilename.replace(/\.post\.css$/, '');
	const themeBemName = bemNaming.parse(themeName);

	if (!themeBemName) {
		throw new Error(`Theme file "${themeFilename}" has incorrect name: not in BEM methodology`);
	}

	if (themeBemName.elem) {
		throw new Error(`Theme file "${themeFilename}" has incorrect name: Theme can't have elem`);
	}

	walkThemeRules({root: themeCssRoot, themeBemName, variables});
	walkImmediateAtRules(themeCssRoot, (mediaAtRule = {}) => {
		walkThemeRules({root: mediaAtRule, themeBemName, variables, media: mediaAtRule.params});
	}, 'media');
};

/**
 * Функция проверяет, что переменные, на которые ссылаются другие переменные, существуют
 * @param {Object} variables Набор переменных, вычисленных по css-файлам с темой
 */
const checkVariablesExistence = (variables) => {
	Object.keys(variables).forEach((varName) => {
		const {dependencies: variableDeps} = variables[varName];
		variableDeps.forEach((dep) => {
			if (!variables[dep]) {
				throw new Error(`Variable "${dep}" doesn't exist.`);
			}
		});
	});
};

/**
 * Функция обработки theme, принимает на вход файлы с темой и строит по ним объект с переменными
 * @param {Array<Object>} themeFiles Разобранные файлы с переменными theme
 * @returns {Object}
 */
const processTheme = (themeFiles) => {
	const variables = themeFiles.reduce((result, themeFile) => {
		processThemeFile(themeFile, result);
		return result;
	}, {});

	checkVariablesExistence(variables);
	return variables;
};

module.exports = processTheme;
