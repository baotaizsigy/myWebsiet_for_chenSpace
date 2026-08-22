// build.js
const fs = require('fs');
const path = require('path');

// 读取 Cloudflare Pages 注入的环境变量
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ 缺少环境变量，请在 Cloudflare Pages 设置中配置');
    process.exit(1);
}

console.log('✅ 环境变量读取成功');
console.log(`  URL: ${supabaseUrl}`);
console.log(`  KEY: ${supabaseAnonKey.substring(0, 25)}...`);

// 读取 login.html
const filePath = path.join(__dirname, 'login.html');
let html = fs.readFileSync(filePath, 'utf8');

// 替换占位符
html = html.replace(/___PUBLIC_SUPABASE_URL___/g, supabaseUrl);
html = html.replace(/___PUBLIC_SUPABASE_ANON_KEY___/g, supabaseAnonKey);

fs.writeFileSync(filePath, html);
console.log('✅ login.html 已更新！');