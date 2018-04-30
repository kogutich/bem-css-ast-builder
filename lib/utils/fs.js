'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Обёртка над fs.readDir
 * @param {String} dirPath Путь к директории
 * @returns {Promise}
 */
const readDir = (dirPath) => new Promise((resolve, reject) => {
	fs.readdir(dirPath, (err, files) => {
		if (err) {
			return reject(new Error(err.message));
		}

		resolve(files.map((filePath) => path.join(dirPath, filePath)));
	});
});

/**
 * Обёртка над fs.readFile
 * @param {String} path Путь к файлу
 * @returns {Promise}
 */
const readFile = (path) => new Promise((resolve, reject) => {
	fs.readFile(path, (err, data) => {
		if (err) {
			return reject(new Error(err.message));
		}

		resolve(data);
	});
});

/**
 * Рекурсивный readFile
 * @param {String} dirPath Директория, из которой читаем файлы
 * @param {RegExp} filenameRegex Регулярка, какие имена файлов допускаются
 * @returns {Promise.<Array>}
 */
const readAllFiles = (dirPath, filenameRegex) => {
	let result = [];

	return readDir(dirPath).then((files) => Promise.all(
		files.map((file) => new Promise((resolve, reject) => {
			fs.stat(file, (err, stat) => {
				if (err) {
					return reject(err);
				}

				if (stat.isDirectory()) {
					return resolve(readAllFiles(file, filenameRegex).then((files) => {
						result = [...result, ...files];
					}));
				}

				if (!filenameRegex || filenameRegex.test(path.basename(file))) {
					return resolve(readFile(file).then((data) => {
						result = [...result, {file: data, path: file}];
					}));
				}

				resolve();
			});
		}))
	)).then(() => result);
};

module.exports = {
	readDir,
	readFile,
	readAllFiles
};
