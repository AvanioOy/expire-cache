# @avanio/expire-cache

Typescript/Javascript expiration cache.

Works like a Map, but with optional expiration Date object.

Also contains a **_[ICache](./src/interfaces/ICache.ts)_** interface which can be mocked for testing or have a custom implementation.

## examples

Synchronous example

```typescript
import {ICache, ExpireCache} from '@avanio/expire-cache';

const cache = new ExpireCache<string>();

cache.add('key', 'value', new Date(Date.now() + 1000)); // expires 1000ms

cache.get('key'); // 'value'

cache.delete('key');

cache.clear();

function useCache(cache: ICache<string>) {
	const value = cache.get('key'); // 'value'
}
```

Synchronous/Asynchronous example (works with both ICache and IAsyncCache interfaces)

```typescript
import {TAnyCache} from '@avanio/expire-cache';

function useCache(cache: TAnyCache<string>) {
	const value = await cache.get('key'); // 'value'
}
```
