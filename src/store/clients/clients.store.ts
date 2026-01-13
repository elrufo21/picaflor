import { create } from "zustand";

import { apiRequest } from "@/shared/helpers/apiRequest";
import { queryClient } from "@/shared/queryClient";
import type { Client } from "@/types/maintenance";
import { API_BASE_URL } from "@/config";

export const clientsQueryKey = ["clients"] as const;

interface ClientsState {
  clients: Client[];
  loading: boolean;
  fetchClients: (estado?: "ACTIVO" | "INACTIVO" | "") => Promise<void>;
  addClient: (client: Client) => Promise<boolean>;
  updateClient: (id: number, data: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: number) => Promise<boolean>;
}

const mapApiToClient = (item: any): Client => {
  const clienteId = Number(
    item?.clienteId ?? item?.ClienteId ?? item?.id ?? 0
  );
  return {
    id: clienteId,
    clienteId,
    clienteRazon:
      item?.clienteRazon ?? item?.ClienteRazon ?? item?.razon ?? "",
    clienteRuc: item?.clienteRuc ?? item?.ClienteRuc ?? item?.ruc ?? "",
    clienteDni: item?.clienteDni ?? item?.ClienteDni ?? item?.dni ?? "",
    clienteDireccion:
      item?.clienteDireccion ?? item?.ClienteDireccion ?? item?.direccion ?? "",
    clienteMovil:
      item?.clienteMovil ?? item?.ClienteMovil ?? item?.movil ?? "",
    clienteTelefono:
      item?.clienteTelefono ?? item?.ClienteTelefono ?? item?.telefono ?? "",
    clienteCorreo:
      item?.clienteCorreo ?? item?.ClienteCorreo ?? item?.correo ?? "",
    clienteEstado:
      item?.clienteEstado ??
      item?.ClienteEstado ??
      item?.estado ??
      "ACTIVO",
    clienteDespacho:
      item?.clienteDespacho ??
      item?.ClienteDespacho ??
      item?.despacho ??
      "",
    clienteUsuario:
      item?.clienteUsuario ?? item?.ClienteUsuario ?? item?.usuario ?? "",
    clienteFecha:
      item?.clienteFecha ?? item?.ClienteFecha ?? item?.fecha ?? "",
    companiaId: item?.companiaId ?? item?.CompaniaId ?? null,
  };
};

const LEGACY_ROW_SEPARATOR = "\u00ac";

const parseLegacyDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return trimmed;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const parseLegacyClients = (raw: string): Client[] => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "~") return [];

  return trimmed
    .split(LEGACY_ROW_SEPARATOR)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [
        clienteId,
        clienteRazon,
        clienteRuc,
        clienteDni,
        clienteTelefono,
        clienteCorreo,
        clienteFecha,
        clienteUsuario,
        clienteEstado,
        clienteDireccion,
      ] = row.split("|");

      const idValue = Number(clienteId) || 0;
      return {
        id: idValue,
        clienteId: idValue,
        clienteRazon: (clienteRazon ?? "").trim(),
        clienteRuc: (clienteRuc ?? "").trim(),
        clienteDni: (clienteDni ?? "").trim(),
        clienteDireccion: (clienteDireccion ?? "").trim(),
        clienteMovil: "",
        clienteTelefono: (clienteTelefono ?? "").trim(),
        clienteCorreo: (clienteCorreo ?? "").trim(),
        clienteEstado: (clienteEstado ?? "").trim() || "ACTIVO",
        clienteDespacho: "",
        clienteUsuario: (clienteUsuario ?? "").trim(),
        clienteFecha: parseLegacyDate(clienteFecha ?? ""),
        companiaId: 1,
      };
    });
};

const parseClientPayload = (payload: unknown): Client[] => {
  if (!payload) return [];
  if (typeof payload === "string") return parseLegacyClients(payload);
  if (Array.isArray(payload)) return payload.map(mapApiToClient);
  if (typeof payload === "object") {
    const data = (payload as any).data;
    if (data && data !== payload) return parseClientPayload(data);
    return [mapApiToClient(payload)];
  }
  return [];
};

const buildClientPayload = (data: Partial<Client>, idOverride?: number) => ({
  clienteId: idOverride ?? data.clienteId ?? data.id ?? 0,
  clienteRazon: data.clienteRazon ?? "",
  clienteRuc: data.clienteRuc ?? "",
  clienteDni: data.clienteDni ?? "",
  clienteDireccion: data.clienteDireccion ?? "",
  clienteMovil: data.clienteMovil ?? "",
  clienteTelefono: data.clienteTelefono ?? "",
  clienteCorreo: data.clienteCorreo ?? "",
  clienteEstado: data.clienteEstado ?? "ACTIVO",
  clienteDespacho: data.clienteDespacho ?? "",
  clienteUsuario: data.clienteUsuario ?? "",
  clienteFecha: data.clienteFecha ?? "",
  companiaId: data.companiaId ?? 1,
});

const isDuplicateClient = (result: unknown) => {
  if (typeof result !== "string") return false;
  const normalized = result.toLowerCase();
  return normalized.includes("existe");
};

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  loading: false,

  fetchClients: async (estado = "ACTIVO") => {
    set({ loading: true });
    try {
      const response = await queryClient.fetchQuery({
        queryKey: [...clientsQueryKey, estado],
        queryFn: async () => {
          const query =
            estado && estado.trim() !== ""
              ? `?estado=${encodeURIComponent(estado)}`
              : "";
          const data = await apiRequest<any>({
            url: `${API_BASE_URL}/cliente/list${query}`,
            method: "GET",
            fallback: [],
          });
          return data ?? [];
        },
      });

      set({
        clients: parseClientPayload(response),
        loading: false,
      });
    } catch (error) {
      console.error("Error loading clients", error);
      set({ loading: false });
    }
  },

  addClient: async (client) => {
    const payload = buildClientPayload(client, 0);
    const created = await apiRequest<any>({
      url: "http://localhost:5000/api/v1/Cliente/register",
      method: "POST",
      data: payload,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: { ...payload, clienteId: Date.now() },
    });

    if (isDuplicateClient(created)) {
      return false;
    }

    const mapped = mapApiToClient(created ?? payload);
    set((state) => ({
      clients: [...state.clients, mapped],
    }));
    await queryClient.invalidateQueries({ queryKey: clientsQueryKey });
    return true;
  },

  updateClient: async (id, data) => {
    const payload = buildClientPayload(data, id);
    const updated = await apiRequest<any>({
      url: "http://localhost:5000/api/v1/Cliente/register",
      method: "POST",
      data: payload,
      config: {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      },
      fallback: payload,
    });

    if (isDuplicateClient(updated)) {
      return false;
    }

    set((state) => ({
      clients: state.clients.map((clientItem) =>
        Number(clientItem.clienteId) === Number(id)
          ? mapApiToClient(updated ?? payload)
          : clientItem
      ),
    }));
    await queryClient.invalidateQueries({ queryKey: clientsQueryKey });
    return true;
  },

  deleteClient: async (id) => {
    const result = await apiRequest({
      url: `http://localhost:5000/api/v1/Cliente/${id}`,
      method: "DELETE",
      config: {
        headers: {
          Accept: "*/*",
        },
      },
      fallback: null,
    });

    if (result === false || (result as any)?.status === 500) {
      return false;
    }

    set((state) => ({
      clients: state.clients.filter(
        (clientItem) => Number(clientItem.clienteId) !== Number(id)
      ),
    }));
    await queryClient.invalidateQueries({ queryKey: clientsQueryKey });
    return true;
  },
}));
