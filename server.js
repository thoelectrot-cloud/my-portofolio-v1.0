require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');

app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const mailer = process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again in a few minutes.' },
});

function saveMessage(entry) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (_) {}
  list.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

app.post('/api/contact', limiter, async (req, res) => {
  const { name = '', email = '', message = '', website = '' } = req.body || {};

  // Honeypot: real visitors never fill this hidden field.
  if (website) return res.json({ ok: true });

  const n = String(name).trim(), e = String(email).trim(), m = String(message).trim();
  if (!n || n.length > 100) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200)
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (m.length < 5 || m.length > 3000)
    return res.status(400).json({ error: 'Your message must be between 5 and 3000 characters.' });

  const entry = { id: Date.now().toString(36), name: n, email: e, message: m, date: new Date().toISOString() };
  try { saveMessage(entry); }
  catch (err) { console.error('Could not save message:', err); return res.status(500).json({ error: 'Could not save your message. Please try again.' }); }

  if (mailer) {
    try {
      await mailer.sendMail({
        from: `"Portfolio" <${process.env.SMTP_USER}>`,
        to: process.env.TO_EMAIL || process.env.SMTP_USER,
        replyTo: `"${n.replace(/["\r\n]/g, '')}" <${e}>`,
        subject: `Portfolio message from ${n.replace(/[\r\n]/g, ' ')}`,
        text: `From: ${n} <${e}>\n\n${m}`,
      });
    } catch (err) {
      console.error('Email failed (message was still saved):', err.message);
    }
  }
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
