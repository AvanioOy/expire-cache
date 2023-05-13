import {IAsyncCache} from '../../src';

export class TestAsync<Payload, Key = string> implements IAsyncCache<Payload, Key> {
	private cache = new Map<Key, {data: Payload; expires: number | undefined}>();
	public set(key: Key, data: Payload, expires?: Date) {
		this.cache.set(key, {data, expires: expires?.getTime()});
		return Promise.resolve();
	}

	public get(key: Key) {
		this.cleanExpired();
		return Promise.resolve(this.cache.get(key)?.data);
	}

	public has(key: Key): Promise<boolean> {
		this.cleanExpired();
		return Promise.resolve(this.cache.has(key));
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
