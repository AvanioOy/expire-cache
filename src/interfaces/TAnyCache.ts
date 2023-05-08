import {IAsyncCache} from './IAsyncCache';
import {ICache} from './ICache';

/**
 * Combine sync or async cache types
 * @example
 * function foo(cache: TAnyCache<string>) {
 * 	const value = await cache.get('key');
 * 	await cache.set('key', 'value');
 * }
 */
export type TAnyCache<Payload, Key = string> = ICache<Payload, Key> | IAsyncCache<Payload, Key>;
