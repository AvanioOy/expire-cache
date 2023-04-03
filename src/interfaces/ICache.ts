export interface ICache<Payload, Key = string> {
	/**
	 * Get cached value or undefined if not found from cache
	 */
	get(key: Key): Payload | undefined;
	/**
	 * Set cached value and optional time to live in milliseconds
	 */
	set(key: Key, value: Payload, timeToLive?: number): void;
	/**
	 * Delete cached value
	 */
	delete(key: Key): boolean;
	/**
	 * Clear all cached values
	 */
	clear(): void;
}
