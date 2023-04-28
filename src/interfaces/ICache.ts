/**
 * Cache interface
 * @example
 * functon foo(cache: ICache<string>) {
 * 	const value = cache.get('key');
 * 	cache.set('key', 'value');
 * 	cache.delete('key');
 * 	cache.clear();
 * }
 */
export interface ICache<Payload, Key = string> {
	/**
	 * Get cached value or undefined if not found from cache
	 */
	get(key: Key): Payload | undefined;
	/**
	 * Set cached value and optional expire Date object
	 */
	set(key: Key, value: Payload, expires?: Date): void;
	/**
	 * Delete cached value
	 */
	delete(key: Key): boolean;
	/**
	 * Clear all cached values
	 */
	clear(): void;
}

/**
 * Async cache interface
 * @example
 * functon foo(cache: IAsyncCache<string>) {
 * 	const value = await cache.get('key');
 * 	await cache.set('key', 'value');
 * 	await cache.delete('key');
 * 	await cache.clear();
 * }
 */
export interface IAsyncCache<Payload, Key = string> {
	/**
	 * Get cached value or undefined if not found from cache
	 */
	get(key: Key): Promise<Payload | undefined>;
	/**
	 * Set cached value and optional expire Date object
	 */
	set(key: Key, value: Payload, expires?: Date): Promise<void>;
	/**
	 * Delete cached value
	 */
	delete(key: Key): Promise<boolean>;
	/**
	 * Clear all cached values
	 */
	clear(): Promise<void>;
}

/**
 * Combine sync or async cache types
 * @example
 * functon foo(cache: TAnyCache<string>) {
 * 	const value = await cache.get('key');
 * 	await cache.set('key', 'value');
 * }
 */
export type TAnyCache<Payload, Key = string> = ICache<Payload, Key> | IAsyncCache<Payload, Key>;
