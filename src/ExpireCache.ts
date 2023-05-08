import {ILoggerLike, LogLevel, LogMapping, MapLogger} from '@avanio/logger-like';
import {ICache} from './interfaces/ICache';

/**
 * Default log map for ExpireCache (all logs to trace level)
 */
const defaultLogMap = {
	cleanExpired: LogLevel.Trace,
	clear: LogLevel.Trace,
	delete: LogLevel.Trace,
	get: LogLevel.Trace,
	set: LogLevel.Trace,
	size: LogLevel.Trace,
} as const;

export type ExpireCacheLogMapType = LogMapping<keyof typeof defaultLogMap>;

export class ExpireCache<Payload, Key = string> extends MapLogger<ExpireCacheLogMapType> implements ICache<Payload, Key> {
	private cache = new Map<Key, {data: Payload; expires: number | undefined}>();
	private defaultExpireMs: undefined | number;

	/**
	 *
	 * @param logger - logger to use (optional))
	 * @param logMapping - log mapping (optional), default is all logs to trace level
	 * @param defaultExpireMs - default expiration time in milliseconds (optional)
	 */
	constructor(logger?: ILoggerLike, logMapping?: Partial<ExpireCacheLogMapType>, defaultExpireMs?: number) {
		super(logger, Object.assign({}, defaultLogMap, logMapping));
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
