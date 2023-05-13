import {ILoggerLike, LogLevel, LogMapping, MapLogger} from '@avanio/logger-like';
import {ICache} from './interfaces/ICache';

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
	get: LogLevel.None,
	has: LogLevel.None,
	set: LogLevel.None,
	size: LogLevel.None,
} as const;

export type ExpireCacheLogMapType = LogMapping<keyof typeof defaultLogMap>;

/**
 * ExpireCache class that implements the ICache interface with value expiration
 * @template Payload - The type of the cached data
 * @template Key - (optional) The type of the cache key (default is string)
 */
export class ExpireCache<Payload, Key = string> extends MapLogger<ExpireCacheLogMapType> implements ICache<Payload, Key> {
	private cache = new Map<Key, {data: Payload; expires: number | undefined}>();
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

	/**
	 * Sets a value in the cache with an optional expiration date
	 * @param key - The key to set the value for
	 * @param data - The data to set in the cache
	 * @param expires - The optional expiration date for the cache entry
	 */
	public set(key: Key, data: Payload, expires?: Date) {
		const expireTs: number | undefined = expires?.getTime() ?? (this.defaultExpireMs && Date.now() + this.defaultExpireMs);
		this.logKey('set', `ExpireCache set key: ${key}, expireTs: ${expireTs}`);
		this.cache.set(key, {data, expires: expireTs});
	}

	/**
	 * Gets a value from the cache
	 * @param key - The key to get the value for
	 * @returns The cached value or undefined if not found
	 */
	public get(key: Key) {
		this.logKey('get', `ExpireCache get key: ${key}`);
		this.cleanExpired();
		return this.cache.get(key)?.data;
	}

	/**
	 * Checks if a key exists in the cache
	 * @param key - The key to check for
	 * @returns True if the key exists in the cache, false otherwise
	 */
	public has(key: Key) {
		this.logKey('has', `ExpireCache has key: ${key}`);
		this.cleanExpired();
		return this.cache.has(key);
	}

	/**
	 * Deletes a value from the cache
	 * @param key - The key to delete the value for
	 * @returns True if the value was deleted, false otherwise
	 */
	public delete(key: Key) {
		this.logKey('delete', `ExpireCache delete key: ${key}`);
		return this.cache.delete(key);
	}

	/**
	 * Clears all values from the cache
	 */
	public clear() {
		this.logKey('clear', `ExpireCache clear`);
		this.cache.clear();
	}

	/**
	 * Gets the number of items in the cache
	 * @returns The number of items in the cache
	 */
	public size() {
		this.logKey('size', `ExpireCache size: ${this.cache.size}`);
		return this.cache.size;
	}

	/**
	 * Cleans expired cache entries
	 */
	private cleanExpired() {
		let cleanCount = 0;
		const now = new Date().getTime();
		for (const [key, value] of this.cache.entries()) {
			if (value.expires !== undefined && value.expires < now) {
				this.cache.delete(key);
				cleanCount++;
			}
		}
		if (cleanCount > 0) {
			this.logKey('cleanExpired', `ExpireCache expired count: ${cleanCount}`);
		}
	}
}
