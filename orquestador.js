// archivo: orquestador.js
const express = require("express");
require("dotenv").config();
const {
  leerEstadoCompleto,
  guardarEstado,
  asegurarEstadoInicial,
  enHorarioDePedidos,
} = require("./servicioEstado");

const router = express.Router();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "5964";


router.get("/api/pedidos-habilitados", (req, res) => {
  const { pedidosHabilitados, ultimoCambioManual } = leerEstadoCompleto();
  const hoy = new Date().toISOString().split("T")[0];
  const enHorario = enHorarioDePedidos();


  const sePuedeActualizar = ultimoCambioManual !== hoy;

  if (sePuedeActualizar) {
    if (enHorario && !pedidosHabilitados) {
      guardarEstado(true);
      console.log("Encendido automático por estar en horario");
      return res.json({ pedidosHabilitados: true });
    }

  }

  // Retorna el estado actual sin cambios
  return res.json({ pedidosHabilitados });
});

// Ruta protegida para actualizar manualmente el estado
router.post("/api/pedidos-habilitados", (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (token !== ADMIN_TOKEN) {
    console.warn("Intento no autorizado");
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  const { habilitado } = req.body;
  if (typeof habilitado === "boolean") {
    guardarEstado(habilitado, true);
    return res.json({ success: true, pedidosHabilitados: habilitado });
  } else {
    return res.status(400).json({ success: false, message: "Valor inválido" });
  }
});

module.exports = router;
