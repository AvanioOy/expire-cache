import {type ILoggerLike, LogLevel, type LogMapping, MapLogger} from '@avanio/logger-like';
import {type ICache} from '@luolapeikko/cache-types';
import {type ICacheOnClearCallback} from './interfaces/ICache.js';

/**
 * The default log mapping for the ExpireCache class.
 * This maps each method to a log level, allowing you to control the logging output.
 * By default, all logs are disabled (None level)
 * @example
 * const cache = new ExpireCache<string>(console, {
 *   get: LogLevel.Info,
 *   set: LogLevel.Debug,
 *   delete: LogLevel.Warn,
 * });
 */
const defaultLogMap = {
	cleanExpired: LogLevel.None,
	clear: LogLevel.None,
	constructor: LogLevel.None,
	delete: LogLevel.None,
	expires: LogLevel.None,
	get: LogLevel.None,
	has: LogLevel.None,
	onExpire: LogLevel.None,
	set: LogLevel.None,
	size: LogLevel.None,
} as const;

export type ExpireCacheLogMapType = LogMapping<keyof typeof defaultLogMap>;

/**
 * ExpireCache class that implements the ICache interface with value expiration and expires on read operations
 * @template Payload - The type of the cached data
 * @template Key - (optional) The type of the cache key (default is string)
 */
export class ExpireCache<Payload, Key = string> extends MapLogger<ExpireCacheLogMapType> implements ICache<Payload, Key> {
	private cache = new Map<Key, Payload>();
	private cacheTtl = new Map<Key, number | undefined>();
	private handleOnClear = new Set<ICacheOnClearCallback<Payload, Key>>();
	private defaultExpireMs: undefined | number;

	/**
	 * Creates a new instance of the ExpireCache class
	 * @param logger - The logger to use (optional)
	 * @param logMapping - The log mapping to use (optional). Default is all logging disabled
	 * @param defaultExpireMs - The default expiration time in milliseconds (optional)
	 */
	constructor(logger?: ILoggerLike, logMapping?: Partial<ExpireCacheLogMapType>, defaultExpireMs?: number) {
		super(logger, Object.assign({}, defaultLogMap, logMapping));
		this.logKey('constructor', `ExpireCache created, defaultExpireMs: ${String(defaultExpireMs)}`);
		this.defaultExpireMs = defaultExpireMs;
	}

	public set(key: Key, data: Payload, expires?: Date) {
		const expireTs: number | undefined = expires?.getTime() ?? (this.defaultExpireMs && Date.now() + this.defaultExpireMs);
		this.logKey('set', `ExpireCache set key: ${String(key)}, expireTs: ${String(expireTs)}`);
		this.cache.set(key, data);
		this.cacheTtl.set(key, expireTs);
	}

	public get(key: Key) {
		this.logKey('get', `ExpireCache get key: ${String(key)}`);
		this.cleanExpired();
		return this.cache.get(key);
	}

	public has(key: Key) {
		this.logKey('has', `ExpireCache has key: ${String(key)}`);
		this.cleanExpired();
		return this.cache.has(key);
	}

	public expires(key: Key): Date | undefined {
		this.logKey('expires', `ExpireCache get expire for key: ${String(key)}`);
		const expires = this.cacheTtl.get(key);
		this.cleanExpired();
		return expires ? new Date(expires) : undefined;
	}

	public delete(key: Key) {
		this.logKey('delete', `ExpireCache delete key: ${String(key)}`);
		const entry = this.cache.get(key);
		if (entry) {
			this.notifyOnClear(new Map<Key, Payload>([[key, entry]]));
		}
		this.cacheTtl.delete(key);
		return this.cache.delete(key);
	}

	public clear() {
		this.logKey('clear', `ExpireCache clear`);
		this.notifyOnClear(new Map<Key, Payload>(this.cache));
		this.cache.clear();
		this.cacheTtl.clear();
	}

	public size() {
		this.logKey('size', `ExpireCache size: ${this.cache.size.toString()}`);
		return this.cache.size;
	}

	public onClear(callback: ICacheOnClearCallback<Payload, Key>): void {
		this.logKey('onExpire', `ExpireCache onExpire`);
		this.handleOnClear.add(callback);
	}

	public entries(): IterableIterator<[Key, Payload]> {
		this.cleanExpired();
		return new Map(this.cache).entries();
	}

	public keys(): IterableIterator<Key> {
		this.cleanExpired();
		return new Map(this.cache).keys();
	}

	public values(): IterableIterator<Payload> {
		this.cleanExpired();
		return new Map(this.cache).values();
	}

	/**
	 * Sets the default expiration time in milliseconds
	 * @param expireMs - The default expiration time in milliseconds
	 */
	public setExpireMs(expireMs: number | undefined) {
		this.defaultExpireMs = expireMs;
	}

	/**
	 * Cleans expired cache entries
	 */
	private cleanExpired() {
		const now = new Date().getTime();
		const deleteEntries = new Map<Key, Payload>();
		for (const [key, expire] of this.cacheTtl.entries()) {
			if (expire !== undefined && expire < now) {
				const value = this.cache.get(key);
				if (value) {
					deleteEntries.set(key, value);
					this.cache.delete(key);
				}
				this.cacheTtl.delete(key);
			}
		}
		if (deleteEntries.size > 0) {
			this.notifyOnClear(deleteEntries);
			this.logKey('cleanExpired', `ExpireCache expired count: ${deleteEntries.size.toString()}`);
		}
	}

	private notifyOnClear(entries: Map<Key, Payload>) {
		this.handleOnClear.forEach((callback) => callback(entries));
	}

	/* 	private cacheAsKeyPayloadMap(): Map<Key, Payload> {
		const map = new Map<Key, Payload>();
		for (const [key, value] of this.cache.entries()) {
			map.set(key, value.data);
		}
		return map;
	} */
}
