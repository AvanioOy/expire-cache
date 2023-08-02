/* eslint-disable sort-keys, no-unused-expressions, @typescript-eslint/no-explicit-any, sonarjs/no-duplicate-string */
import 'mocha';
import * as chai from 'chai';
import * as sinon from 'sinon';
import {ExpireCache, ExpireCacheLogMapType} from '../src/';
import {ILoggerLike, LogLevel} from '@avanio/logger-like';
import {iterAsArray} from './lib/iter';

const expect = chai.expect;

const onClearSpy = sinon.spy();

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

let cache: ExpireCache<string>;

describe('Expire Cache', () => {
	beforeEach(() => {
		traceSpy.resetHistory();
		infoSpy.resetHistory();
		warnSpy.resetHistory();
		errorSpy.resetHistory();
		debugSpy.resetHistory();
		cache = new ExpireCache<string>(spyLogger, logLevelMap);
		cache.onClear(onClearSpy);
	});
	it('should return undefined value if not cached yet', async () => {
		expect(cache.get('key')).to.be.undefined;
		expect(cache.size()).to.be.equal(0);
		expect(traceSpy.callCount).to.be.equal(3);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireCache get key: key');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireCache size: 0');
	});
	it('should return cached value', async () => {
		cache.set('key', 'value');
		expect(cache.size()).to.be.equal(1);
		expect(cache.get('key')).to.equal('value');
		expect(cache.has('key')).to.equal(true);
		expect(traceSpy.callCount).to.be.equal(5);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireCache set key: key, expireTs: undefined');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireCache size: 1');
		expect(traceSpy.getCall(3).firstArg).to.be.equal('ExpireCache get key: key');
		expect(traceSpy.getCall(4).firstArg).to.be.equal('ExpireCache has key: key');
		expect(await iterAsArray(cache.entries())).to.be.eql([['key', 'value']]);
		expect(await iterAsArray(cache.keys())).to.be.eql(['key']);
		expect(await iterAsArray(cache.values())).to.be.eql(['value']);
	});
	it('should return cached value', async () => {
		const expires = new Date(Date.now() + 1000);
		cache.set('key', 'value', expires);
		expect(cache.expires('key')?.getTime()).to.be.equal(expires.getTime());
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal(`ExpireCache set key: key, expireTs: ${expires.getTime()}`);
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireCache get expire for key: key');
	});
	it('should return undefined value if expired', async () => {
		cache.set('key', 'value', new Date(Date.now() + 1)); // epires in 1ms
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(cache.size()).to.be.equal(1);
		expect(cache.get('key')).to.be.undefined;
		expect(cache.size()).to.be.equal(0);
		expect(traceSpy.callCount).to.be.equal(6);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.match(/^ExpireCache set key: key, expireTs: \d+$/);
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireCache size: 1');
		expect(traceSpy.getCall(3).firstArg).to.be.equal('ExpireCache get key: key');
		expect(traceSpy.getCall(4).firstArg).to.be.equal('ExpireCache expired count: 1');
		expect(traceSpy.getCall(5).firstArg).to.be.equal('ExpireCache size: 0');
		expect(onClearSpy.getCall(0).args[0]).to.be.eql(new Map([['key', 'value']])); // onExpire called
	});
	it('should return undefined value if deleted', async () => {
		cache.set('key', 'value');
		cache.delete('key');
		expect(traceSpy.callCount).to.be.equal(3);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireCache set key: key, expireTs: undefined');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireCache delete key: key');
		expect(cache.get('key')).to.be.undefined;
	});
	it('should return undefined value if cleared', async () => {
		cache.set('key', 'value');
		cache.clear();
		expect(traceSpy.callCount).to.be.equal(3);
		expect(traceSpy.getCall(0).firstArg).to.be.equal('ExpireCache created, defaultExpireMs: undefined');
		expect(traceSpy.getCall(1).firstArg).to.be.equal('ExpireCache set key: key, expireTs: undefined');
		expect(traceSpy.getCall(2).firstArg).to.be.equal('ExpireCache clear');
		expect(cache.get('key')).to.be.undefined;
	});
	it('should have default expiration time', async () => {
		cache = new ExpireCache<string>(spyLogger, undefined, 100);
		cache.set('key', 'value');
		expect(cache.get('key')).to.equal('value');
		await new Promise((resolve) => setTimeout(resolve, 150));
		expect(cache.get('key')).to.be.undefined;
	});
});
