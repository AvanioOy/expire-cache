require('mocha');
const chai = require('chai');

const expect = chai.expect;

const {ExpireCache, ExpireTimeoutCache} = require('../dist/index.cjs');

describe('ESM import loading', function () {
	it('should have the ExpireCache class', function () {
		expect(ExpireCache).to.be.an('function');
	});

	it('should have the ExpireTimeoutCache class', function () {
		expect(ExpireTimeoutCache).to.be.an('function');
	});
});
