import {IAsyncCache} from './IAsyncCache';
import {ICache} from './ICache';

/**
 * A type that represents both synchronous and asynchronous cache interfaces.
 * This type can be used to create functions that work with both types of cache interfaces.
 * @example
 * function foo(cache: ICacheOrAsync<string>) {
 *   const value = await cache.get('key');
 *   await cache.set('key', 'value');
 *   await cache.has('key'); // true
 *   await cache.delete('key');
 *   await cache.clear();
 *   await cache.size(); // 0
 * }
 */
export type ICacheOrAsync<Payload, Key = string> = ICache<Payload, Key> | IAsyncCache<Payload, Key>;
