import 'mocha';
import chai from 'chai';
import {ExpireCache, ExpireTimeoutCache} from '../dist/index.js';

const expect = chai.expect;

describe('CJS require loading', function () {
	it('should have the ExpireCache class', function () {
		expect(ExpireCache).to.be.an('function');
	});

	it('should have the ExpireTimeoutCache class', function () {
		expect(ExpireTimeoutCache).to.be.an('function');
	});
});
