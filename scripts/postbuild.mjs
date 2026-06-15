import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const indexPath = resolve('dist', 'index.html');
let html = readFileSync(indexPath, 'utf-8');

// 移除 type="module"
html = html.replace(/ type="module"/g, '');
// 移除 crossorigin 属性
html = html.replace(/ crossorigin/g, '');
// 给 script 标签添加 defer，确保 DOM 加载完成后再执行
html = html.replace(/<script src="/g, '<script defer src="');

writeFileSync(indexPath, html, 'utf-8');

// 复制启动脚本到 dist 目录
import { copyFileSync, chmodSync } from 'fs';
const launcherSrc = resolve('scripts', '打开菜单管家.command');
const launcherDst = resolve('dist', '打开菜单管家.command');
try {
  copyFileSync(launcherSrc, launcherDst);
  chmodSync(launcherDst, 0o755);
} catch(e) { /* 如果源文件不存在则跳过 */ }

console.log('✅ post-build: 已处理，双击「打开菜单管家.command」即可使用');
