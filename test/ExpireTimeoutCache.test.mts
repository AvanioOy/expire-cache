import {type ILoggerLike, LogLevel} from '@avanio/logger-like';
import * as sinon from 'sinon';
import {beforeEach, describe, expect, it} from 'vitest';
import {type ExpireCacheLogMapType, ExpireTimeoutCache} from '../src/index.mjs';
import {iterAsArray} from './lib/iter.mjs';

const onExpiresSpy = sinon.spy();

const traceSpy = sinon.spy();
const infoSpy = sinon.spy();
const warnSpy = sinon.spy();
const errorSpy = sinon.spy();
const debugSpy = sinon.spy();

const spyLogger: ILoggerLike = {
	trace: traceSpy,
	info: infoSpy,
	warn: warnSpy,
	error: errorSpy,
	debug: debugSpy,
};

const logLevelMap: ExpireCacheLogMapType = {
	cleanExpired: LogLevel.Trace,
	clear: LogLevel.Trace,
	constructor: LogLevel.Trace,
	delete: LogLevel.Trace,
	get: LogLevel.Trace,
	set: LogLevel.Trace,
	has: LogLevel.Trace,
	onExpire: LogLevel.None,
	expires: LogLevel.Trace,
	size: LogLevel.Trace,
};

let cache: ExpireTimeoutCache<string>;

describe('Expire Timeout Cache', function () {
	beforeEach(function () {
		traceSpy.resetHistory();
		infoSpy.resetHistory();
		warnSpy.resetHistory();
		errorSpy.resetHistory();
		debugSpy.resetHistory();
		cache = new ExpireTimeoutCache<string>(spyLogger, logLevelMap);
		cache.on('expires', onExpiresSpy);
		cache.setExpireMs(undefined);
	});
	it('should return undefined value if not cached yet', function () {
		expect(cache.get('key')).to.be.undefined;
		expect(cache.size()).to.be.equal(0);
		expect(traceSpy.callCount).to.be.equal(3);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireTimeoutCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireTimeoutCache get key: key');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireTimeoutCache size: 0');
	});
	it('should return cached value', async function () {
		cache.set('key', 'value');
		expect(cache.size()).to.be.equal(1);
		expect(cache.get('key')).to.equal('value');
		expect(cache.has('key')).to.equal(true);
		expect(traceSpy.callCount).to.be.equal(5);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireTimeoutCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireTimeoutCache set key: key, expireTs: undefined');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireTimeoutCache size: 1');
		expect(traceSpy.getCall(3).firstArg).to.be.equal('ExpireTimeoutCache get key: key');
		expect(traceSpy.getCall(4).firstArg).to.be.equal('ExpireTimeoutCache has key: key');
		expect(await iterAsArray(cache.entries())).to.be.eql([['key', 'value']]);
		expect(await iterAsArray(cache.keys())).to.be.eql(['key']);
		expect(await iterAsArray(cache.values())).to.be.eql(['value']);
	});
	it('should return cached value', function () {
		const expires = new Date(Date.now() + 1000);
		cache.set('key', 'value', expires);
		expect(cache.expires('key')?.getTime()).to.be.equal(expires.getTime());
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireTimeoutCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal(`ExpireTimeoutCache set key: key, expireTs: 1000 ms`);
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireTimeoutCache get expire for key: key');
	});
	it('should return undefined value if expired', async function () {
		cache.set('key', 'value', new Date(Date.now() + 5)); // epires in 1ms
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(cache.size()).to.be.equal(0); // expired
		expect(cache.get('key')).to.be.undefined;
		expect(cache.size()).to.be.equal(0);
		expect(traceSpy.callCount).to.be.equal(6);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireTimeoutCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.match(/^ExpireTimeoutCache set key: key, expireTs: \d+ ms$/);
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireTimeoutCache delete key: key');
		expect(traceSpy.getCall(3).firstArg).to.be.equal('ExpireTimeoutCache size: 0');
		expect(traceSpy.getCall(4).firstArg).to.be.equal('ExpireTimeoutCache get key: key');
		expect(traceSpy.getCall(5).firstArg).to.be.equal('ExpireTimeoutCache size: 0');
		expect(onExpiresSpy.getCall(0).args).to.be.eql(['key', 'value']); // onExpire called
	});
	it('should return undefined value if deleted', function () {
		cache.set('key', 'value');
		cache.delete('key');
		expect(traceSpy.callCount).to.be.equal(3);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireTimeoutCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireTimeoutCache set key: key, expireTs: undefined');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireTimeoutCache delete key: key');
		expect(cache.get('key')).to.be.undefined;
	});
	it('should return undefined value if cleared', function () {
		cache.set('key', 'value');
		cache.clear();
		expect(traceSpy.callCount).to.be.equal(3);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireTimeoutCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireTimeoutCache set key: key, expireTs: undefined');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireTimeoutCache clear');
		expect(cache.get('key')).to.be.undefined;
	});
	it('should have default expiration time', async function () {
		cache = new ExpireTimeoutCache<string>(spyLogger, undefined, 100);
		cache.set('key', 'value');
		expect(cache.get('key')).to.equal('value');
		await new Promise((resolve) => setTimeout(resolve, 150));
		expect(cache.get('key')).to.be.undefined;
	});
});
