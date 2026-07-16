// =====================================================================
// api/contacto.js — Función serverless de Vercel (runtime Node.js)
// ---------------------------------------------------------------------
// Recibe el formulario del modal de contacto y lo reenvía por correo
// usando Resend. La API key vive SOLO en el servidor
// (process.env.RESEND_API_KEY); nunca se expone al cliente.
// =====================================================================

// Origen autorizado para CORS (la página vive en WordPress/GoDaddy).
var ALLOWED_ORIGIN = "https://responsable.net";

// Remitente: debe pertenecer al dominio verificado en Resend.
var FROM = "ResponSable <contacto@mail.responsable.net>";

var SUBJECT = "Nueva solicitud de propuesta - Estudio de Doble Materialidad";

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

// Escapa texto del usuario antes de meterlo en el HTML del correo.
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Construye una fila de la tabla del correo (omite las vacías opcionales).
function row(label, value) {
  var v = (value || "").trim();
  if (!v) v = "—";
  return (
    '<tr>' +
    '<td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f7f7fb;' +
    'font-weight:600;color:#222955;white-space:nowrap;">' + esc(label) + '</td>' +
    '<td style="padding:8px 12px;border:1px solid #e5e7eb;color:#1a1c2e;">' +
    esc(v).replace(/\n/g, "<br>") + '</td>' +
    '</tr>'
  );
}

module.exports = async function handler(req, res) {
  setCors(res);

  // Preflight CORS.
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }

  // El runtime Node de Vercel ya parsea JSON, pero lo contemplamos por si acaso.
  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // --- Honeypot anti-spam -------------------------------------------
  // El campo "website" está oculto en el formulario. Un humano nunca lo
  // llena; un bot sí. Si viene con algo, fingimos éxito y no enviamos nada.
  if ((body.website || "").trim() !== "") {
    return res.status(200).json({ ok: true });
  }

  // --- Normalización -------------------------------------------------
  var nombre = (body.nombre || "").trim();
  var apellido = (body.apellido || "").trim();
  var email = (body.email || "").trim();
  var telefono = (body.telefono || "").trim();
  var compania = (body.compania || "").trim();
  var cargo = (body.cargo || "").trim();
  var mensaje = (body.mensaje || "").trim();

  // --- Validación de obligatorios en el servidor --------------------
  var obligatorios = {
    "Nombre": nombre,
    "Apellido": apellido,
    "Correo electrónico": email,
    "Teléfono": telefono,
    "Compañía": compania,
  };
  var faltantes = Object.keys(obligatorios).filter(function (k) {
    return !obligatorios[k];
  });
  if (faltantes.length) {
    return res.status(400).json({
      ok: false,
      error: "Faltan campos obligatorios: " + faltantes.join(", ") + ".",
    });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({
      ok: false,
      error: "El correo electrónico no tiene un formato válido.",
    });
  }

  // --- Configuración del servidor -----------------------------------
  var apiKey = process.env.RESEND_API_KEY;
  var to = process.env.CONTACTO_TO;
  if (!apiKey || !to) {
    return res.status(500).json({
      ok: false,
      error: "El servicio de correo no está configurado.",
    });
  }

  // --- Cuerpo del correo (HTML) -------------------------------------
  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1a1c2e;">' +
    '<h2 style="color:#222955;margin:0 0 4px;">Nueva solicitud de propuesta</h2>' +
    '<p style="color:#4a4d63;margin:0 0 20px;">Estudio de Doble Materialidad · formulario del sitio</p>' +
    '<table style="border-collapse:collapse;width:100%;font-size:14px;">' +
    row("Nombre", nombre) +
    row("Apellido", apellido) +
    row("Correo electrónico", email) +
    row("Teléfono", telefono) +
    row("Compañía", compania) +
    row("Cargo", cargo) +
    row("Mensaje", mensaje) +
    '</table>' +
    '<p style="color:#8a8da0;font-size:12px;margin:20px 0 0;">' +
    'Enviado automáticamente desde responsable.net/soluciones/estudio-doble-materialidad/</p>' +
    '</div>';

  // --- Envío vía Resend ---------------------------------------------
  try {
    var resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: email,
        subject: SUBJECT,
        html: html,
      }),
    });

    if (!resendRes.ok) {
      var detail = "";
      try { detail = await resendRes.text(); } catch (e) {}
      return res.status(500).json({
        ok: false,
        error: "El servicio de correo rechazó el envío.",
        detail: detail,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "No se pudo conectar con el servicio de correo.",
    });
  }
};
