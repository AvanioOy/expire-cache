import {ICache, ICacheOnClearCallback} from './interfaces/ICache';
import {ILoggerLike, LogLevel, MapLogger} from '@avanio/logger-like';
import {ExpireCacheLogMapType} from './ExpireCache';

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
 * Helpper type for the cache value
 */
type CacheType<Payload> = {data: Payload; timeout: ReturnType<typeof setTimeout> | undefined; expires: Date | undefined};

/**
 * ExpireCache class that implements the ICache interface with value expiration and expires with setTimeout
 * @template Payload - The type of the cached data
 * @template Key - (optional) The type of the cache key (default is string)
 */
export class ExpireTimeoutCache<Payload, Key = string> extends MapLogger<ExpireCacheLogMapType> implements ICache<Payload, Key> {
	private cache = new Map<Key, CacheType<Payload>>();
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
		this.logKey('constructor', `ExpireTimeoutCache created, defaultExpireMs: ${defaultExpireMs}`);
		this.defaultExpireMs = defaultExpireMs;
	}

	public set(key: Key, data: Payload, expires?: Date) {
		this.clearTimeout(key);
		const defaultExpireDate: Date | undefined = this.defaultExpireMs ? new Date(Date.now() + this.defaultExpireMs) : undefined;
		const expiresDate: Date | undefined = expires ?? defaultExpireDate;
		const expireTs = expiresDate && expiresDate.getTime() - Date.now();
		const expireString = expireTs ? `${expireTs} ms` : 'undefined';
		this.logKey('set', `ExpireTimeoutCache set key: ${key}, expireTs: ${expireString}`);
		const timeout = expireTs ? setTimeout(() => this.delete(key), expireTs) : undefined;
		this.cache.set(key, {data, timeout, expires: expiresDate});
	}

	public get(key: Key) {
		this.logKey('get', `ExpireTimeoutCache get key: ${key}`);
		return this.cache.get(key)?.data;
	}

	public has(key: Key) {
		this.logKey('has', `ExpireTimeoutCache has key: ${key}`);
		return this.cache.has(key);
	}

	public expires(key: Key): Date | undefined {
		this.logKey('expires', `ExpireTimeoutCache get expire for key: ${key}`);
		const entry = this.cache.get(key);
		return entry?.expires;
	}

	public delete(key: Key) {
		this.logKey('delete', `ExpireTimeoutCache delete key: ${key}`);
		this.clearTimeout(key);
		const entry = this.cache.get(key);
		if (entry) {
			this.notifyOnClear(new Map<Key, Payload>([[key, entry.data]]));
		}
		return this.cache.delete(key);
	}

	public clear() {
		this.logKey('clear', `ExpireTimeoutCache clear`);
		this.cache.forEach((_value, key) => this.clearTimeout(key));
		this.notifyOnClear(this.cacheAsKeyPayloadMap());
		this.cache.clear();
	}

	public size() {
		this.logKey('size', `ExpireTimeoutCache size: ${this.cache.size}`);
		return this.cache.size;
	}

	public onClear(callback: ICacheOnClearCallback<Payload, Key>): void {
		this.logKey('onExpire', `ExpireCache onExpire`);
		this.handleOnClear.add(callback);
	}

	private clearTimeout(key: Key) {
		const entry = this.cache.get(key);
		if (entry?.timeout) {
			clearTimeout(entry.timeout);
			entry.timeout = undefined;
		}
	}

	private notifyOnClear(entries: Map<Key, Payload>) {
		this.handleOnClear.forEach((callback) => callback(entries));
	}

	private cacheAsKeyPayloadMap(): Map<Key, Payload> {
		const map = new Map<Key, Payload>();
		for (const [key, value] of this.cache.entries()) {
			map.set(key, value.data);
		}
		return map;
	}
}
