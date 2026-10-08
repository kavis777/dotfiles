#!/usr/bin/env node
// Slack の勤怠連絡とジョブカンの打刻をまとめて行う CLI。
//   jobcan                         出勤: Slack 投稿 + 出勤打刻（既定 --time 1730 --place remote）
//   jobcan --time 1800             退勤予定を 18:00 にして出勤
//   jobcan --place office          出社として出勤
//   jobcan arrived                 「出社しました。業務開始します。」+ 出勤打刻
//   jobcan lunch / back            昼休憩の連絡（ジョブカン側に休憩打刻が無いため投稿のみ）
//   jobcan bye                     「お先に失礼します」+ 退勤打刻
//   jobcan login                   ブラウザを開いて手動ログインし、セッションを保存
//   jobcan inspect                 マイページの打刻UIと勤務状態を表示（打刻はしない）
//   jobcan whoami                  Slack トークンの素性を表示
//   jobcan set-credential          ジョブカンの認証情報を Keychain に登録
//   jobcan sync-credential         Bitwarden の認証情報を Keychain に取り込む
// 共通フラグ: --dry-run / --no-post / --no-punch / --headed / --force
//
// 認証情報は Bitwarden が「正」。ジョブカンのセッションが30分程度で切れるため、
// 実行のたびにログインが必要になる。毎回マスターパスワードを求められないよう
// macOS Keychain に複製を置き、通常の実行はそこから読む。

import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const CONFIG_DIR = path.join(homedir(), '.config', 'jobcan-cli');
const STATE_FILE = path.join(CONFIG_DIR, 'storage-state.json');
const PUNCH_LOG = path.join(CONFIG_DIR, 'punch-log.json');

const SLACK_CHANNEL = process.env.JOBCAN_SLACK_CHANNEL || 'CCNT2V95W';
const BW_ITEM = process.env.JOBCAN_BW_ITEM || 'jobcan';
const KEYCHAIN_SERVICE = process.env.JOBCAN_KEYCHAIN_SERVICE || 'jobcan-cli';
// 打刻UIがあるのはマイページ。/employee/attendance は出勤簿で、打刻ボタンは無い。
const MYPAGE_URL = 'https://ssl.jobcan.jp/employee';

// 勤怠ページを未ログインで開くと会社を特定できず、「スタッフマイページログイン」
// (ssl.jobcan.jp/login/pc-employee-global) という別系統の認証画面に落ちる。そこは
// 勤怠会社IDが必須で、共通IDを使う会社の認証情報では通らない（通らないことを実機で確認済み）。
// 会社IDを載せたこの入口から入ると「ジョブカン共通ID」(id.jobcan.jp) に案内され、
// そこが普段ブラウザで使っている画面と同じになる。
const companyLoginUrl = (companyId) =>
  `https://ssl.jobcan.jp/login/pc-employee/?client_id=${encodeURIComponent(companyId)}`;

const isLoginPage = (url) => url.includes('id.jobcan.jp') || url.includes('/login/');

const DEFAULT_TIME = '1730';
const DEFAULT_PLACE = 'remote';
const PLACE_LABEL = { remote: '在宅', office: '出社' };

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = {
    command: 'start',
    time: DEFAULT_TIME,
    place: DEFAULT_PLACE,
    dryRun: false,
    post: true,
    punch: null, // null = サブコマンドごとの既定に従う
    headed: false,
    force: false,
  };
  const rest = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    // -time / --time どちらも受ける
    const flag = arg.replace(/^--?/, '');
    if (!arg.startsWith('-')) {
      rest.push(arg);
      continue;
    }
    switch (flag) {
      case 'time': opts.time = argv[++i]; break;
      case 'place': opts.place = argv[++i]; break;
      case 'dry-run': opts.dryRun = true; break;
      case 'no-post': opts.post = false; break;
      case 'no-punch': opts.punch = false; break;
      case 'punch': opts.punch = true; break;
      case 'headed': opts.headed = true; break;
      case 'force': opts.force = true; break;
      case 'h': case 'help': opts.command = 'help'; return opts;
      default: fail(`不明なオプション: ${arg}`);
    }
  }

  if (rest.length > 1) fail(`サブコマンドは1つだけ指定してください: ${rest.join(' ')}`);
  if (rest.length === 1) opts.command = rest[0];
  return opts;
}

