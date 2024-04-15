import {ICache, ICacheOnClearCallback} from './interfaces/ICache';
import {ILoggerLike, LogLevel, LogMapping, MapLogger} from '@avanio/logger-like';

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
 * Helpper type for the cache value
 */
type CacheType<Payload> = {data: Payload; expires: number | undefined};

/**
 * ExpireCache class that implements the ICache interface with value expiration and expires on read operations
 * @template Payload - The type of the cached data
 * @template Key - (optional) The type of the cache key (default is string)
 */
export class ExpireCache<Payload, Key = string> extends MapLogger<ExpireCacheLogMapType> implements ICache<Payload, Key> {
	private cache = new Map<Key, CacheType<Payload>>();
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
		this.logKey('constructor', `ExpireCache created, defaultExpireMs: ${defaultExpireMs}`);
		this.defaultExpireMs = defaultExpireMs;
	}

	public set(key: Key, data: Payload, expires?: Date) {
		const expireTs: number | undefined = expires?.getTime() ?? (this.defaultExpireMs && Date.now() + this.defaultExpireMs);
		this.logKey('set', `ExpireCache set key: ${key}, expireTs: ${expireTs}`);
		this.cache.set(key, {data, expires: expireTs});
	}

	public get(key: Key) {
		this.logKey('get', `ExpireCache get key: ${key}`);
		this.cleanExpired();
		return this.cache.get(key)?.data;
	}

	public has(key: Key) {
		this.logKey('has', `ExpireCache has key: ${key}`);
		this.cleanExpired();
		return this.cache.has(key);
	}

	public expires(key: Key): Date | undefined {
		this.logKey('expires', `ExpireCache get expire for key: ${key}`);
		const entry = this.cache.get(key);
		this.cleanExpired();
		return entry?.expires ? new Date(entry.expires) : undefined;
	}

	public delete(key: Key) {
		this.logKey('delete', `ExpireCache delete key: ${key}`);
		const entry = this.cache.get(key);
		if (entry) {
			this.notifyOnClear(new Map<Key, Payload>([[key, entry.data]]));
		}
		return this.cache.delete(key);
	}

	public clear() {
		this.logKey('clear', `ExpireCache clear`);
		this.notifyOnClear(this.cacheAsKeyPayloadMap());
		this.cache.clear();
	}

	public size() {
		this.logKey('size', `ExpireCache size: ${this.cache.size}`);
		return this.cache.size;
	}

	public onClear(callback: ICacheOnClearCallback<Payload, Key>): void {
		this.logKey('onExpire', `ExpireCache onExpire`);
		this.handleOnClear.add(callback);
	}

	public entries(): IterableIterator<[Key, Payload]> {
		return this.cacheAsKeyPayloadMap().entries();
	}

	public keys(): IterableIterator<Key> {
		return this.cacheAsKeyPayloadMap().keys();
	}

	public values(): IterableIterator<Payload> {
		return this.cacheAsKeyPayloadMap().values();
	}

	public setExpireMs(expireMs: number | undefined) {
		this.defaultExpireMs = expireMs;
	}

	/**
	 * Cleans expired cache entries
	 */
	private cleanExpired() {
		const now = new Date().getTime();
		const deleteEntries = new Map<Key, Payload>();
		for (const [key, value] of this.cache.entries()) {
			if (value.expires !== undefined && value.expires < now) {
				deleteEntries.set(key, value.data);
				this.cache.delete(key);
			}
		}
		if (deleteEntries.size > 0) {
			this.notifyOnClear(deleteEntries);
			this.logKey('cleanExpired', `ExpireCache expired count: ${deleteEntries.size}`);
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
