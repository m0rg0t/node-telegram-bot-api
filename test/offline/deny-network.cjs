'use strict';
// Loaded before any library or test. No tokens, DNS, sockets or providers.
const deny = () => { throw new Error('Network disabled in offline maintenance tests'); };
for (const name of ['http', 'https']) {
  const mod = require(name);
  mod.request = deny;
  mod.get = deny;
}
const net = require('net');
net.connect = net.createConnection = net.Socket.prototype.connect = deny;
net.Server.prototype.listen = deny;
require('tls').connect = deny;
require('dgram').createSocket = deny;
const dns = require('dns');
for (const name of Object.keys(dns)) {
  if (/^(lookup|resolve|reverse)/.test(name) && typeof dns[name] === 'function') dns[name] = deny;
}
for (const name of Object.keys(dns.promises)) {
  if (/^(lookup|resolve|reverse)/.test(name)) dns.promises[name] = deny;
}
globalThis.fetch = deny;
process.env.NTBA_FIX_319 = '1';
