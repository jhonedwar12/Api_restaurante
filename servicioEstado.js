// archivo: servicioEstado.js
const fs = require("fs");

const ESTADO_PATH = "./estado.json";

function asegurarEstadoInicial() {
  if (!fs.existsSync(ESTADO_PATH)) {
    console.log("estado.json no existe. Creando con estado habilitado.");
    guardarEstado(true, null);
  }
}

function leerEstadoCompleto() {
  try {
    const data = fs.readFileSync(ESTADO_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return {
      pedidosHabilitados: !!parsed.pedidosHabilitados,
      ultimoCambioManual: parsed.ultimoCambioManual || null,
    };
  } catch (error) {
    console.error("Error leyendo estado.json:", error);
    return {
      pedidosHabilitados: true,
      ultimoCambioManual: null,
    };
  }
}

function guardarEstado(habilitado, esManual = false) {
  const estado = {
    pedidosHabilitados: habilitado,
  };

  if (esManual) {
    const hoy = new Date().toISOString().split("T")[0];
    estado.ultimoCambioManual = hoy;
  } else {
    const actual = leerEstadoCompleto();
    estado.ultimoCambioManual = actual.ultimoCambioManual || null;
  }

  try {
    fs.writeFileSync(ESTADO_PATH, JSON.stringify(estado, null, 2));
    console.log("Estado guardado:", estado);
  } catch (err) {
    console.error("Error al guardar estado:", err);
  }
}

function enHorarioDePedidos() {
  const ahora = new Date();
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  return hora >= 10.3 && hora < 16.5;
}

module.exports = {
  asegurarEstadoInicial,
  leerEstadoCompleto,
  guardarEstado,
  enHorarioDePedidos,
};