function normalizeTime(value) {
  const m = String(value).match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) fail(`--time の形式が不正です: ${value}（例: 1730 / 17:30）`);
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) fail(`--time の値が不正です: ${value}`);
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

function normalizePlace(value) {
  if (!PLACE_LABEL[value]) fail(`--place は remote か office を指定してください: ${value}`);
  return value;
}

// ---------------------------------------------------------------- messages

function buildMessage(opts) {
  switch (opts.command) {
    case 'start': {
      const place = PLACE_LABEL[normalizePlace(opts.place)];
      const time = normalizeTime(opts.time);
      return `おはようございます。\n本日は以下の時間で勤務します。\n${place}　~${time}頃`;
    }
    case 'arrived': return '出社しました。\n業務開始します。';
    case 'lunch': return 'お昼入ります';
    case 'back': return '戻りました';
    case 'bye': return 'お先に失礼します';
    default: return null;
  }
}

// サブコマンドごとの打刻の既定。
// lunch / back に打刻が無いのは実装漏れではない。ジョブカンは打刻区分を自動判別し
// （PUSH は set_value('DEF')、打刻修正画面にも「打刻区分は自動で判別されます」）、
// 休憩を選ぶ手段が無い。勤務中に打刻すると退勤になるため、休憩は Slack 投稿だけにする。
const PUNCH_BY_DEFAULT = { start: true, arrived: true, bye: true, lunch: false, back: false };
const PUNCH_UNAVAILABLE = new Set(['lunch', 'back']);

// ---------------------------------------------------------------- slack

function slackToken() {
  if (process.env.SLACK_USER_TOKEN) return process.env.SLACK_USER_TOKEN;

  // Claude Code の MCP 設定に入っているユーザートークンを流用する
  const fallback = path.join(homedir(), '.claude', 'settings.local.json');
  if (existsSync(fallback)) {
    try {
      const json = JSON.parse(readFileSync(fallback, 'utf8'));
      const token = json?.mcpServers?.slack?.env?.SLACK_BOT_TOKEN;
      if (token) return token;
    } catch { /* 壊れていたら下の fail に落ちる */ }
  }
  fail('Slack トークンが見つかりません。SLACK_USER_TOKEN を設定してください。');
}

async function postToSlack(text) {
  const token = slackToken();
  if (!token.startsWith('xoxp-')) {
    fail('Slack トークンがユーザートークン (xoxp-) ではありません。本人名義で投稿できません。');
  }
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
  });
  const body = await res.json();
  if (!body.ok) fail(`Slack への投稿に失敗しました: ${body.error}`);
  return body.ts;
}

// 投稿が本人名義になるかはトークンの素性で決まる。アプリに属するトークンだと
// Slack 側で bot_id / app_id が付き、画面上は「APP」バッジ付きの別人格に見える。
// トークン本体は出さず、素性だけを表示する。
async function slackWhoAmI() {
  const token = slackToken();
  const res = await fetch('https://slack.com/api/auth.test', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body.ok) fail(`Slack の auth.test に失敗しました: ${body.error}`);
  log(`トークン種別: ${token.slice(0, 5)}…`);
  log(`ユーザー: ${body.user} (${body.user_id})`);
  log(`チーム: ${body.team} (${body.team_id})`);
  log(`アプリ: ${body.bot_id ? `bot_id=${body.bot_id}` : 'なし'}${body.app_id ? ` / app_id=${body.app_id}` : ''}`);
  log(body.bot_id
    ? '→ このトークンはアプリに紐づいています。投稿には bot 名義が付きます。'
    : '→ 本人名義で投稿されます。');
}

// ---------------------------------------------------------------- bitwarden

