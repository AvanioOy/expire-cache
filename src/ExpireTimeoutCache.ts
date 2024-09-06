import {type ILoggerLike, LogLevel, MapLogger} from '@avanio/logger-like';
import {type ExpireCacheLogMapType} from './ExpireCache.js';
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

/**
 * ExpireCache class that implements the ICache interface with value expiration and expires with setTimeout
 * @template Payload - The type of the cached data
 * @template Key - (optional) The type of the cache key (default is string)
 */
export class ExpireTimeoutCache<Payload, Key = string> extends MapLogger<ExpireCacheLogMapType> implements ICache<Payload, Key> {
	private cache = new Map<Key, Payload>();
	private cacheTimeout = new Map<Key, {timeout: ReturnType<typeof setTimeout> | undefined; expires: Date | undefined}>();
	private handleOnClear = new Set<ICacheOnClearCallback<Payload, Key>>();
	private defaultExpireMs: undefined | number;
	/**
	 * Creates a new instance of the ExpireTimeoutCache class
	 * @param logger - The logger to use (optional)
	 * @param logMapping - The log mapping to use (optional). Default is all logging disabled
	 * @param defaultExpireMs - The default expiration time in milliseconds (optional)
	 */
	constructor(logger?: ILoggerLike, logMapping?: Partial<ExpireCacheLogMapType>, defaultExpireMs?: number) {
		super(logger, Object.assign({}, defaultLogMap, logMapping));
		this.logKey('constructor', `ExpireTimeoutCache created, defaultExpireMs: ${String(defaultExpireMs)}`);
		this.defaultExpireMs = defaultExpireMs;
	}

	public set(key: Key, data: Payload, expires?: Date) {
		this.clearTimeout(key);
		const expiresDate = this.getExpireDate(expires);
		const expireTs = expiresDate && expiresDate.getTime() - Date.now();
		const expireString = expireTs ? `${expireTs.toString()} ms` : 'undefined';
		this.logKey('set', `ExpireTimeoutCache set key: ${String(key)}, expireTs: ${expireString}`);
		const timeout = expireTs ? setTimeout(() => this.delete(key), expireTs) : undefined;
		this.cache.set(key, data);
		this.cacheTimeout.set(key, {timeout, expires: expiresDate});
	}

	public get(key: Key) {
		this.logKey('get', `ExpireTimeoutCache get key: ${String(key)}`);
		return this.cache.get(key);
	}

	public has(key: Key) {
		this.logKey('has', `ExpireTimeoutCache has key: ${String(key)}`);
		return this.cache.has(key);
	}

	public expires(key: Key): Date | undefined {
		this.logKey('expires', `ExpireTimeoutCache get expire for key: ${String(key)}`);
		return this.cacheTimeout.get(key)?.expires;
	}

	public delete(key: Key) {
		this.logKey('delete', `ExpireTimeoutCache delete key: ${String(key)}`);
		this.clearTimeout(key);
		const entry = this.cache.get(key);
		if (entry) {
			this.notifyOnClear(new Map<Key, Payload>([[key, entry]]));
		}
		return this.cache.delete(key);
	}

	public clear() {
		this.logKey('clear', `ExpireTimeoutCache clear`);
		this.cacheTimeout.forEach((_value, key) => this.clearTimeout(key));
		this.notifyOnClear(new Map<Key, Payload>(this.cache));
		this.cache.clear();
		this.cacheTimeout.clear();
	}

	public size() {
		this.logKey('size', `ExpireTimeoutCache size: ${this.cache.size.toString()}`);
		return this.cache.size;
	}

	public onClear(callback: ICacheOnClearCallback<Payload, Key>): void {
		this.logKey('onExpire', `ExpireCache onExpire`);
		this.handleOnClear.add(callback);
	}

	public entries(): IterableIterator<[Key, Payload]> {
		return new Map(this.cache).entries();
	}

	public keys(): IterableIterator<Key> {
		return new Map(this.cache).keys();
	}

	public values(): IterableIterator<Payload> {
		return new Map(this.cache).values();
	}

	/**
	 * Set the default expiration time in milliseconds
	 * @param expireMs - The default expiration time in milliseconds
	 */
	public setExpireMs(expireMs: number | undefined) {
		this.defaultExpireMs = expireMs;
	}

	private clearTimeout(key: Key) {
		const entry = this.cacheTimeout.get(key);
		if (entry?.timeout) {
			clearTimeout(entry.timeout);
			entry.timeout = undefined;
		}
	}

	private notifyOnClear(entries: Map<Key, Payload>) {
		this.handleOnClear.forEach((callback) => callback(entries));
	}

	private getExpireDate(expires: Date | undefined): Date | undefined {
		const defaultExpireDate: Date | undefined = this.defaultExpireMs ? new Date(Date.now() + this.defaultExpireMs) : undefined;
		return expires ?? defaultExpireDate;
	}
}
