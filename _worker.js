const HELP_TEXT = `
📌 使用说明：
直接发送一个 https:// 开头的链接 → 添加保活站点

命令：
/list   查看当前所有保活站点
/remove <url>  删除指定站点
/check  手动立即检测一次
/help   查看帮助
`;

function isValidUrl(text) {
  return /^https?:\/\/[^\s]+$/i.test(text);
}

async function sendTG(env, text) {
  await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TG_CHAT_ID,
      text
    })
  });
}

async function runCheck(env, isManual = false) {
  const list = await env.KV.list();
  if (list.keys.length === 0) {
    if (isManual) {
      await sendTG(env, '📭 当前没有任何保活站点');
    }
    return;
  }

  let ok = [];
  let failed = [];

  for (const k of list.keys) {
    try {
      const res = await fetch(k.name, { cf: { timeout: 20 } });
      if (res.ok) {
        ok.push(`${k.name} → ${res.status}`);
      } else {
        failed.push(`${k.name} → ${res.status}`);
      }
    } catch (e) {
      failed.push(`${k.name} → ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }

  if (isManual) {
    let msg = failed.length === 0
      ? '🟢 手动检测完成（全部正常）\n\n'
      : '🔴 手动检测完成（发现问题）\n\n';

    ok.forEach(v => msg += `✅ ${v}\n`);
    failed.forEach(v => msg += `❌ ${v}\n`);

    msg += `\n⏱ 检测时间：${new Date().toLocaleString('zh-CN')}`;
    await sendTG(env, msg);
    return;
  }

  if (failed.length > 0) {
    let msg = '❌ 定时检测发现异常：\n\n';
    failed.forEach(v => msg += `❌ ${v}\n`);
    await sendTG(env, msg);
  }
}

export default {
  async fetch(req, env) {
    if (req.method !== 'POST') return new Response('OK');

    const update = await req.json();
    if (!update.message) return new Response('OK');

    const chatId = update.message.chat.id.toString();
    if (chatId !== env.TG_CHAT_ID) return new Response('OK');

    const text = (update.message.text || '').trim();

    if (text === '/help') {
      await sendTG(env, HELP_TEXT);
      return new Response('OK');
    }

    if (text === '/list') {
      const list = await env.KV.list();
      if (list.keys.length === 0) {
        await sendTG(env, '📭 当前没有任何保活站点');
      } else {
        let msg = '📌 当前保活站点：\n\n';
        list.keys.forEach((k, i) => msg += `${i + 1}. ${k.name}\n`);
        await sendTG(env, msg);
      }
      return new Response('OK');
    }

    if (text.startsWith('/remove')) {
      const url = text.replace('/remove', '').trim();
      if (!isValidUrl(url)) {
        await sendTG(env, '❌ URL 格式不正确');
      } else {
        await env.KV.delete(url);
        await sendTG(env, `🗑 已删除：\n${url}`);
      }
      return new Response('OK');
    }

    if (text === '/check') {
      await runCheck(env, true);
      return new Response('OK');
    }

    if (isValidUrl(text)) {
      await env.KV.put(text, '1');
      await sendTG(env, `✅ 已添加保活站点：\n${text}`);
      return new Response('OK');
    }

    await sendTG(env, HELP_TEXT);
    return new Response('OK');
  },

  async scheduled(event, env) {
    await runCheck(env, false);
  }
};
