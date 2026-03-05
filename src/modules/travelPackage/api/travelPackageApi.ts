import { API_BASE_URL } from "@/config";

const PROGRAMACION_API_URL = `${API_BASE_URL}/Programacion`;

export async function agregarPaqueteViaje(valores: string) {
  const response = await fetch(
    `${PROGRAMACION_API_URL}/agregar-paquete-viaje`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "text/plain",
      },
      body: JSON.stringify({ valores }),
    },
  );

  const raw = (await response.text()).trim();
  if (!response.ok) {
    throw new Error(raw || "Error al guardar paquete de viaje");
  }

  if (!raw) return true;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function listarPaqueteViaje(valores: string) {
  const response = await fetch(`${PROGRAMACION_API_URL}/lista-paquete-viaje`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "text/plain",
    },
    body: JSON.stringify({ valores }),
  });

  const raw = (await response.text()).trim();
  if (!response.ok) {
    throw new Error(raw || "Error al listar paquetes de viaje");
  }

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function obtenerPaqueteViaje(valores: string) {
  const response = await fetch(`${PROGRAMACION_API_URL}/obtener-paquete-viaje`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "text/plain",
    },
    body: JSON.stringify({ valores }),
  });

  const raw = (await response.text()).trim();
  if (!response.ok) {
    throw new Error(raw || "Error al obtener paquete de viaje");
  }

  if (!raw) return "";

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function actualizarPaqueteViaje(valores: string) {
  const response = await fetch(
    `${PROGRAMACION_API_URL}/actualizar-paquete-viaje`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "text/plain",
      },
      body: JSON.stringify({ valores }),
    },
  );

  const raw = (await response.text()).trim();
  if (!response.ok) {
    throw new Error(raw || "Error al actualizar paquete de viaje");
  }

  if (!raw) return true;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function actualizarVerificadoPaqueteViaje(params: {
  idPaqueteViaje: number;
  estado: boolean;
}) {
  const response = await fetch(
    `${PROGRAMACION_API_URL}/actualizar-verificado-paquete-viaje`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(params),
    },
  );

  const raw = (await response.text()).trim();
  if (!response.ok) {
    throw new Error(raw || "Error al actualizar verificado del paquete de viaje");
  }

  if (!raw) return true;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
