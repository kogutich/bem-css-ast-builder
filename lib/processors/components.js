'use strict';

const _ = require('lodash');
const bemNaming = require('@bem/sdk.naming.entity');
const {CssSelectorParser} = require('css-selector-parser');
const {walkImmediateRules, walkImmediateAtRules} = require('../utils/postcss');
const {getDeclsObject} = require('../utils/common');
const selectorParser = new CssSelectorParser();
selectorParser.registerNestingOperators('>', '+', '~');
selectorParser.registerAttrEqualityMods('^', '$', '*', '~');

/**
 * Проверка селектора на корректность
 * Проверяем что используются только className и tagName, причем tagName не могут идти в самом начале,
 * пример некорректного: "div .a", также className всегда один, например не может быть ".a.b"
 * Допускаются псевдоселекторы после className: ".a:after", ".a:hover" и тд
 * Не пропускаются без className, например: ":not(.a)"
 * @param {String} selector Строковое представление проверяемого селектора
 * @param {Object} parsed Разобранный селектор
 * @param {Boolean} [notFirstCall] Необязательный параметр, используется для внутреннего рекурсивного вызова
 */
const checkSelectorCorrectness = (selector, parsed, notFirstCall) => {
	if (!parsed || !(parsed.rule || parsed.selectors)) {
		return;
	}

	// Селекторы могут представляться в виде массива, если они идут через ","
	// Пример: ".a, .b {<styles>}"
	const parsedSelectors = parsed.selectors ? parsed.selectors : [parsed];

	parsedSelectors.forEach((parsedSelector) => {
		const {rule: {classNames, tagName, id, attrs}} = parsedSelector;

		const classAndTagError = (classNames && tagName) || (!classNames && !tagName);
		const classError = classNames && classNames.length > 1;

		if (classAndTagError || classError || id || attrs || (!notFirstCall && tagName)) {
			throw new Error(`Selector "${selector}" incorrect`);
		}

		checkSelectorCorrectness(selector, parsedSelector.rule, true);
	});
};

/**
 * Сериализует псевдоклассы
 * @param {String} selector Строковое представление селектора, которому приналлежат псевдоклассы
 * @param {Array<Object>} [pseudosArr] Разобранные псевдоклассы
 * @returns {?String}
 */
const serializePseudos = (selector, pseudosArr) => {
	if (!pseudosArr) {
		return null;
	}

	const pseudos = pseudosArr.filter(({name}) => name);

	return pseudos.reduce((result, {name, valueType, value}) => {
		if (valueType === 'string') {
			return `${result}:${name}(${value})`;
		}

		if (!valueType) {
			return `${result}:${name}`;
		}

		throw new Error(`Selector "${selector}" incorrect: pseudos error`);
	}, '');
};

/**
 * Возвращает bemjson по названию, пример:
 * вход: 'a__b', выход: { block: 'a', elem: 'b' }
 *
 * @param {String} [className] название css класса, по которому получаем bemjson
 * @param {String} [tagName] Название тэга, соответствующего селектору, если он есть - className пуст и получим {}
 * @param {String} selector css селектор, в котором находятся tagName и className
 * @returns {Object}
 */
const getBemjsonByClassName = (className, tagName, selector) => {
	const bemName = bemNaming.parse(className);

	if (!bemName && !tagName) {
		throw new Error(`Css selector "${selector}" not in BEM methodology`);
	}

	return bemName || {};
};

/**
 * Вычисляет компонент со стилями, модификаторами, детьми и тд, и записывает его в dest
 * @param {Object} rule Разобранное правило (узел css дерева)
 * @param {String} selector Селектор, которому соответствует узел root
 * @param {Object} parsedSelector Разобранный селектор
 * @param {Object} dest Место, куда пишем компонент. Изначально объект {block: 'blockName'},
 * далее расширяется и дописывается
 * @param {String} [media] Значения @media, внутри которой объявлен компонент
 */
