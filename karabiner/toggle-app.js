// 使い方: osascript -l JavaScript toggle-app.js <bundle id> [--dry-run]
// 画面の一番上のウィンドウが <bundle id> のアプリなら隠し、そうでなければ開く（前に出す）。
// Raycast の「手前なら隠す」は macOS の「手前のアプリ」を見るが、Chrome アプリ（MulmoTerminal 等）を
// 使っているときに macOS が Chrome 本体を手前と取り違えるため、ここでは実際に一番上にある
// ウィンドウの持ち主で判定する。Karabiner の左⌥+S / 左⌥+D から呼ぶ。
ObjC.import('AppKit');
ObjC.import('CoreGraphics');

function topWindowPid() {
  const opts = $.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements;
  const list = ObjC.castRefToObject($.CGWindowListCopyWindowInfo(opts, $.kCGNullWindowID));
  const n = list.count;
  for (let i = 0; i < n; i++) {
    const w = list.objectAtIndex(i);
    if (w.objectForKey('kCGWindowLayer').intValue !== 0) continue;
    const owner = ObjC.unwrap(w.objectForKey('kCGWindowOwnerName')) || '';
    if (owner === 'Window Server' || owner === 'Dock') continue;
    const b = w.objectForKey('kCGWindowBounds');
    if (b.objectForKey('Width').doubleValue < 100 || b.objectForKey('Height').doubleValue < 100) continue;
    return w.objectForKey('kCGWindowOwnerPID').intValue;
  }
  return 0;
}

function run(argv) {
  const target = argv[0];
  const dry = argv.includes('--dry-run');
  if (!target) return 'bundle id を指定してください';
  const pid = topWindowPid();
  const app = pid ? $.NSRunningApplication.runningApplicationWithProcessIdentifier(pid) : null;
  const topId = app ? ObjC.unwrap(app.bundleIdentifier) : null;
  if (topId === target) {
    if (dry) return `hide pid=${pid} (${topId})`;
    app.hide;
    return 'hidden';
  }
  if (dry) return `open ${target} (top=${topId} pid=${pid})`;
  const app2 = Application.currentApplication();
  app2.includeStandardAdditions = true;
  app2.doShellScript('/usr/bin/open -b ' + target);
  return 'opened';
}
