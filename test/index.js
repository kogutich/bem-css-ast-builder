'use strict';

const buildAst = require('../lib');
const path = require('path');
const _ = require('lodash');

describe('bem-css-ast-builder tests', () => {
	describe('Test suite 1', () => {
		it('Successful result', (done) => {
			const expected = require('./stubs/suite1/expected');
			const buildAstPromise = buildAst(path.resolve(__dirname, 'stubs', 'suite1', 'common.blocks'));

			// Перед сравнением объектов делаем их копии и меняем функции внутри на _.noop
			const customizer = (value) => {
				if (_.isFunction(value)) {
					return _.noop;
				}
			};

			buildAstPromise.then((result) => {
				const resultCopy = _.cloneDeepWith(result, customizer);
				const expectedCopy = _.cloneDeepWith(expected, customizer);
				resultCopy.should.deep.equal(expectedCopy);
				done();
			}).catch((err) => {
				done(err);
			});
		});

		it('Correct styles function generated', (done) => {
			const buildAstPromise = buildAst(path.resolve(__dirname, 'stubs', 'suite1', 'common.blocks'));

			buildAstPromise.then((result) => {
				const func = result.components.block1.styles.margin.updated;

				func.should.be.a('function');
				func.should.throw();
				func({theme: {x: '10px'}}).should.equal('10px');
				done();
			}).catch((err) => {
				done(err);
			});
		});
	});

	describe('Test suite 2', () => {
		it('Successful result', () => {
			const expected = require('./stubs/suite2/expected');
			const buildAstPromise = buildAst(path.resolve(__dirname, 'stubs', 'suite2', 'common.blocks'));

			return buildAstPromise.should.eventually.deep.equal(expected);
		});
	});

	describe('Test suite 3', () => {
		it('Should throw: incorrect theme filename', () => {
			const buildAstPromise = buildAst(path.resolve(__dirname, 'stubs', 'suite3', 'common.blocks'));

			return buildAstPromise.should.be.rejectedWith(
				'Theme file "theme_d_d_qwq.post.css" has incorrect name: not in BEM methodology'
			);
		});
	});

	describe('Test suite 4', () => {
		it('Should throw: theme can\'t have child', () => {
			const buildAstPromise = buildAst(path.resolve(__dirname, 'stubs', 'suite4', 'common.blocks'));

			return buildAstPromise.should.be.rejectedWith(
				'Theme file "theme__child.post.css" has incorrect name: Theme can\'t have elem'
			);
		});
	});

	describe('Test suite 5', () => {
		it('Should throw: incorrect selector', () => {
			const buildAstPromise = buildAst(path.resolve(__dirname, 'stubs', 'suite5', 'common.blocks'));

			return buildAstPromise.should.be.rejectedWith('Selector ".block#id" incorrect');
		});
	});

	describe('Test suite 6', () => {
		it('Should throw: variable dependencies fail', () => {
			const buildAstPromise = buildAst(path.resolve(__dirname, 'stubs', 'suite6', 'common.blocks'));

			return buildAstPromise.should.be.rejectedWith('Variable "--c" doesn\'t exist');
		});
	});
});
