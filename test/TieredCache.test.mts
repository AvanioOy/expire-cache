import {type ILoggerLike, LogLevel} from '@avanio/logger-like';
import * as sinon from 'sinon';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {type TieredCacheLogMapType} from '../src/index.mjs';
import {DateTieredCache, DateTimeout} from './mockup/DateTieredCache.mjs';

const traceSpy = sinon.spy();
const infoSpy = sinon.spy();
const warnSpy = sinon.spy();
const errorSpy = sinon.spy();
const debugSpy = sinon.spy();

const statusUpdateSpy = sinon.spy();

const spyLogger: ILoggerLike = {
	trace: traceSpy,
	info: infoSpy,
	warn: warnSpy,
	error: errorSpy,
	debug: debugSpy,
};

const logLevelMap: TieredCacheLogMapType = {
	clear: LogLevel.Trace,
	constructor: LogLevel.Trace,
	delete: LogLevel.Trace,
	get: LogLevel.None,
	has: LogLevel.Trace,
	runTimeout: LogLevel.Trace,
	size: LogLevel.Trace,
	set: LogLevel.None,
	setTimeout: LogLevel.Trace,
	clearTimeoutKey: LogLevel.Trace,
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

let cache: DateTieredCache;

describe('TieredCache cache', () => {
	beforeEach(function () {
		cache = new DateTieredCache(spyLogger, logLevelMap);
		cache.on('update', statusUpdateSpy);
		traceSpy.resetHistory();
		infoSpy.resetHistory();
		warnSpy.resetHistory();
		errorSpy.resetHistory();
		debugSpy.resetHistory();
		statusUpdateSpy.resetHistory();
	});
	it('should return undefined value if not cached yet', async function () {
		await expect(cache.get('key', 'model')).resolves.toEqual(undefined);
		expect(statusUpdateSpy.callCount).toEqual(0);
	});
	it('should return cached value', async function () {
		const date = new Date();
		await cache.set('key', 'model', date);
		expect(traceSpy.callCount).toEqual(1);
		await expect(cache.get('key', 'stringValue')).resolves.toEqual(`{"$cdate":${date.getTime().toString()}}`);
		await expect(cache.get('key', 'object')).resolves.toEqual({$cdate: date.getTime()});
		await expect(cache.get('key', 'model')).resolves.toEqual(date);
		expect(traceSpy.callCount).toEqual(4);
		expect(statusUpdateSpy.callCount).toEqual(1);
		expect(cache.deleteKeys(['key'])).toEqual(1);
	});
	it('should return cached value and wait timeouts', async function () {
		const date = new Date();
		await cache.set('key', 'model', date);
		expect(traceSpy.callCount).toEqual(1);
		await expect(cache.get('key', 'model')).resolves.toEqual(date);
		expect(cache.getTier('key')).toEqual('model');
		expect(cache.status()).toEqual({size: 1, tiers: {model: 1, object: 0, stringValue: 0}});
		traceSpy.resetHistory();
		await sleep(DateTimeout.Model);
		expect(cache.getTier('key')).toEqual('object');
		expect(cache.status()).toEqual({size: 1, tiers: {model: 0, object: 1, stringValue: 0}});
		expect(traceSpy.callCount).toEqual(3);
		traceSpy.resetHistory();
		await sleep(DateTimeout.Object);
		expect(cache.getTier('key')).toEqual('stringValue');
		expect(cache.status()).toEqual({size: 1, tiers: {model: 0, object: 0, stringValue: 1}});
		expect(traceSpy.callCount).toEqual(3);
		await expect(cache.get('key', 'stringValue')).resolves.toEqual(date.getTime().toString());
		// should clear cache entry
		traceSpy.resetHistory();
		await sleep(DateTimeout.StringValue);
		expect(cache.getTier('key')).toEqual(undefined);
		expect(cache.status()).toEqual({size: 0, tiers: {model: 0, object: 0, stringValue: 0}});
		expect(traceSpy.callCount).toEqual(2);
		traceSpy.resetHistory();
		expect(statusUpdateSpy.callCount).toEqual(4); // insert, timeout, timeout, timeout
	});
	it('should test iterators', async function () {
		const date = new Date();
		await cache.setEntries('model', [['key', date]]);
		for await (const entry of cache.tierValues('model')) {
			expect(entry).toEqual(date);
		}
		for await (const [key, value] of cache.tierEntries('model')) {
			expect(key).toEqual('key');
			expect(value).toEqual(date);
		}
		const keys = [...cache.keys()];
		expect(keys).toEqual(['key']);
		expect(cache.size()).toEqual(1);
		expect(cache.has('key')).toEqual(true);
		expect(cache.delete('key')).toEqual(true);
		expect(cache.size()).toEqual(0);
		await cache.set('key', 'model', date);
		expect(cache.clear()).toEqual(undefined);
	});
	afterEach(function () {
		cache.clear();
	});
});
