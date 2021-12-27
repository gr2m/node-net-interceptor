import { EventEmitter } from "node:events";

import { test } from "uvu";
import * as assert from "uvu/assert";

import netInterceptor from "../index.js";

test("netInterceptor.start is a function", () => {
  assert.instance(netInterceptor.start, Function);
});
test("netInterceptor.stop is a function", () => {
  assert.instance(netInterceptor.stop, Function);
});

test("multiple calls of start and stop are no-ops", () => {
  netInterceptor.start();
  netInterceptor.start();
  netInterceptor.stop();
  netInterceptor.stop();
});

test("netInterceptor.addListener must be an alias to EventEmitter.prototype.addListener", () => {
  assert.equal(netInterceptor.addListener, EventEmitter.prototype.addListener);
});

test("netInterceptor.off must be an alias to EventEmitter.prototype.removeListener", () => {
  assert.equal(netInterceptor.off, EventEmitter.prototype.removeListener);
});

test.run();
