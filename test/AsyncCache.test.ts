/* eslint-disable @typescript-eslint/no-explicit-any */
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {TAnyCache} from '../src/';
import {TestAsync} from './mockup/TestAsync';

chai.use(chaiAsPromised);

const expect = chai.expect;

let cache: TAnyCache<string>;

describe('TestAsync cache', () => {
	before(async () => {
		cache = new TestAsync<string>();
	});
	it('should return undefined value if not cached yet', async () => {
		await expect(cache.get('key')).to.eventually.be.undefined;
	});
	it('should return cached value', async () => {
		cache.set('key', 'value');
		await expect(cache.get('key')).to.eventually.be.equal('value');
	});
	it('should return undefined value if expired', async () => {
		cache.set('key', 'value', new Date(Date.now() + 1)); // epires in 1ms
		await new Promise((resolve) => setTimeout(resolve, 10));
		await expect(cache.get('key')).to.eventually.be.undefined;
	});
	it('should return undefined value if deleted', async () => {
		cache.set('key', 'value');
		cache.delete('key');
		await expect(cache.get('key')).to.eventually.be.undefined;
	});
	it('should return undefined value if cleared', async () => {
		cache.set('key', 'value');
		cache.clear();
		await expect(cache.get('key')).to.eventually.be.undefined;
	});
});
