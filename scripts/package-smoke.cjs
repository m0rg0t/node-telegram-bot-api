'use strict';
const assert = require('node:assert/strict');
const source = require('..');
const built = require('../lib/telegram');
for (const Bot of [source, built]) {
  const bot = new Bot('synthetic-offline-token', { polling: false, webHook: false });
  assert.equal(bot._buildURL('getMe'), 'https://api.telegram.org/botsynthetic-offline-token/getMe');
  assert.equal(typeof bot.sendMessage, 'function');
  assert.equal(typeof bot.processUpdate, 'function');
  assert.equal(bot.isPolling(), false);
}
assert.deepEqual(Object.getOwnPropertyNames(source.prototype), Object.getOwnPropertyNames(built.prototype));
console.log('Source and built package entrypoints have matching public methods');
