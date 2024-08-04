require('mocha');
const {ExpireCache, ExpireTimeoutCache} = require('../dist/index.cjs');

async function getChaiExpect() {
	return (await import('chai')).expect;
}

let expect;

describe('CJS require loading', function () {
	before(async function () {
		expect = await getChaiExpect();
	});
	it('should have the ExpireCache class', function () {
		expect(ExpireCache).to.be.an('function');
	});

	it('should have the ExpireTimeoutCache class', function () {
		expect(ExpireTimeoutCache).to.be.an('function');
	});
});
