const express = require("express");
const cors = require("cors");
const mercadopago = require("mercadopago");

const app = express();
app.use(express.json());
app.use(cors());

// =====================================================
// AQUI SE LEEN TUS DATOS DESDE RENDER
// En Render debes crear estas variables:
// MP_PUBLIC_KEY=TU_LLAVE_PUBLICA
// MP_ACCESS_TOKEN=TU_ACCESS_TOKEN
// =====================================================
const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY;     // AQUI VA TU LLAVE PUBLICA
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN; // AQUI VA TU TOKEN PRIVADO

// =====================================================
// CONFIGURACION DE MERCADO PAGO
// Aqui se usa SOLO el access token privado
// =====================================================
mercadopago.configure({
  access_token: MP_ACCESS_TOKEN
});

// Simulación simple de pagos guardados
let pagos = {};

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor funcionandoooo");
});

// =====================================================
// ESTA RUTA LE MANDA LA LLAVE PUBLICA AL FRONTEND
// Tu HTML ya la espera aqui:
// fetch(BACKEND_URL + '/public-key')
// =====================================================
app.get("/public-key", (req, res) => {
  res.json({
    publicKey: MP_PUBLIC_KEY // AQUI SE ENVIA TU LLAVE PUBLICA
  });
});

// =====================================================
// CREAR PREFERENCIA
// Aqui Mercado Pago crea la preferencia de pago
// Se usa el access token configurado arriba
// =====================================================
app.post("/crear-preferencia", async (req, res) => {
  try {
    const { servicios, total, clienteId } = req.body;

    const preference = {
      items: [
        {
          title: `Anticipo cita - ${servicios || "Beauty Studio"}`,
          quantity: 1,
          currency_id: "MXN",
          unit_price: 1
        }
      ],

      // Este id te sirve para relacionar el pago con la cita
      external_reference: clienteId,

      // =================================================
      // AQUI VA LA URL REAL DE TU BACKEND EN RENDER
      // Debe terminar en /webhook
      // =================================================
      notification_url: "https://backend-nails-3.onrender.com/webhook"

      // Si cambias el dominio de Render, cambialo aqui
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({
      preferenceId: response.body.id
    });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
});

// =====================================================
// CONFIRMAR PAGO
// OJO: esto NO valida solo, solo marca como pagado
// Si luego quieres validacion real, aqui se mejora
// =====================================================
app.post("/confirmar-pago", async (req, res) => {
  try {
    const { clienteId } = req.body;

    if (!clienteId) {
      return res.status(400).json({ error: "Falta clienteId" });
    }

    pagos[clienteId] = true;

    res.json({ ok: true, pagado: true });
  } catch (error) {
    console.error("Error confirmando pago:", error);
    res.status(500).json({ error: "No se pudo confirmar el pago" });
  }
});

// Verificar pago por id
app.get("/verificar-pago/:id", (req, res) => {
  const id = req.params.id;
  res.json({ pagado: pagos[id] === true });
});

// =====================================================
// WEBHOOK
// Aqui Mercado Pago te manda avisos automáticos
// No pongas keys aqui, solo recibe notificaciones
// =====================================================
app.post("/webhook", (req, res) => {
  console.log("Webhook recibido:", req.body);

  // Esto por ahora está básico
  const id = req.body?.data?.id || "demo";

  pagos[id] = true;

  res.sendStatus(200);
});

// Servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo 💅");
});
