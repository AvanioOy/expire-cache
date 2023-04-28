/* eslint-disable @typescript-eslint/no-explicit-any */
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {IAsyncCache, TAnyCache} from '../src/';

chai.use(chaiAsPromised);

const expect = chai.expect;

let cache: TAnyCache<string>;

class TestAsync<Payload, Key = string> implements IAsyncCache<Payload, Key> {
	private cache = new Map<Key, {data: Payload; expires: number | undefined}>();
	public set(key: Key, data: Payload, expires?: Date) {
		this.cache.set(key, {data, expires: expires?.getTime()});
		return Promise.resolve();
	}

	public get(key: Key) {
		this.cleanExpired();
		return Promise.resolve(this.cache.get(key)?.data);
	}

	public delete(key: Key) {
		return Promise.resolve(this.cache.delete(key));
	}

	public clear() {
		return Promise.resolve(this.cache.clear());
	}

	public size(): Promise<number> {
		return Promise.resolve(this.cache.size);
	}

	private cleanExpired() {
		const now = new Date().getTime();
		for (const [key, value] of this.cache.entries()) {
			if (value.expires !== undefined && value.expires < now) {
				this.cache.delete(key);
			}
		}
	}
}

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
