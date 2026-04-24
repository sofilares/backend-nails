const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(express.json());
app.use(cors());

const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// Cliente nuevo del SDK
const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN
});

let pagos = {};

app.get("/", (req, res) => {
  res.send("Servidor funcionandoooo");
});

app.get("/public-key", (req, res) => {
  res.json({
    publicKey: MP_PUBLIC_KEY
  });
});

app.post("/crear-preferencia", async (req, res) => {
  try {
    const { servicios, total, clienteId } = req.body;

    const preference = new Preference(client);

    const response = await preference.create({
  body: {
    items: [
      {
        title: `Anticipo cita - ${servicios || "Beauty Studio"}`,
        quantity: 1,
        currency_id: "MXN",
        unit_price: 1
      }
    ],
    external_reference: clienteId,
    notification_url: "https://backend-nails-3.onrender.com/webhook",
    payment_methods: {
      excluded_payment_types: [],
      excluded_payment_methods: [],
      installments: 1,
      default_installments: 1
    }
  }
});


    res.json({
      preferenceId: response.id
    });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
});

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

app.get("/verificar-pago/:id", (req, res) => {
  const id = req.params.id;
  res.json({ pagado: pagos[id] === true });
});

app.post("/webhook", (req, res) => {
  console.log("Webhook recibido:", req.body);

  const id = req.body?.data?.id || "demo";
  pagos[id] = true;

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo ");
});
