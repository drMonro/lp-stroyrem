/* eslint-disable no-console */

const nodemailer = require('nodemailer');

const CAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

const mailer = nodemailer.createTransport({
    host: 'postbox.cloud.yandex.net',
    port: 465,
    secure: true,
    auth: {
        user: process.env.POSTBOX_API_KEY_ID,
        pass: process.env.POSTBOX_API_KEY_SECRET,
    },
});

const response = (statusCode, body, origin) => ({
    statusCode,
    headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Origin': origin,
        'Content-Type': 'application/json; charset=utf-8',
        Vary: 'Origin',
    },
    body: JSON.stringify(body),
});

const parseBody = (event) => {
    const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : event.body || '{}';

    return JSON.parse(rawBody);
};

const formatMessage = (data) => {
    const fields = ['Имя', 'Телефон', 'e-mail', 'Услуга', 'Комментарий', 'placement'];
    const lines = [`Новая заявка с сайта «${data.project_name || 'СтройРемонт24'}»`];

    for (const field of fields) {
        const value = String(data[field] || '').trim();
        if (value) lines.push(`${field}: ${value}`);
    }

    return lines.join('\n');
};

module.exports.handler = async(event) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    const requestOrigin = event.headers?.origin || event.headers?.Origin || '';
    const method = event.httpMethod || event.requestContext?.http?.method;

    if (!allowedOrigin || requestOrigin !== allowedOrigin) {
        return response(403, { error: 'Origin is not allowed' }, allowedOrigin || 'null');
    }

    if (method === 'OPTIONS') return response(204, {}, allowedOrigin);
    if (method !== 'POST') return response(405, { error: 'Method not allowed' }, allowedOrigin);

    try {
        const data = parseBody(event);
        const phone = String(data['Телефон'] || '').replace(/\D/g, '');
        const captchaToken = data['h-captcha-response'];

        if (phone.length !== 11 || !captchaToken) {
            return response(400, { error: 'Invalid form data' }, allowedOrigin);
        }

        const captchaBody = new URLSearchParams({
            secret: process.env.HCAPTCHA_SECRET || '',
            response: captchaToken,
        });
        const captchaResponse = await fetch(CAPTCHA_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: captchaBody,
        });
        const captchaResult = await captchaResponse.json();

        if (!captchaResult.success) {
            return response(403, { error: 'hCaptcha verification failed' }, allowedOrigin);
        }

        await mailer.sendMail({
            from: process.env.FROM_EMAIL,
            to: process.env.TO_EMAIL,
            replyTo: String(data['e-mail'] || '').trim() || undefined,
            subject: String(data.form_subject || 'Новая заявка с сайта').slice(0, 200),
            text: formatMessage(data),
        });

        return response(200, { ok: true }, allowedOrigin);
    } catch(error) {
        console.error(error);
        return response(500, { error: 'Failed to submit form' }, allowedOrigin);
    }
};
