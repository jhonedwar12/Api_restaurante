// archivo: servicioEstado.js
const fs = require("fs");

const ESTADO_PATH = "./estado.json";

function asegurarEstadoInicial() {
  if (!fs.existsSync(ESTADO_PATH)) {
    console.log("estado.json no existe. Creando con estado habilitado.");
    guardarEstado(true, false); // inicia en true sin marcar cambio manual
  } else {
    // Forzar el valor a true al iniciar (solo si ya existe)
    const estado = leerEstadoCompleto();
    if (!estado.pedidosHabilitados) {
      guardarEstado(true, false);
      console.log("✅ Estado forzado a habilitado al iniciar.");
    }
  }
}
/// dias sin tocar 
const diasSinTocar = (ultimoCambioManual) => {
  if (!ultimoCambioManual) return true;
  
  const hoy = new Date();
  const fechaManual = new Date(ultimoCambioManual);
  
  const diferenciaEnDias = Math.floor((hoy - fechaManual) / (1000 * 60 * 60 * 24));
  return diferenciaEnDias >= 1 && diferenciaEnDias <= 3;
};


//funcion para apagar el servicio si el boton fue cambiado en el dia
function asegurarApagadoAutomatico() {

    guardarEstado(false);
    console.log("✅ Estado apagado automáticamente fuera de horario.");
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
    const hoy = new Date().toISOString();
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

function enHorarioDePedidos(ultimoCambioManual) {
  const ahora = new Date();
  const horaActual = ahora.getHours() + ahora.getMinutes() / 60;
  const hoy = ahora.toISOString().split("T")[0];

  const fueraHorario = horaActual < 10.3 || horaActual >= 16.5;
  const huboCambioHoy = ultimoCambioManual?.startsWith?.(hoy);

  if (fueraHorario && huboCambioHoy) {
    const horaDelCambio = new Date(ultimoCambioManual).getHours() + new Date(ultimoCambioManual).getMinutes() / 60;

    if (horaDelCambio >= 10.5 && horaDelCambio < 16.5) {
      console.log("Cambio manual válido hoy, pero ya fuera de horario. Apagando automáticamente.");
      asegurarApagadoAutomatico();
    }
  }
  asegurarEstadoInicial();

  return horaActual >= 10.3 && horaActual < 16.5;
}


module.exports = {
  asegurarEstadoInicial,
  leerEstadoCompleto,
  guardarEstado,
  enHorarioDePedidos,
  diasSinTocar
};
