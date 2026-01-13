import type { ModuleListConfig } from "@/shared/config/listConfig";
import type { Client } from "@/types/maintenance";

export const clientListConfig: ModuleListConfig<Client> = {
  basePath: "/maintenance/clients",
  idKey: "clienteId",
  createLabel: "Anadir cliente",
  deleteMessage: "Seguro que deseas eliminar este cliente?",
  columns: [
    { key: "clienteRazon", header: "Razon social" },
    { key: "clienteRuc", header: "RUC" },
    { key: "clienteDni", header: "DNI" },
    { key: "clienteTelefono", header: "Telefono" },
    { key: "clienteCorreo", header: "Correo" },
    { key: "clienteEstado", header: "Estado" },
  ],
  filterKeys: [
    "clienteRazon",
    "clienteRuc",
    "clienteDni",
    "clienteTelefono",
    "clienteCorreo",
  ],
};
