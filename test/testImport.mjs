import {describe, expect, it} from 'vitest';
import {ExpireCache, ExpireTimeoutCache} from '../dist/index.mjs';

describe('MJS import loading', function () {
	it('should have the ExpireCache class', function () {
		expect(ExpireCache).to.be.an('function');
	});

	it('should have the ExpireTimeoutCache class', function () {
		expect(ExpireTimeoutCache).to.be.an('function');
	});
});
