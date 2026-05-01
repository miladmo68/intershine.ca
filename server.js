'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const validator = require('validator');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const MAIL_TO = process.env.MAIL_TO || 'info@intershine.ca';
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@intershine.ca';

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in a few minutes.',
  },
});

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeText(str, maxLen) {
  if (str === undefined || str === null) return '';
  let s = String(str).replace(/[\r\n\t]+/g, ' ').trim();
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function sanitizeMultiline(str, maxLen) {
  if (str === undefined || str === null) return '';
  let s = String(str).replace(/\r\n/g, '\n').trim();
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function normalizeDays(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const allowed = new Set([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ]);
  const out = [];
  for (const v of arr) {
    const s = sanitizeText(v, 12);
    if (allowed.has(s) && !out.includes(s)) out.push(s);
  }
  return out;
}

app.post('/api/booking', bookingLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    const honeypot = sanitizeText(body.website || body.url_field || '', 200);
    if (honeypot) {
      return res.status(200).json({ success: true, message: 'Thank you.' });
    }

    const service  = sanitizeText(body.service,  120);
    const area     = sanitizeText(body.area,     40);
    const date     = sanitizeText(body.date,     20);
    const days     = normalizeDays(body.days);
    const company  = sanitizeText(body.company,  120);
    const contact  = sanitizeText(body.contact,  120);
    const street   = sanitizeText(body.street,   200);
    const postcode = sanitizeText(body.postcode, 60);
    const phone    = sanitizeText(body.phone,    40);
    const email    = sanitizeText(body.email,    160).toLowerCase();
    const message  = sanitizeMultiline(body.message, 4000);

    const errors = {};

    if (!contact) errors.contact = 'Please enter your full name.';
    if (!service) errors.service = 'Please select a service or package.';
    if (!street)   errors.street   = 'Please enter your street address.';
    if (!postcode) errors.postcode = 'Please enter your postcode or town.';

    if (!email && !phone) {
      errors.email = 'Please provide an email address or phone number.';
      errors.phone = 'Please provide an email address or phone number.';
    }

    if (email && !validator.isEmail(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        errors.phone = 'Please enter a valid phone number.';
      }
    }

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !validator.isDate(date)) {
        errors.date = 'Please enter a valid date.';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const picked = new Date(date + 'T00:00:00');
        if (picked < today) errors.date = 'Please select today or a future date.';
      }
    }

    if (area && !/^[\d.,\s]{1,12}$/.test(area)) {
      errors.area = 'Please enter a numeric area in square feet.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Some fields need your attention.',
        errors,
      });
    }

    const tx = getTransporter();
    if (!tx) {
      console.error('[booking] SMTP not configured (missing SMTP_HOST/USER/PASS).');
      return res.status(500).json({
        success: false,
        message: 'Our booking system is temporarily unavailable. Please call us or try again shortly.',
      });
    }

    const lines = [
      ['Service / Package', service],
      ['Area (sq ft)',      area],
      ['Preferred Date',    date],
      ['Preferred Days',    days.join(', ')],
      ['Company',           company],
      ['Contact Person',    contact],
      ['Street Address',    street],
      ['Postcode / Town',   postcode],
      ['Phone',             phone],
      ['Email',             email],
      ['Message',           message],
    ];

    const textBody =
      'New booking request from intershine.ca\n' +
      '----------------------------------------\n' +
      lines.map(([k, v]) => k + ': ' + (v || '-')).join('\n') +
      '\n';

    const htmlRows = lines
      .map(
        ([k, v]) =>
          '<tr>' +
            '<td style="padding:6px 12px;background:#f4f6f8;font-weight:600;vertical-align:top;white-space:nowrap;">' +
              escapeHtml(k) +
            '</td>' +
            '<td style="padding:6px 12px;vertical-align:top;">' +
              (v ? escapeHtml(v).replace(/\n/g, '<br>') : '<span style="color:#999">&mdash;</span>') +
            '</td>' +
          '</tr>'
      )
      .join('');

    const htmlBody =
      '<div style="font-family:Arial,sans-serif;color:#222;max-width:640px;">' +
        '<h2 style="color:#046e90;margin:0 0 12px;">New booking request</h2>' +
        '<p style="margin:0 0 16px;color:#555;">Submitted via intershine.ca</p>' +
        '<table style="border-collapse:collapse;width:100%;font-size:14px;border:1px solid #e6e9ec;">' +
          htmlRows +
        '</table>' +
      '</div>';

    const mailOptions = {
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: 'New booking request — ' + (contact || 'Website') + (service ? ' (' + service + ')' : ''),
      text: textBody,
      html: htmlBody,
      replyTo: email || undefined,
    };

    try {
      await tx.sendMail(mailOptions);
    } catch (err) {
      console.error('[booking] sendMail failed:', err && err.message);
      return res.status(502).json({
        success: false,
        message: 'We could not send your request right now. Please try again or call us directly.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your booking request has been received. We will contact you within 24 hours.',
    });
  } catch (err) {
    console.error('[booking] unexpected error:', err && err.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again shortly.',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: NODE_ENV });
});

app.use(
  express.static(path.join(__dirname), {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
      if (/\.(woff2?|jpg|jpeg|png|gif|svg|ico)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
      }
    },
  })
);

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('Intershine server running on http://localhost:' + PORT + ' (' + NODE_ENV + ')');
  if (!getTransporter()) {
    console.warn('⚠  SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable email.');
  }
});
