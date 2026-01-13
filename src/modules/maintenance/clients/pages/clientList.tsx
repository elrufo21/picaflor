import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useClientsStore } from "@/store/clients/clients.store";
import type { Client } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";

const ClientList = () => {
  const navigate = useNavigate();
  const openDialog = useDialogStore((s) => s.openDialog);
  const { clients, fetchClients, deleteClient } = useClientsStore();

  useEffect(() => {
    fetchClients("ACTIVO");
  }, [fetchClients]);

  const columnHelper = createColumnHelper<Client>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("clienteRazon", {
        header: "Razon social",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteRuc", {
        header: "RUC",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteDni", {
        header: "DNI",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteTelefono", {
        header: "Telefono",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteCorreo", {
        header: "Correo",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("clienteEstado", {
        header: "Estado",
        cell: (info) => info.getValue() ?? "ACTIVO",
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/maintenance/clients/${row.original.clienteId}/edit`)
              }
              className="text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                openDialog({
                  title: "Eliminar cliente",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    await deleteClient(row.original.clienteId);
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      Estas seguro de eliminar este cliente?
                      <br />
                      Esta accion no se puede deshacer.
                    </p>
                  ),
                });
              }}
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, deleteClient, navigate, openDialog]
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-600">
            Listado de clientes registrados.
          </p>
        </div>

        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => navigate("/maintenance/clients/create")}
        >
          + Nuevo cliente
        </button>
      </div>

      <DndTable data={clients} columns={columns} enableDateFilter={false} />
    </div>
  );
};

export default ClientList;
