// archivo: app.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const rutasPedidos = require("./orquestador");

const app = express();
app.use(cors());
app.use(express.json());

// Usar rutas del orquestador
app.use(rutasPedidos);

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor backend escuchando en http://localhost:${PORT}`);
});
