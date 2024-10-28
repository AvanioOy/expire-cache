import {type ILoggerLike, LogLevel, type LogMapping, MapLogger} from '@avanio/logger-like';
import {EventEmitter} from 'stream';
import {type ExpireCacheLogMapType} from './ExpireCache.mjs';

export type TierType<Data, Tier extends string> = {tier: Tier; data: Data};

/**
 * Helper type to build cache tier getter methods
 */
export type GetCacheTier<T extends TierType<unknown, string>[], Key> = {
	[K in T[number] as `get${Capitalize<K['tier']>}`]: (key: Key, cache: T[number]) => Promise<K['data'] | undefined> | K['data'] | undefined;
};

export type TieredCacheStatus<T extends TierType<unknown, string>[]> = {
	size: number;
	tiers: Record<T[number]['tier'], number>;
};

type MultiTierCacheEvents<T extends TierType<unknown, string>[]> = {
	update: [status: TieredCacheStatus<T>];
};

const defaultLogMap = {
	clear: LogLevel.None,
	clearTimeoutKey: LogLevel.None,
	constructor: LogLevel.None,
	delete: LogLevel.None,
	get: LogLevel.None,
	has: LogLevel.None,
	runTimeout: LogLevel.None,
	set: LogLevel.None,
	setTimeout: LogLevel.None,
	size: LogLevel.None,
} as const;

export type TieredCacheLogMapType = LogMapping<keyof typeof defaultLogMap>;

/**
 * Multi tier cache with timeout support to change tier based on timeout
 * @since v0.6.0
 */
export abstract class TieredCache<Tiers extends TierType<unknown, string>[], TimeoutEnum extends number, Key> extends EventEmitter<
	MultiTierCacheEvents<Tiers>
