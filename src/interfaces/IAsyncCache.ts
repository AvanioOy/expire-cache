/**
 * Async cache interface
 * @example
 * function foo(cache: IAsyncCache<string>) {
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