const calcComponent = (rule, selector, parsedSelector, dest, media) => {
	const tagName = parsedSelector.tagName;
	const className = parsedSelector.rule.classNames && parsedSelector.rule.classNames[0];
	const pseudos = parsedSelector.rule.pseudos;
	const serializedPseudos = serializePseudos(selector, pseudos);
	const {elem, mod} = getBemjsonByClassName(className, tagName, selector);

	let target = dest;

	if (elem) {
		target = _.get(dest, `elems[${elem}]`);

		if (!target) {
			_.set(dest, `elems[${elem}]`, {});
			target = dest.elems[elem];
		}
	}

	if (mod) {
		const {name: modName, val: modVal} = mod;
		const targetMods = _.get(target, `mods[${modName}]`);
		const currentTargetMod = {
			'mod-val': modVal
		};

		if (targetMods) {
			const wantedTargetMod = targetMods.find((item) => {
				return item['mod-val'] === modVal;
			});

			if (wantedTargetMod) {
				target = wantedTargetMod;
			} else {
				targetMods.push(currentTargetMod);
				target = currentTargetMod;
			}
		} else {
			_.set(target, `mods[${modName}]`, [currentTargetMod]);
			target = currentTargetMod;
		}
	}

	if (serializedPseudos) {
		const componentPseudo = _.get(target, `pseudos[${serializedPseudos}]`);

		if (!componentPseudo) {
			_.set(target, `pseudos[${serializedPseudos}]`, {});
		}

		target = target.pseudos[serializedPseudos];
	}

	if (media) {
		if (!_.get(target, `media[${media}]`)) {
			_.set(target, `media[${media}]`, {});
		}

		target = target.media[media];
	}

	// Есть вложенные селекторы (Пр.: ".a + .b", ".a .b", ...)
	if (parsedSelector.rule.rule) {
		const nestingOperator = parsedSelector.rule.rule.nestingOperator || 'default';

		if (!_.get(target, `children.nestingOperator[${nestingOperator}]`)) {
			_.set(target, `children.nestingOperator[${nestingOperator}]`, []);
		}

		const targetChildren = _.get(target, `children.nestingOperator[${nestingOperator}]`);
		const childTag = parsedSelector.rule.rule.tagName;
		const childClassName = _.get(parsedSelector, 'rule.rule.classNames[0]');
		const {block} = getBemjsonByClassName(childClassName, childTag, selector);
		const childTarget = childTag
			? {tagName: childTag}
			: {block};

		const wantedChild = targetChildren.find((child) => {
			return childTag ? child.tagName === childTag
				: child.block === block;
		});

		if (wantedChild) {
			target = wantedChild;
		} else {
			targetChildren.push(childTarget);
			target = childTarget;
		}

		calcComponent(rule, selector, parsedSelector.rule, target);
		return;
	}

	// Пишем стили после того как определились куда
	target.styles = target.styles
		? Object.assign({}, target.styles, getDeclsObject(rule))
		: getDeclsObject(rule);
};

/**
 * Функция для обхода узлов с компонентами
 * @param {Object} root Корень css-дерева
 * @param {Object} components Результирующий объект с компонентами, он наполняется по мере обхода всех узлов
 * @param {String} [media] Значение @media для которой производим обход
 */
const walkComponentRules = ({root, components, media}) => {
	walkImmediateRules(root, (rule) => {
		// Если у узла нет стилей игнорируем его
		// Это вынужденная мера из-за того, что при наличии комментариев (даже после их удаления)
		// postcss создает объект для правила и если допустим оставить комментарий в начале модификатора
		// например: ".block {&_view /*comment*/ {&_default {<styles>}}}" он посчитает что есть .block_view
		if (!rule.nodes.length) {
			return;
		}

		const selector = rule.selector;
		const parsed = selectorParser.parse(selector);

		checkSelectorCorrectness(selector, parsed);

		const parsedSelectors = parsed.selectors ? parsed.selectors : [parsed];
		parsedSelectors.forEach((parsedSelector) => {
			const className = parsedSelector.rule.classNames[0];
			const bemName = bemNaming.parse(className);

			if (!bemName) {
				throw new Error(`Css selector "${selector}" not in BEM methodology`);
			}

			const {block} = bemName;

			if (!components[block]) {
				components[block] = {block};
			}

			calcComponent(rule, selector, parsedSelector, components[block], media);
		});
	});
};

/**
 * Функция, которая обрабатывает root и вытаскивает из него бэм блоки (компоненты)
 * @param {Object} root Главная нода css-дерева
 * @returns {Object}
 */
const processComponents = (root) => {
	const components = {};

	walkImmediateAtRules(root, (mediaAtRule = {}) => {
		walkComponentRules({root: mediaAtRule, components, media: mediaAtRule.params});
	}, 'media');
	walkComponentRules({root, components});

	return components;
};

module.exports = processComponents;