function bwSession() {
  if (process.env.BW_SESSION) {
    const status = spawnSync('bw', ['status', '--session', process.env.BW_SESSION], { encoding: 'utf8' });
    if (status.status === 0 && status.stdout.includes('"unlocked"')) return process.env.BW_SESSION;
  }

  const status = spawnSync('bw', ['status'], { encoding: 'utf8' });
  if (status.stdout?.includes('"unauthenticated"')) {
    fail(
      'Bitwarden CLI がログアウト状態です（トークンの期限切れ）。`bw login` でログインし直してください。\n' +
      'Bitwarden を経由せず直接登録する場合は `jobcan set-credential` が使えます。'
    );
  }

  log('Bitwarden がロックされています。マスターパスワードを入力してください。');
  const unlock = spawnSync('bw', ['unlock', '--raw'], { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
  if (unlock.status !== 0 || !unlock.stdout.trim()) {
    fail('Bitwarden のアンロックに失敗しました。`bw login` からやり直すか、`jobcan set-credential` で直接登録してください。');
  }
  return unlock.stdout.trim();
}

function credentialsFromBitwarden() {
  const session = bwSession();
  const res = spawnSync('bw', ['get', 'item', BW_ITEM, '--session', session], { encoding: 'utf8' });
  if (res.status !== 0) {
    fail(`Bitwarden から "${BW_ITEM}" を取得できませんでした。JOBCAN_BW_ITEM で項目名を指定してください。\n${res.stderr.trim()}`);
  }
  const item = JSON.parse(res.stdout);
  const username = item?.login?.username;
  const password = item?.login?.password;
  if (!username || !password) fail(`Bitwarden の "${BW_ITEM}" にユーザー名かパスワードがありません。`);

  // 勤怠会社ID はカスタムフィールドに入っていることがある
  const field = (item?.fields || []).find((f) => /会社\s*ID|company/i.test(f?.name || ''));
  return { companyId: field?.value || '', username, password };
}

// ------------------------------------------------------------ keychain cache
// ジョブカンのセッションは30分程度で切れるため、実行のたびに再ログインが必要になる。
// 毎回 Bitwarden のマスターパスワードを求められないよう、macOS Keychain に複製を置く。
// Bitwarden が「正」で、パスワードを変えたら `jobcan sync-credential` で入れ直す。

function credentialsFromKeychain() {
  const res = spawnSync('security', ['find-generic-password', '-w', '-s', KEYCHAIN_SERVICE], { encoding: 'utf8' });
  if (res.status !== 0) return null;
  try {
    const json = JSON.parse(Buffer.from(res.stdout.trim(), 'base64').toString('utf8'));
    return json.username && json.password ? json : null;
  } catch {
    return null;
  }
}

function saveCredentialsToKeychain({ companyId = '', username, password }) {
  const payload = Buffer.from(JSON.stringify({ companyId, username, password })).toString('base64');
  const res = spawnSync('security', [
    'add-generic-password', '-s', KEYCHAIN_SERVICE, '-a', username,
    '-w', payload, '-T', '/usr/bin/security', '-U',
  ], { encoding: 'utf8' });
  if (res.status !== 0) fail(`Keychain への保存に失敗しました: ${res.stderr.trim()}`);
}

function jobcanCredentials() {
  const cached = credentialsFromKeychain();
  if (cached) return cached;

  log('Keychain にジョブカンの認証情報がありません。Bitwarden から取り込みます。');
  const creds = credentialsFromBitwarden();
  saveCredentialsToKeychain(creds);
  log(`Keychain に保存しました（サービス名: ${KEYCHAIN_SERVICE}）。次回からは入力不要です。`);
  return creds;
}

function syncCredential() {
  const creds = credentialsFromBitwarden();
  saveCredentialsToKeychain(creds);
  log(`Bitwarden の "${BW_ITEM}" を Keychain（${KEYCHAIN_SERVICE}）に反映しました。`);
}

// readline（terminal: true）は入力行を自前で再描画するため、直前に stdout へ書いた
// 質問文が消える。ここでは readline を使わず raw モードで1行ずつ読む。
let pipeBuffer = '';
let pipeEnded = false;

function promptLine(question, { echo = true } = {}) {
  const stdin = process.stdin;
  process.stdout.write(question);

  if (!stdin.isTTY) {
    // パイプ入力（テストなど）。1チャンクに複数行来るので、余りを持ち越す
    return new Promise((resolve) => {
      const take = () => {
        const index = pipeBuffer.indexOf('\n');
        if (index === -1) return null;
        const line = pipeBuffer.slice(0, index);
        pipeBuffer = pipeBuffer.slice(index + 1);
        return line;
      };
      const done = (line) => {
        process.stdout.write(echo ? `${line}\n` : '\n');
        resolve(line.trim());
      };

      const buffered = take();
      if (buffered !== null) return done(buffered);
      if (pipeEnded) return done(pipeBuffer.replace(/\n$/, ''));

      stdin.setEncoding('utf8');
      stdin.resume();
      const onData = (chunk) => {
        pipeBuffer += chunk;
        const line = take();
        if (line === null) return;
        stdin.removeListener('data', onData);
        stdin.removeListener('end', onEnd);
        stdin.pause();
        done(line);
      };
      const onEnd = () => {
        pipeEnded = true;
        stdin.removeListener('data', onData);
        const rest = pipeBuffer;
        pipeBuffer = '';
        done(rest);
      };
      stdin.on('data', onData);
      stdin.once('end', onEnd);
    });
  }

  return new Promise((resolve) => {
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();

    let answer = '';
    const finish = (value, code) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(wasRaw);
      stdin.pause();
      process.stdout.write('\n');
      if (code !== undefined) process.exit(code);
      resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n' || char === '\u0004') return finish(answer.trim());
        if (char === '\u0003') return finish('', 130); // Ctrl-C
        if (char === '\u007f' || char === '\b') {
          if (answer.length === 0) continue;
          answer = answer.slice(0, -1);
          if (echo) process.stdout.write('\b \b');
          continue;
        }
        answer += char;
        if (echo) process.stdout.write(char);
      }
    };
    stdin.on('data', onData);
  });
}

