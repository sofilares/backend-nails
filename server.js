const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const app = express();
app.use(express.json());
app.use(cors());

// ══════════════════════════════════════════════════════════
//  Las credenciales viven en las variables de entorno
//  de Render — nunca las pongas directo en el código
// ══════════════════════════════════════════════════════════
const MP_PUBLIC_KEY   = process.env.MP_PUBLIC_KEY;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });

// Base de datos en memoria
let pagos = {};

// ── Ruta de salud ────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Servidor Jacqueline Beauty Studio ✅");
});

// ── Devuelve la Public Key al frontend ──────────────────
app.get("/public-key", (req, res) => {
  res.json({ publicKey: MP_PUBLIC_KEY });
});

// ── Crear preferencia de pago ────────────────────────────
app.post("/crear-preferencia", async (req, res) => {
  try {
    const { servicios, total, clienteId } = req.body;

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: `Anticipo cita — ${servicios || "Beauty Studio"}`,
            quantity: 1,
            currency_id: "MXN",
            unit_price: 100  // ← ANTICIPO FIJO DE $100
          }
        ],
        external_reference: clienteId,
        notification_url: "https://backend-nails-3.onrender.com/webhook",
        payment_methods: {
          installments: 1,
          default_installments: 1
        }
      }
    });

    // Guardar clienteId como pendiente
    pagos[clienteId] = false;

    res.json({ preferenceId: response.id });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
});

// ── Confirmar pago manualmente (desde el frontend) ───────
app.post("/confirmar-pago", async (req, res) => {
  try {
    const { clienteId } = req.body;
    if (!clienteId) return res.status(400).json({ error: "Falta clienteId" });

    pagos[clienteId] = true;
    console.log(`✅ Pago confirmado para: ${clienteId}`);

    res.json({ ok: true, pagado: true });
  } catch (error) {
    console.error("Error confirmando pago:", error);
    res.status(500).json({ error: "No se pudo confirmar el pago" });
  }
});

// ── Verificar pago ───────────────────────────────────────
app.get("/verificar-pago/:id", (req, res) => {
  const id = req.params.id;
  res.json({ pagado: pagos[id] === true });
});

// ── Webhook de Mercado Pago ──────────────────────────────
app.post("/webhook", async (req, res) => {
  try {
    console.log("Webhook recibido:", req.body);

    const { type, data } = req.body;

    if (type === "payment" && data?.id) {
      const payment = new Payment(client);
      const info    = await payment.get({ id: data.id });

      if (info.status === "approved") {
        const ref = info.external_reference;
        if (ref) {
          pagos[ref] = true;
          console.log(`✅ Webhook: pago aprobado para ${ref}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});