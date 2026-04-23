const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Simulación de base de datos
let pagos = {};

// Ruta principal
app.get("/", (req, res) => {
  res.send("Servidor funcionandoooo 💅");
});

// Verificar pago por id
app.get("/verificar-pago/:id", (req, res) => {
  const id = req.params.id;
  res.json({ pagado: pagos[id] === true });
});

// Crear pago (simulación por ahora)
app.get("/pagar/:id", (req, res) => {
  const id = req.params.id;
  pagos[id] = true;

  res.send(`Pago simulado para ${id} ✔️`);
});

// Webhook (aquí llegará Mercado Pago)
app.post("/webhook", (req, res) => {
  console.log("Webhook recibido:", req.body);

  // Aquí luego sacaremos el ID real desde Mercado Pago
  const id = req.body?.data?.id || "demo";

  pagos[id] = true;

  res.sendStatus(200);
});

// Servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});