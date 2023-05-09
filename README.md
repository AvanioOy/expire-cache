# @avanio/expire-cache

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/@avanio%2Fexpire-cache.svg)](https://badge.fury.io/js/@avanio%2Fexpire-cache)
[![Maintainability](https://api.codeclimate.com/v1/badges/a35459a312c189018ad0/maintainability)](https://codeclimate.com/github/AvanioOy/expire-cache/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a35459a312c189018ad0/test_coverage)](https://codeclimate.com/github/AvanioOy/expire-cache/test_coverage)
![github action](https://github.com/AvanioOy/expire-cache/actions/workflows/main.yml/badge.svg?branch=main)

Typescript/Javascript Cache interfaces and expiration cache class.

This package contains: 
- **_[ICache](./src/interfaces/ICache.ts)_** common cache interface
- **_[IAsyncCache](./src/interfaces/IAsyncCache.ts)_** common async cache interface
- **_[TAnyCache](./src/interfaces/TAnyCache.ts)_** type for both common cache interfaces
- **_[ExpireCache](./src/ExpireCache.ts)_** class which implements ICache interface with value expiration

## examples

Synchronous example

```typescript
import {ICache, ExpireCache} from '@avanio/expire-cache';

const cache = new ExpireCache<string>();

cache.add('key', 'value', new Date(Date.now() + 1000)); // expires 1000ms
cache.add('key2', 'value2'); // never expires (if no default expiration is set)

cache.get('key'); // 'value'

cache.delete('key');

cache.clear();

function useCache(cache: ICache<string>) {
	const value = cache.get('key'); // 'value'
}
```

### Synchronous/Asynchronous example (works with both ICache and IAsyncCache interfaces)

```typescript
import {TAnyCache} from '@avanio/expire-cache';

function useCache(cache: TAnyCache<string>) {
	const value = await cache.get('key'); // 'value'
}
```

### Advanced logging example, see [default log mapping](./src/ExpireCache.ts#L4)

```typescript
const cache = new ExpireCache<string>(console, {
	get: LogLevel.Info,
	set: LogLevel.Info,
});
```

### (optional) default expiration in milliseconds if not specified in add() method. (if both are undefined, cache entry never expires)

```typescript
const cache = new ExpireCache<string>(console, undefined, 60 * 1000); // sets default 60 seconds expiration for add() method
```
