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
	 * Gets a value from the cache
	 * @param key - The key to get the value for
	 * @returns {Promise<Payload | undefined>} Promise of the cached value or undefined if not found
	 */
	get(key: Key): Promise<Payload | undefined>;
	/**
	 * Sets a value in the cache with an optional expiration date
	 * @param key - The key to set the value for
	 * @param data - The data to set in the cache
	 * @param expires - The optional expiration date for the cache entry
	 * @returns {Promise<void>} Promise of void
	 */
	set(key: Key, value: Payload, expires?: Date): Promise<void>;
	/**
	 * Deletes a value from the cache
	 * @param key - The key to delete the value for
	 * @returns {Promise<boolean>} Promise of true if the value was deleted, false otherwise
	 */
	delete(key: Key): Promise<boolean>;
	/**
	 * Checks if a key exists in the cache
	 * @param key - The key to check for
	 * @returns {Promise<boolean>} Promise of true if the key exists in the cache, false otherwise
	 */
	has(key: Key): Promise<boolean>;
	/**
	 * Get key expiration Date object or undefined if not found in cache
	 * @param key - The key to get the expiration for
	 * @returns {Promise<Date | undefined>} Promise of Date object or undefined if not found in cache
	 */
	expires(key: Key): Promise<Date | undefined>;
	/**
	 * Clear all cached values
	 */
	clear(): Promise<void>;
	/**
	 * Gets the number of items in the cache
	 * @returns {Promise<number>} Promise of the number of items in the cache
	 */
	size(): Promise<number>;
}
