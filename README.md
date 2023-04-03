# @avanio/expire-cache

Typescript/Javascript expiration cache.

Works like a Map, but with optional expiration Date object.

Also contains a ___[ICache](./src/interfaces/ICache.ts)___ interface which can be mocked for testing or have a custom implementation.

## examples

```typescript
import {ICache, ExpireCache} from '@avanio/expire-cache';

const cache = new ExpireCache<string>();

cache.add('key', 'value', new Date(Date.now() + 1000)); // expires 1000ms

cache.get('key'); // 'value'

cache.delete('key');

cache.clear();

function useCache(cache: ICache<string>) {
	cache.get('key'); // 'value'
}
```
