/* eslint-disable @typescript-eslint/no-explicit-any */
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {ICacheOrAsync} from '../src/';
import {iterAsArray} from './lib/iter';
import {TestAsync} from './mockup/TestAsync';

chai.use(chaiAsPromised);

const expect = chai.expect;
let cache: ICacheOrAsync<string>;

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
		expect(Array.from(await iterAsArray(cache.entries()))).to.be.eql([['key', 'value']]);
		expect(Array.from(await iterAsArray(cache.keys()))).to.be.eql(['key']);
		expect(Array.from(await iterAsArray(cache.values()))).to.be.eql(['value']);
	});
	it('should check that key exists', async () => {
		await expect(cache.has('key')).to.eventually.be.equal(true);
	});
	it('should check cache size', async () => {
		await expect(cache.size()).to.eventually.be.equal(1);
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