async function setCredential() {
  // 項目が増えたときに全部を打ち直さずに済むよう、登録済みの値は Enter で引き継げるようにする
  const current = credentialsFromKeychain() || {};
  log('ジョブカンの認証情報を Keychain に登録します。');
  log('勤怠会社ID はスタッフマイページのログイン画面に表示される項目です。');
  if (current.username) log('登録済みの項目は、何も入力せず Enter を押すとそのまま残ります。');

  const ask = async (label, key, { echo = true } = {}) => {
    const kept = current[key];
    const input = await promptLine(`${label}${kept ? '（Enter で現在の登録を維持）' : ''}: `, { echo });
    return input || kept || '';
  };

  const companyId = await ask('勤怠会社ID', 'companyId');
  const username = await ask('メールアドレスまたはスタッフコード', 'username');
  const password = await ask('パスワード（表示されません）', 'password', { echo: false });
  if (!companyId || !username || !password) fail('入力が空です。');
  saveCredentialsToKeychain({ companyId, username, password });
  log(`Keychain に保存しました（サービス名: ${KEYCHAIN_SERVICE}）。`);
}

function forgetCredential() {
  const res = spawnSync('security', ['delete-generic-password', '-s', KEYCHAIN_SERVICE], { encoding: 'utf8' });
  log(res.status === 0
    ? `Keychain から ${KEYCHAIN_SERVICE} を削除しました。`
    : `Keychain に ${KEYCHAIN_SERVICE} はありませんでした。`);
}

// ---------------------------------------------------------------- jobcan

async function withBrowser(opts, fn) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: !opts.headed });
  const context = await browser.newContext({
    storageState: existsSync(STATE_FILE) ? STATE_FILE : undefined,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  });
  try {
    return await fn(context);
  } finally {
    await context.storageState({ path: STATE_FILE });
    chmodSync(STATE_FILE, 0o600);
    await browser.close();
  }
}

