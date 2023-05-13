/**
 * Synchronous cache interface
 * @example
 * function foo(cache: ICache<string>) {
 *   const value = cache.get('key');
 *   cache.set('key', 'value');
 *   cache.has('key'); // true
 *   cache.delete('key');
 *   cache.clear();
 *   cache.size(); // 0
 * }
 */
export interface ICache<Payload, Key = string> {
	/**
	 * Get cached value or undefined if not found in cache
	 */
	get(key: Key): Payload | undefined;
	/**
	 * Set cached value and optional expiration Date object
	 */
	set(key: Key, value: Payload, expires?: Date): void;
	/**
	 * Delete cached value
	 */
	delete(key: Key): boolean;
	/**
	 * Check if a key exists in the cache
	 */
	has(key: Key): boolean;
	/**
	 * Clear all cached values
	 */
	clear(): void;
	/**
	 * Get the number of items in the cache
	 */
	size(): number;
}
