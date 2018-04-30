'use strict';

const _ = require('lodash');
const path = require('path');
const {root: Root} = require('postcss');
const {readAllFiles} = require('./utils/fs');
const {getPostcssProcessor, removeNodeComments} = require('./utils/postcss');
const {processFonts, processTheme, processComponents} = require('./processors');

/**
 * Обрабатывает css и строит по нему объект с переменными, шрифтами и компонентами
 * @param {String} guidelinesPath Путь до YG
 * @returns {Promise}
 */
const transform = (guidelinesPath) => {
	return readAllFiles(guidelinesPath, /\.post\.css$/)
		.then((files) => {
			const processor = getPostcssProcessor();

			// Прогоняем все *.post.css файлы через postcss-процессор (получаем обычные css-ки)
			return Promise.all(files.map(({file, path: filePath}) => (
				processor.process(file, {from: filePath})
					.then((css) => ({
						css,
						fileName: path.basename(filePath)
					}))
			)));
		})
		.then((cssFiles) => {
			// Делим css-файлы на 2 группы: задающие theme и остальные
			// Дело в том, что css с theme содержит в себе переменные под селектором :root
			// и выводы о принадлежности к theme и о модификаторах в данном случае делаем по названию файла,
			// например theme_color_default.post.css, для других файлов определяем по css-селекторам (в БЭМ нотации)
			// и не отталкиваемся от названия файла
			const [themeFiles, otherFiles] = _.partition(cssFiles, ({fileName}) => {
				const themeFilenameRegex = /^theme(_.+)?\.post\.css$/;
				return themeFilenameRegex.test(fileName);
			});

			const variables = processTheme(themeFiles);

			// Объединяем все файлы, получаем один root
			const cssRoot = otherFiles.reduce((result, {css: {root}}) => {
				result.append(root);
				return result;
			}, new Root());

			// Удаляем комментарии
			removeNodeComments(cssRoot);
			const fonts = processFonts(cssRoot);
			const components = processComponents(cssRoot);

			return {
				variables,
				fonts,
				components
			};
		});
};

module.exports = transform;

// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
transform(path.resolve(__dirname, '../common.blocks')).then((result) => {
	const fs = require('fs-extra');
	fs.outputFile('../example.json', JSON.stringify(result, null, '\t'));
});
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
