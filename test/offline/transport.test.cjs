'use strict';
const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { Readable } = require('node:stream');
const TelegramBot = require('../..');
function botWith(response) {
  const calls = [];
  const Bot = proxyquire('../../src/telegram', {
    'request-promise': options => { calls.push(options); return Promise.resolve().then(() => response(options)); },
    request: () => { throw new Error('Unexpected streaming transport'); },
  });
  return { bot: new Bot('synthetic-token'), calls };
}
describe('offline transport contract', function () {
  it('serializes reply markup and retains request options', async function () {
    const { bot, calls } = botWith(() => ({ body: JSON.stringify({ ok: true, result: { message_id: 42 } }) }));
    bot.options.request = { timeout: 1200 };
    const result = await bot.sendMessage(123, 'synthetic text', { reply_markup: { remove_keyboard: true } });
    assert.deepEqual(result, { message_id: 42 });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.telegram.org/botsynthetic-token/sendMessage');
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].timeout, 1200);
    assert.equal(calls[0].form.chat_id, 123);
    assert.equal(calls[0].form.text, 'synthetic text');
    assert.equal(calls[0].form.reply_markup, '{"remove_keyboard":true}');
    assert.equal(calls[0].resolveWithFullResponse, true);
    assert.equal(calls[0].simple, false);
  });
  it('preserves Telegram error codes and response bodies', async function () {
    const response = { body: '{"ok":false,"error_code":400,"description":"synthetic failure"}' };
    const { bot } = botWith(() => response);
    await assert.rejects(bot.getMe(), error => error.code === 'ETELEGRAM' && error.response === response);
  });
  it('preserves malformed JSON parse failures', async function () {
    const response = { body: '<invalid>' };
    const { bot } = botWith(() => response);
    await assert.rejects(bot.getMe(), error => error.code === 'EPARSE' && error.response === response);
  });
  it('wraps transport errors as fatal without contacting a provider', async function () {
    const { bot } = botWith(() => { throw new Error('synthetic disconnect'); });
    await assert.rejects(bot.getMe(), error => error.code === 'EFATAL' && /synthetic disconnect/.test(error.message));
  });
  it('rejects missing tokens before invoking transport', async function () {
    const { bot, calls } = botWith(() => { throw new Error('Must not run'); });
    bot.token = null;
    await assert.rejects(bot.getMe(), error => error.code === 'EFATAL');
    assert.equal(calls.length, 0);
  });
  it('routes synthetic text updates to events and regex callbacks', function () {
    const bot = new TelegramBot('synthetic-token');
    const received = [];
    bot.on('message', message => received.push(message));
    bot.onText(/^hello (.*)$/, (message, match) => received.push(match[1]));
    const message = { message_id: 1, text: 'hello fixture', chat: { id: 123 } };
    bot.processUpdate({ update_id: 1, message });
    assert.deepEqual(received, [message, 'fixture']);
  });
  it('rejects accidental real network paths synchronously', function () {
    for (const run of [() => require('http').get('http://example.invalid'),
      () => require('https').request('https://example.invalid'),
      () => require('net').connect(443, 'example.invalid'),
      () => require('dns').lookup('example.invalid'),
      () => fetch('https://example.invalid')]) assert.throws(run, /Network disabled/);
  });
  it('collects webhook chunks using the upgraded buffer dependency', async function () {
    const WebHook = require('../../src/telegramWebHook');
    const updates = [];
    const hook = new WebHook({ token: 'synthetic-token', options: { webHook: {} }, processUpdate: update => updates.push(update) });
    const req = Readable.from(['{"update_', 'id":123}']);
    req.url = '/synthetic-token';
    req.method = 'POST';
    req.headers = {};
    await new Promise(resolve => hook._requestListener(req, { end: resolve }));
    assert.deepEqual(updates, [{ update_id: 123 }]);
    assert.equal(hook.isOpen(), false);
  });
});

describe('patched request dependency contract', function () {
  it('encodes multipart fields with the compatible form-data security patch', function () {
    const { createRequire } = require('node:module');
    const fromRequest = createRequire(require.resolve('request'));
    const FormData = fromRequest('form-data');
    const first = new FormData();
    const second = new FormData();
    first.append('caption', 'synthetic');
    first.append('photo', Buffer.from('fixture'), { filename: 'test.txt', contentType: 'text/plain' });
    assert.notEqual(first.getBoundary(), second.getBoundary());
    const body = first.getBuffer().toString();
    assert.match(body, /name="caption"/);
    assert.match(body, /filename="test.txt"/);
    assert.match(body, /Content-Type: text\/plain/);
    assert.ok(body.endsWith(`--${first.getBoundary()}--\r\n`));
    const qs = fromRequest('qs');
    assert.equal(qs.stringify({ chat_id: 123, text: 'a b' }), 'chat_id=123&text=a%20b');
  });
});
