/**
 * Asynchronous cache interface
 * @example
 * function foo(cache: IAsyncCache<string>) {
 *   const value = await cache.get('key');
 *   await cache.set('key', 'value');
 *   await cache.has('key'); // true
 *   await cache.delete('key');
 *   await cache.clear();
 *   await cache.size(); // 0
 * }
 */
export interface IAsyncCache<Payload, Key = string> {
	/**
	 * Get cached value or undefined if not found in cache
	 */
	get(key: Key): Promise<Payload | undefined>;
	/**
	 * Set cached value and optional expiration Date object
	 */
	set(key: Key, value: Payload, expires?: Date): Promise<void>;
	/**
	 * Delete cached value
	 */
	delete(key: Key): Promise<boolean>;
	/**
	 * Check if a key exists in the cache
	 */
	has(key: Key): Promise<boolean>;
	/**
	 * Clear all cached values
	 */
	clear(): Promise<void>;
	/**
	 * Get the number of items in the cache
	 */
	size(): Promise<number>;
}