async function signIn(page) {
  const { companyId, username, password } = jobcanCredentials();
  if (!companyId) {
    fail('勤怠会社ID が登録されていません。`jobcan set-credential` で登録し直してください。');
  }
  log('ジョブカンにログインします。');

  // どこに流れ着いていても、会社IDを載せた入口から入り直して共通IDの画面に揃える
  if (!page.url().includes('id.jobcan.jp')) {
    await page.goto(companyLoginUrl(companyId), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
  }
  if (!page.url().includes('id.jobcan.jp')) {
    fail(`共通IDのログイン画面に到達できませんでした（現在地: ${page.url()}）。`);
  }

  // 会社IDは任意項目だが、スタッフコードで入るときの会社の取り違えを防ぐために入れる
  await page.locator('#user_email').fill(username);
  await page.locator('#user_client_code').fill(companyId).catch(() => {});
  await page.locator('#user_password').fill(password);
  // セッションを長持ちさせ、認証情報を読む回数を減らす
  await page.locator('#save_sign_in_information').check().catch(() => {});
  await page.locator('#login_button').click();
  await page.waitForLoadState('networkidle');

  if (isLoginPage(page.url())) {
    const notice = await page.locator('p, .alert, .error, [class*=error]').filter({ hasText: /エラー|誤り|失敗|ロック/ })
      .first().textContent().catch(() => null);
    fail(
      `ログインできませんでした。${notice ? `画面の表示: ${notice.trim()}` : ''}\n` +
      'メールアドレス・パスワードを確認するか、二要素認証や SSO がある場合は\n' +
      '`jobcan login` でブラウザから手動ログインしてください。'
    );
  }
}

async function openMyPage(context) {
  const page = await context.newPage();
  await page.goto(MYPAGE_URL, { waitUntil: 'domcontentloaded' });
  if (isLoginPage(page.url())) {
    await signIn(page);
    await page.goto(MYPAGE_URL, { waitUntil: 'domcontentloaded' });
    if (isLoginPage(page.url())) fail('ログイン後もマイページを開けませんでした。');
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  return page;
}

// 画面に出ている勤務状態。「未出勤」「勤務中」など。打刻の成否と二重打刻の判定に使う。
async function workingStatus(page) {
  return (await page.locator('#working_status').textContent().catch(() => null))?.trim() || null;
}

const NOT_WORKING = '未出勤';

async function punch(opts, kind) {
  return withBrowser(opts, async (context) => {
    const page = await openMyPage(context);

    // ローカルの記録ではなくジョブカンの画面を正として二重打刻を防ぐ。
    // 打刻区分はジョブカン側の自動判別なので、勤務中に押すと退勤になってしまう。
    const before = await workingStatus(page);
    if (before === null) fail('勤務状態を読み取れませんでした。画面構成が変わった可能性があります。');
    const mismatched = kind === 'in' ? before !== NOT_WORKING : before === NOT_WORKING;
    if (mismatched && !opts.force) {
      fail(
        `ジョブカンの勤務状態は「${before}」です。${kind === 'in' ? '出勤' : '退勤'}打刻は実行しません。\n` +
        '打刻区分は自動判別のため、この状態で打刻すると意図と違う区分になります。' +
        'それでも実行するには --force を付けてください。'
      );
    }

    const button = page.locator('#adit-button-push');
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();

    // 打刻が通れば勤務状態の表示が変わる。変わらなければ打てていない
    try {
      await page.waitForFunction(
        (prev) => document.querySelector('#working_status')?.textContent.trim() !== prev,
        before,
        { timeout: 15000 },
      );
    } catch {
      fail(`打刻を押しましたが勤務状態が「${before}」のまま変わりませんでした。ジョブカンの画面を確認してください。`);
    }

    const after = await workingStatus(page);
    recordPunch(kind);
    log(`ジョブカンで打刻しました（${kind}）。勤務状態: ${before} → ${after}`);
  });
}

async function inspect(opts) {
  return withBrowser(opts, async (context) => {
    const page = await openMyPage(context);
    const info = await page.evaluate(() => {
      const text = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
      const area = document.querySelector('#adit-control-area');
      return {
        url: location.href,
        workingStatus: text(document.querySelector('#working_status')),
        punchButton: !!document.querySelector('#adit-button-push'),
        // 打刻エリアのコントロールだけを見る。年月のプルダウン等は関係ない
        controls: [...(area?.querySelectorAll('input:not([type=hidden]), select, textarea, button') || [])]
          .map((el) => ({
            tag: el.tagName.toLowerCase(), type: el.type, id: el.id, name: el.name,
            label: text(document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || text(el),
            options: el.options ? [...el.options].map((o) => `${o.value}:${text(o)}`) : undefined,
          })),
      };
    });
    console.log(JSON.stringify(info, null, 2));
  });
}

async function loginInteractively() {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext({ locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
  const page = await context.newPage();
  const { companyId } = credentialsFromKeychain() || {};
  await page.goto(companyId ? companyLoginUrl(companyId) : MYPAGE_URL);
  log('ブラウザでログインしてください。勤怠ページまで進んだら、このまま待っていればセッションを保存します。');
  // ログイン画面自体も ssl.jobcan.jp なので、勤怠ページに到達するまで待つ
  await page.waitForURL(/ssl\.jobcan\.jp\/employee/, { timeout: 5 * 60 * 1000 });
  await context.storageState({ path: STATE_FILE });
  chmodSync(STATE_FILE, 0o600);
  await browser.close();
  log(`セッションを保存しました: ${STATE_FILE}`);
}

// ---------------------------------------------------------------- 二重打刻ガード

function today() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

function readPunchLog() {
  if (!existsSync(PUNCH_LOG)) return {};
  try { return JSON.parse(readFileSync(PUNCH_LOG, 'utf8')); } catch { return {}; }
}

function recordPunch(kind) {
  const logData = readPunchLog();
  logData[today()] = [...new Set([...(logData[today()] || []), kind])];
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(PUNCH_LOG, JSON.stringify(logData, null, 2));
}

function alreadyPunched(kind) {
  return (readPunchLog()[today()] || []).includes(kind);
}

// ---------------------------------------------------------------- helpers

function log(message) { console.log(message); }
function fail(message) { console.error(`エラー: ${message}`); process.exit(1); }

const HELP = `使い方: jobcan [サブコマンド] [オプション]

サブコマンド
  (なし)     出勤連絡 + 出勤打刻
  arrived    「出社しました。業務開始します。」+ 出勤打刻
  lunch      「お昼入ります」（投稿のみ。ジョブカンに休憩打刻は無い）
  back       「戻りました」（投稿のみ）
  bye        「お先に失礼します」+ 退勤打刻
  login      ブラウザを開いて手動ログインし、セッションを保存
  inspect    マイページの打刻UIと現在の勤務状態を表示（打刻しない）
  whoami     Slack トークンの素性を表示（本人名義で投稿されるかの確認）

認証情報
  sync-credential    Bitwarden の認証情報を Keychain に取り込む（初回/パスワード変更時）
  set-credential     Keychain に直接入力して登録する（Bitwarden を使わない場合）
  forget-credential  Keychain から認証情報を削除する

オプション
  --time HHMM     退勤予定時刻（既定 ${DEFAULT_TIME}）
  --place PLACE   remote | office（既定 ${DEFAULT_PLACE}）
  --dry-run       投稿も打刻もせず、内容だけ表示
  --no-post       Slack に投稿しない（打刻のみ）
  --no-punch      打刻しない（投稿のみ）
  --headed        ブラウザを表示する
  --force         同じ打刻を当日2回目でも実行する`;

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.command === 'help') { console.log(HELP); return; }
  if (opts.command === 'login') { await loginInteractively(); return; }
  if (opts.command === 'inspect') { await inspect(opts); return; }
  if (opts.command === 'whoami') { await slackWhoAmI(); return; }
  if (opts.command === 'sync-credential') { syncCredential(); return; }
  if (opts.command === 'set-credential') { await setCredential(); return; }
  if (opts.command === 'forget-credential') { forgetCredential(); return; }

  const message = buildMessage(opts);
  if (message === null) fail(`不明なサブコマンド: ${opts.command}`);

  const punchKind = opts.command === 'bye' ? 'out' : 'in';
  const shouldPunch = opts.punch === null ? PUNCH_BY_DEFAULT[opts.command] : opts.punch;

  if (shouldPunch && PUNCH_UNAVAILABLE.has(opts.command)) {
    fail(
      `${opts.command} では打刻できません。ジョブカンは打刻区分を自動判別するため、\n` +
      '休憩として打刻する手段がなく、勤務中に打刻すると退勤扱いになります。'
    );
  }

  if (opts.dryRun) {
    log(`[dry-run] Slack (${SLACK_CHANNEL}) に投稿する内容:`);
    log(message.split('\n').map((line) => `  | ${line}`).join('\n'));
    log(`[dry-run] ジョブカンの打刻: ${shouldPunch ? punchKind : 'なし'}`);
    return;
  }

  if (shouldPunch && alreadyPunched(punchKind) && !opts.force) {
    fail(`本日はすでに ${punchKind} の打刻を記録しています。実行するには --force を付けてください。`);
  }

  if (shouldPunch) await punch(opts, punchKind);
  if (opts.post) {
    const ts = await postToSlack(message);
    log(`Slack に投稿しました (ts=${ts})。`);
  }
}

main().catch((error) => fail(error?.stack || String(error)));
