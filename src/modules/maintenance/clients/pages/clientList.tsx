import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useClientsStore } from "@/store/clients/clients.store";
import type { Client } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

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
    [columnHelper, deleteClient, navigate, openDialog],
  );

  return (
    <MaintenancePageFrame
      title="Clientes"
      description="Consulta, crea y edita clientes de forma rapida."
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8612A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#d55320]"
          onClick={() => navigate("/maintenance/clients/create")}
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      }
    >
      <DndTable data={clients} columns={columns} enableDateFilter={false} />
    </MaintenancePageFrame>
  );
};

export default ClientList;
