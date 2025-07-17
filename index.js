const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const ESTADO_PATH = "./estado.json";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "5964";

// Crear archivo inicial si no existe
function asegurarEstadoInicial() {
  if (!fs.existsSync(ESTADO_PATH)) {
    console.log("estado.json no existe. Creando con estado inhabilitado.");
    guardarEstado(false, null);
  }
}

// Leer el estado completo
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
      pedidosHabilitados: false,
      ultimoCambioManual: null,
    };
  }
}

// Guardar el estado con opción de marcar cambio manual
function guardarEstado(habilitado, esManual = false) {
  const estado = {
    pedidosHabilitados: habilitado,
  };

  if (esManual) {
    const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
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

// Determinar si estamos en horario de pedidos automáticos
function enHorarioDePedidos() {
  const ahora = new Date();
  const hora = ahora.getHours();
  return hora >= 10 && hora < 17; // Entre 10 AM y 5 PM
}

// Inicializar
asegurarEstadoInicial();

// Ruta pública (consulta)
app.get("/api/pedidos-habilitados", (req, res) => {
  const { pedidosHabilitados, ultimoCambioManual } = leerEstadoCompleto();

  const hoy = new Date().toISOString().split("T")[0];
  const enHorario = enHorarioDePedidos();

  // Solo aplicar lógica automática si no hubo cambio manual hoy
  if (ultimoCambioManual !== hoy) {
    if (enHorario && !pedidosHabilitados) {
      guardarEstado(true); // Habilitar automáticamente
      return res.json({ pedidosHabilitados: true });
    }

    if (!enHorario && pedidosHabilitados) {
      guardarEstado(false); // Deshabilitar automáticamente
      return res.json({ pedidosHabilitados: false });
    }
  }

  // Si hubo cambio manual hoy, respetarlo
  return res.json({ pedidosHabilitados });
});

// Ruta protegida (POST) para habilitar/deshabilitar manualmente
app.post("/api/pedidos-habilitados", (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (token !== ADMIN_TOKEN) {
    console.warn("Intento no autorizado");
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  const { habilitado } = req.body;
  if (typeof habilitado === "boolean") {
    guardarEstado(habilitado, true); // cambio manual
    return res.json({ success: true, pedidosHabilitados: habilitado });
  } else {
    return res.status(400).json({ success: false, message: "Valor inválido" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor backend escuchando en http://localhost:${PORT}`);
});
