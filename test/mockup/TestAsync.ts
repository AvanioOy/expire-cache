import {type IAsyncCache} from '@luolapeikko/cache-types';
import {type IAsyncCacheOnClearCallback} from '../../src/index.js';

type CacheType<Payload> = {data: Payload; expires: number | undefined};

function makeAsyncIterable<T>(iterable: IterableIterator<T>): AsyncIterableIterator<T> {
	const asyncIterator = {
		[Symbol.asyncIterator]() {
			return {
				next() {
					return Promise.resolve(iterable.next());
				},
				return() {
					if (typeof iterable.return === 'function') {
						return Promise.resolve(iterable.return());
					}
					return Promise.resolve({done: true, value: undefined});
				},
				throw(error: unknown) {
					if (typeof iterable.throw === 'function') {
						return Promise.resolve(iterable.throw(error));
					}
					return Promise.reject(error as Error);
				},
			};
		},
	};

	return asyncIterator as AsyncIterableIterator<T>;
}

export class TestAsync<Payload, Key = string> implements IAsyncCache<Payload, Key> {
	private cache = new Map<Key, CacheType<Payload>>();
	private handleOnClear = new Set<IAsyncCacheOnClearCallback<Payload, Key>>();

	public set(key: Key, data: Payload, expires?: Date) {
		this.cache.set(key, {data, expires: expires?.getTime()});
		return Promise.resolve();
	}

	public async get(key: Key) {
		await this.cleanExpired();
		return this.cache.get(key)?.data;
	}

	public async has(key: Key): Promise<boolean> {
		await this.cleanExpired();
		return this.cache.has(key);
	}

	public async expires(key: Key): Promise<Date | undefined> {
		await this.cleanExpired();
		const entry = this.cache.get(key);
		return Promise.resolve(entry?.expires ? new Date(entry.expires) : undefined);
	}

	public async delete(key: Key) {
		const entry = this.cache.get(key);
		if (entry) {
			await this.notifyOnClear(new Map<Key, Payload>([[key, entry.data]]));
		}
		return this.cache.delete(key);
	}

	public async clear() {
		await this.notifyOnClear(this.cacheAsKeyPayloadMap());
		return this.cache.clear();
	}

	public size(): Promise<number> {
		return Promise.resolve(this.cache.size);
	}

	public onClear(callback: (entries: Map<Key, Payload>) => Promise<void>): void {
		this.handleOnClear.add(callback);
	}

	public entries(): AsyncIterableIterator<[Key, Payload]> {
		return makeAsyncIterable(this.cacheAsKeyPayloadMap().entries());
	}

	public keys(): AsyncIterableIterator<Key> {
		return makeAsyncIterable(this.cacheAsKeyPayloadMap().keys());
	}

	public values(): AsyncIterableIterator<Payload> {
		return makeAsyncIterable(this.cacheAsKeyPayloadMap().values());
	}

	private async cleanExpired(): Promise<void> {
		const now = new Date().getTime();
		const deleteEntries = new Map<Key, Payload>();
		for (const [key, value] of this.cache.entries()) {
			if (value.expires !== undefined && value.expires < now) {
				deleteEntries.set(key, value.data);
				this.cache.delete(key);
			}
		}
		if (deleteEntries.size > 0) {
			await this.notifyOnClear(deleteEntries);
		}
	}

	private notifyOnClear(entries: Map<Key, Payload>) {
		return Promise.all(Array.from(this.handleOnClear).map((callback) => callback(entries)));
	}

	private cacheAsKeyPayloadMap(): Map<Key, Payload> {
		const map = new Map<Key, Payload>();
		for (const [key, value] of this.cache.entries()) {
			map.set(key, value.data);
		}
		return map;
	}
}
