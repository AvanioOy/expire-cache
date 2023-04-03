/* eslint-disable @typescript-eslint/no-explicit-any */
import 'mocha';
import * as chai from 'chai';
import {ICache, ExpireCache} from '../src/';

const expect = chai.expect;

let cache: ICache<string>;

describe('Expire Cache', () => {
	before(async () => {
		cache = new ExpireCache<string>();
	});
	it('should return undefined value if not cached yet', async () => {
		expect(cache.get('key')).to.be.undefined;
	});
	it('should return cached value', async () => {
		cache.set('key', 'value');
		expect(cache.get('key')).to.equal('value');
	});
	it('should return undefined value if expired', async () => {
		cache.set('key', 'value', new Date(Date.now() + 1)); // epires in 1ms
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(cache.get('key')).to.be.undefined;
	});
	it('should return undefined value if deleted', async () => {
		cache.set('key', 'value');
		cache.delete('key');
		expect(cache.get('key')).to.be.undefined;
	});
	it('should return undefined value if cleared', async () => {
		cache.set('key', 'value');
		cache.clear();
		expect(cache.get('key')).to.be.undefined;
	});
});
