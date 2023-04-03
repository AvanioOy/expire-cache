import {ICache} from './interfaces/ICache';

export class ExpireCache<Payload, Key = string> implements ICache<Payload, Key> {
	private cache = new Map<Key, {data: Payload; expires: number}>();
	public set(key: Key, data: Payload, expires: number) {
		this.cache.set(key, {data, expires});
	}

	public get(key: Key) {
		this.cleanExpired();
		return this.cache.get(key)?.data;
	}

	public delete(key: Key) {
		return this.cache.delete(key);
	}

	public clear() {
		this.cache.clear();
	}

	public size() {
		return this.cache.size;
	}

	private cleanExpired() {
		const now = new Date().getTime();
		for (const [key, value] of this.cache.entries()) {
			if (value.expires < now) {
				this.cache.delete(key);
			}
		}
	}
}
