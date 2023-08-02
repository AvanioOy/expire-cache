/**
 * Callback type for when entries are expired or cleared
 */
export type ICacheOnClearCallback<Payload, Key = string> = (entries: Map<Key, Payload>) => void;

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
	 * Gets a value from the cache
	 * @param key - The key to get the value for
	 * @returns The cached value or undefined if not found
	 */
	get(key: Key): Payload | undefined;
	/**
	 * Sets a value in the cache with an optional expiration date
	 * @param key - The key to set the value for
	 * @param data - The data to set in the cache
	 * @param expires - The optional expiration date for the cache entry
	 */
	set(key: Key, value: Payload, expires?: Date): void;
	/**
	 * Deletes a value from the cache
	 * @param key - The key to delete the value for
	 * @returns {boolean} True if the value was deleted, false otherwise
	 */
	delete(key: Key): boolean;
	/**
	 * Checks if a key exists in the cache
	 * @param key - The key to check for
	 * @returns {boolean} True if the key exists in the cache, false otherwise
	 */
	has(key: Key): boolean;
	/**
	 * Get key expiration Date object or undefined if not found in cache
	 * @param key - The key to get the expiration for
	 * @returns {Date | undefined} Date object or undefined if not found in cache
	 */
	expires(key: Key): Date | undefined;
	/**
	 * Clear all cached values
	 */
	clear(): void;
	/**
	 * Gets the number of items in the cache
	 * @returns {number} The number of items in the cache
	 */
	size(): number;

	/**
	 * Called when a entries are expired, deleted or cleared
	 */
	onClear(callback: ICacheOnClearCallback<Payload, Key>): void;
}
