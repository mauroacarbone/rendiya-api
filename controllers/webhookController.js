const crypto = require('crypto');
const { Reservation } = require('../models');
const { emitReservationChange } = require('../realtime');

const APPROVED = new Set(['approved', 'accredited', 'paid', 'confirmed']);

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  if (!a.length || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function parseSignature(header) {
  const parts = String(header || '').split(',');
  const parsed = {};
  parts.forEach((part) => {
    const [key, ...rest] = part.split('=');
    if (!key || !rest.length) {
      return;
    }
    parsed[key.trim()] = rest.join('=').trim();
  });
  return parsed;
}

function paymentDataId(req) {
  const body = req.body || {};
  return (body.data && body.data.id)
    || body.id
    || req.query['data.id']
    || req.query.id
    || '';
}

function verifyMercadoPagoSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';
  const signatureHeader = req.get('x-signature') || '';
  const requestId = req.get('x-request-id') || '';
  const token = req.get('x-webhook-secret')
    || req.query.token
    || req.query.secret
    || '';

  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  if (token && safeEqual(token, secret)) {
    return true;
  }

  if (signatureHeader && safeEqual(signatureHeader, secret)) {
    return true;
  }

  const { ts, v1 } = parseSignature(signatureHeader);
  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${paymentDataId(req)};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return safeEqual(expected, v1);
}

function reservationIdFrom(body, query, payment) {
  const nested = body && body.data && typeof body.data === 'object' ? body.data : {};
  const candidates = [
    body && body.reservation_id,
    body && body.reservationId,
    body && body.external_reference,
    nested.reservation_id,
    nested.external_reference,
    query && query.reservation_id,
    query && query.external_reference,
    payment && payment.external_reference,
    payment && payment.metadata && (payment.metadata.reservation_id || payment.metadata.reservationId),
  ];
  const raw = candidates.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isApprovedPayload(body, payment) {
  const status = String(
    (payment && payment.status)
    || (body && body.status)
    || (body && body.payment_status)
    || (body && body.data && body.data.status)
    || ''
  ).toLowerCase();
  return APPROVED.has(status);
}

async function fetchMercadoPagoPayment(paymentId) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token || !paymentId) {
    return null;
  }
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

async function handlePaymentNotification(req, res) {
  if (!verifyMercadoPagoSignature(req)) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Firma de Mercado Pago inválida',
    });
  }

  try {
    const body = req.body || {};
    const payment = await fetchMercadoPagoPayment(paymentDataId(req));
    const reservationId = reservationIdFrom(body, req.query, payment);

    if (!reservationId || !isApprovedPayload(body, payment)) {
      return res.status(200).json({ success: true, received: true });
    }

    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      return res.status(200).json({ success: true, received: true });
    }

    if (reservation.status !== 'confirmed') {
      await reservation.update({ status: 'confirmed' });
    }

    emitReservationChange(req.app.get('io'), reservation);
    return res.status(200).json({
      success: true,
      data: {
        reservationId: reservation.id,
        status: reservation.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al procesar el webhook',
    });
  }
}

module.exports = { handlePaymentNotification };
