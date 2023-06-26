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
	expires: LogLevel.None,
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
		return this.cache.delete(key);
	}

	public clear() {
		this.logKey('clear', `ExpireCache clear`);
		this.cache.clear();
	}

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
