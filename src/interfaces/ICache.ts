/**
 * Cache interface
 * @example
 * function foo(cache: ICache<string>) {
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
