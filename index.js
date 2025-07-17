const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config(); // Para manejar variables de entorno

const app = express();
app.use(cors());
app.use(express.json());

const ESTADO_PATH = "./estado.json";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "5964"; // Token para proteger la ruta POST

// Si no existe el archivo, lo crea con estado INHABILITADO (false)
function asegurarEstadoInicial() {
  if (!fs.existsSync(ESTADO_PATH)) {
    console.log("estado.json no existe. Creando con estado inhabilitado.");
    guardarEstado(true);
  }
}

// Leer el estado actual
function leerEstado() {
  try {
    const data = fs.readFileSync(ESTADO_PATH, "utf-8");
    const parsed = JSON.parse(data);
    if (typeof parsed.pedidosHabilitados === "boolean") {
      return parsed.pedidosHabilitados;
    } else {
      console.warn("El archivo no tiene un valor booleano válido. Usando false.");
      return false;
    }
  } catch (error) {
    console.error("Error leyendo estado.json:", error);
    return false;
  }
}

// Guardar nuevo estado
function guardarEstado(habilitado) {
  try {
    fs.writeFileSync(
      ESTADO_PATH,
      JSON.stringify({ pedidosHabilitados: habilitado }, null, 2)
    );
    console.log("Estado guardado:", habilitado);
  } catch (err) {
    console.error("Error al guardar estado:", err);
  }
}

// Inicializar estado
asegurarEstadoInicial();

// Ruta pública (consulta)
app.get("/api/pedidos-habilitados", (req, res) => {
  const estado = leerEstado();
  res.json({ pedidosHabilitados: estado });
});

// Ruta protegida (cambio)
app.post("/api/pedidos-habilitados", (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (token !== ADMIN_TOKEN) {
    console.warn("Intento no autorizado");
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  const { habilitado } = req.body;
  if (typeof habilitado === "boolean") {
    guardarEstado(habilitado);
    res.json({ success: true, pedidosHabilitados: habilitado });
  } else {
    res.status(400).json({ success: false, message: "Valor inválido" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor backend escuchando en http://localhost:${PORT}`);
});