> {
	public abstract readonly cacheName: string;
	protected readonly cache = new Map<Key, Tiers[number]>();
	private readonly cacheTimeout = new Map<Key, ReturnType<typeof setTimeout> | undefined>();
	private readonly logger: MapLogger<TieredCacheLogMapType>;
	constructor(logger?: ILoggerLike, logMapping?: Partial<ExpireCacheLogMapType>) {
		super();
		this.logger = new MapLogger<TieredCacheLogMapType>(logger, Object.assign({}, defaultLogMap, logMapping));
		this.logCacheName();
		this.handleCacheEntry = this.handleCacheEntry.bind(this);
	}

	private logCacheName() {
		this.logger.logKey('constructor', `MultiTierCache ${this.cacheName} created`);
	}

	/**
	 * Get cache entry from cache
	 * @param key - cache key
	 * @param tier - cache tier
	 * @param timeout - optional update to new timeout for cache entry (if not provided, default timeout for tier will be used)
	 * @returns - promise that resolves when cache entry is set
	 */
	public async get<T extends Tiers[number]>(key: Key, tier: T['tier'], timeout?: TimeoutEnum): Promise<Promise<T['data'] | undefined> | T['data'] | undefined> {
		this.logger.logKey('get', `MultiTierCache ${this.cacheName} get: '${String(key)}' tier: ${tier}`);
		const entry = this.cache.get(key);
		const value = await this.handleCacheEntry(key, tier, entry);
		// if we found entry, let's extend timeout
		if (value) {
			this.setTimeout(key, timeout ?? this.handleTierDefaultTimeout(tier));
		}
		return value;
	}

	/**
	 * Set cache entry
	 * @param key - cache key
	 * @param tier - cache tier
	 * @param data - cache data
	 * @param timeout - optional timeout for cache entry. Else timeout will be checked from handleTimeoutValue or default timeout for tier.
	 */
	public async set<T extends Tiers[number]>(key: Key, tier: T['tier'], data: T['data'], timeout?: TimeoutEnum): Promise<void> {
		this.logger.logKey('set', `MultiTierCache ${this.cacheName} set: '${String(key)}' tier: ${tier}`);
		this.handleSetValue(key, tier, data);
		const entryTimeoutValue = await this.handleTimeoutValue(key, tier, data);
		this.setTimeout(key, timeout || entryTimeoutValue || this.handleTierDefaultTimeout(tier));
		this.emit('update', this.buildStatus());
	}

	/**
	 * Get tier type for current key
	 */
	public getTier(key: Key): Tiers[number]['tier'] | undefined {
		const entry = this.cache.get(key);
		return entry?.tier;
	}

	/**
	 * Iterate this.cache values and use handleCacheEntry to get data
	 * @param tier
	 */
	public tierValues(tier: Tiers[number]['tier']): AsyncIterable<Tiers[number]['data']> {
		const iterator = this.cache.entries();
		const currentTierResolve = this.handleCacheEntry.bind(this);
		return {
			[Symbol.asyncIterator]: () => {
				return {
					async next() {
						const {value, done} = iterator.next();
						if (done) {
							return {value: value?.[0], done: true};
						}
						return {value: await currentTierResolve(value[0], tier, value[1]), done: false};
					},
				};
			},
		};
	}

	public tierEntries(tier: Tiers[number]['tier']): AsyncIterable<[Key, Tiers[number]['data']]> {
		const iterator = this.cache.entries();
		const currentTierResolve = this.handleCacheEntry.bind(this);
		return {
			[Symbol.asyncIterator]: () => {
				return {
					async next() {
						const {value, done} = iterator.next();
						if (done) {
							return {value, done: true};
						}
						return {value: [value[0], await currentTierResolve(value[0], tier, value[1])], done: false};
					},
				};
			},
		};
	}

	public keys(): Iterable<Key> {
		return this.cache.keys();
	}

	public has(key: Key) {
		this.logger.logKey('has', `MultiTierCache ${this.cacheName} has: '${String(key)}'`);
		return this.cache.has(key);
	}

	public size() {
		this.logger.logKey('size', `MultiTierCache ${this.cacheName} size: ${this.cache.size.toString()}`);
		return this.cache.size;
	}

	public clear() {
		this.clearAllTimeouts();
		this.cache.clear();
		this.logger.logKey('clear', `MultiTierCache ${this.cacheName} clear`);
		this.emit('update', this.buildStatus());
	}

	public delete(key: Key): boolean {
		this.clearTimeoutKey(key);
		const isDeleted = this.cache.delete(key);
		this.logger.logKey('delete', `MultiTierCache ${this.cacheName} delete: '${String(key)}'`);
		this.emit('update', this.buildStatus());
		return isDeleted;
	}

	public status(): TieredCacheStatus<Tiers> {
		return this.buildStatus();
	}

	private setTimeout(key: Key, timeout: number | undefined) {
		const oldTimeout = this.cacheTimeout.get(key);
		if (oldTimeout) {
			clearTimeout(oldTimeout);
		}
		if (timeout !== undefined) {
			this.cacheTimeout.set(
				key,
				setTimeout(async () => this.runTimeout(key), timeout),
			);
			this.logger.logKey('setTimeout', `MultiTierCache ${this.cacheName} setTimeout: '${String(key)}' = timeouts: ${timeout.toString()}`);
		}
	}

	private clearTimeoutKey(key: Key) {
		const oldTimeout = this.cacheTimeout.get(key);
		if (oldTimeout) {
			this.logger.logKey('clearTimeoutKey', `MultiTierCache ${this.cacheName} clearTimeoutKey: '${String(key)}'`);
			clearTimeout(oldTimeout);
		}
		this.cacheTimeout.delete(key);
	}

	private clearAllTimeouts() {
		for (const timeout of this.cacheTimeout.values()) {
			if (timeout) {
				clearTimeout(timeout);
			}
		}
		this.cacheTimeout.clear();
	}

	private async runTimeout(key: Key) {
		try {
			const timeoutValue = await this.handleTierTimeout(key);
			if (timeoutValue === undefined) {
				this.logger.logKey('runTimeout', `MultiTierCache ${this.cacheName} runTimeout: '${String(key)}' cleared`);
				this.clearTimeoutKey(key);
			} else {
				this.logger.logKey('runTimeout', `MultiTierCache ${this.cacheName} runTimeout: '${String(key)}' cleared, new timeout: ${timeoutValue.toString()}`);
				this.setTimeout(key, timeoutValue);
			}
			this.emit('update', this.buildStatus());
		} catch (error) {
			/* v8 ignore next 2 */
			this.logger.error(error);
		}
	}

	/**
	 * Typed helper to set cache entry
	 */
	protected handleSetValue<T extends Tiers[number]>(key: Key, type: T['tier'], data: T['data']) {
		this.cache.set(key, {tier: type, data} as T);
	}

	protected abstract handleCacheEntry<T extends Tiers[number]>(
		key: Key,
		tier: T['tier'],
		cache: Tiers[number] | undefined,
	): Promise<T['data'] | undefined> | T['data'] | undefined;
	/**
	 * this return new timeout value for cached entry based on tier (or undefined if tier doesn't have timeout)
	 * @example
	 * // if tier not care about data and just want to return default timeouts
	 * protected handleTimeoutValue<T extends DateCacheTiers[number]>(key: Key, tier: T['type'], _data: T['data']) {
	 *   return this.handleTierDefaultTimeout(tier); // else make logic based on data (i.e. newer data should have longer timeout)
	 * }
	 */
	protected abstract handleTimeoutValue<T extends Tiers[number]>(key: Key, tier: T['tier'], data: T['data']): Promise<number | undefined> | number | undefined;
	/**
	 * this handle should change value of cache entry to another shape and return next tier default timeout (can also delete entry)
	 */
	protected abstract handleTierTimeout(key: Key): Promise<number | undefined> | number | undefined;
	/**
	 * If request didn't specify timeout, this method should return default timeout for tier or undefined if tier doesn't have timeout.
	 */
	protected abstract handleTierDefaultTimeout(type: Tiers[number]['tier']): TimeoutEnum | undefined;

	protected abstract buildStatus(): TieredCacheStatus<Tiers>;
}