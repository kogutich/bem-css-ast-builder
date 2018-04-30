'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const sinon = require('sinon');

global.sinon = sinon;
global.expect = chai.expect;
global.chai = chai;
global.should = chai.should();
