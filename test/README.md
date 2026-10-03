Running the tests:

```bash
# Token to be used
export TEST_TELEGRAM_TOKEN=<YOUR_BOT_TOKEN>

# User Id which you want to send the messages.
export TEST_USER_ID=<USER_ID>

# Group Id which to use in some of the tests, e.g. for TelegramBot#getChat()
export TEST_GROUP_ID=<GROUP_ID>

# Game short name to use in some tests, e.g. TelegramBot#sendGame()
# Defaults to "medusalab_test".
export TEST_GAME_SHORT_NAME=<GAME_SHORT_NAME>

# Sticker set name to use in some tests, e.g. TelegramBot#getStickerSet()
# Defaults to "pusheen".
export TEST_STICKER_SET_NAME=<STICKER_SET_NAME>

# Payment provider token to be used
export TEST_PROVIDER_TOKEN=<YOUR_PROVIDER_TOKEN>

# Run ALL tests
npm run test

# Run individual tests
npm run eslint              # static-analysis
npm run mocha               # mocha tests
```
Note: The bot must be an administrator in the chat for this to work and must have the appropriate admin rights.
## Safe offline maintenance (owned legacy fork)

Use Node 22.18+ or 24.11+ (CI exercises both maintained lines), then
`npm ci --ignore-scripts` and `npm test`. The default test command now builds
with Babel 8, lints source/offline tests using ESLint 10, runs only the original
`test.format-send-data.js` plus injected-transport regressions, and imports the
source, transpiled, and packed package entrypoints. It does not import
`test/telegram.js` or `test/utils.js`, require bot/payment credentials, start a
listener, or send messages. HTTP(S), raw sockets, DNS, UDP and fetch are denied
before test/library loading. Every bot credential in these tests is synthetic.

The original live integration suite is retained as historical documentation;
it is not part of maintenance CI and must not be run without separate explicit
permission for the real providers/recipients/payment operations it exercises.
The old `mocha` shortcut was removed to avoid accidentally discovering it.

Original format assertions are unchanged. Two fixtures now open their file
descriptor before removing/changing `stream.path`, because current Node opens
streams lazily; changing the path first otherwise causes unrelated filesystem
errors. New tests cover reply-markup encoding, request options, error mapping,
missing-token rejection, message dispatch, chunked webhook parsing, multipart
encoding and the fail-closed network boundary.

Compatibility choices: bl 6.1.6 is the newest compatible CommonJS family;
7.0.12 exposes import-only exports and fails this synchronous entrypoint with
ERR_PACKAGE_PATH_NOT_EXPORTED. file-type 12.4.2 preserves the synchronous
buffer detector; 22.x uses the incompatible async/ESM API. mime 3.0.0 retains
CommonJS; its renamed getType call is adapted without changing file-option
behavior, whereas mime 4 is ESM. These are explicit compatibility holds, not
claims of an all-current-major graph. Upstream 2.2 RC is a separate rewrite.

The lockfile pins same-major request overrides form-data 2.5.6 and qs 6.16.0,
and optimist's minimist 0.2.4, removing four critical audit paths. On 2026-10-03
the remaining audit is 13 findings: 8 high (braces, dmd, fast-glob, file-set,
jsdoc-api, jsdoc-to-markdown, micromatch, node-static) and 5 moderate (request,
request-promise, request-promise-core, tough-cookie, uuid). The deprecated
request family still has unresolved runtime advisories; docs/integration
utilities also remain affected. Audit downgrade suggestions are not accepted
as safe remediations. The library is not certified secure or newly supported
on historic Node 0.12–20; current tests establish only the documented baseline.
