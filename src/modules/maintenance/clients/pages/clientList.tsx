import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import DndTable from "@/components/dataTabla/DndTable";
import { useClientsStore } from "@/store/clients/clients.store";
import type { Client } from "@/types/maintenance";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import ClientForm from "../components/ClientForm";

const ClientList = () => {
  const openDialog = useDialogStore((s) => s.openDialog);
  const { clients, fetchClients, addClient, updateClient, deleteClient } =
    useClientsStore();
  const submitClientRef = useRef<(() => Promise<boolean>) | null>(null);

  useEffect(() => {
    fetchClients("ACTIVO");
  }, [fetchClients]);

  const openClientModal = useCallback(
    (mode: "create" | "edit", client?: Client) => {
      openDialog({
        title: mode === "create" ? "Registrar cliente" : "Editar cliente",
        description:
          mode === "create"
            ? "Completa los datos principales del cliente."
            : "Actualiza la informacion del cliente seleccionado.",
        size: "xl",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        dangerLabel: mode === "edit" ? "Eliminar" : undefined,
        onConfirm: async () => {
          const submitForm = submitClientRef.current;
          if (typeof submitForm !== "function") return false;
          return submitForm();
        },
        onDanger:
          mode === "edit"
            ? async () => {
                const id = Number(client?.clienteId ?? 0);
                if (!id) return false;
                openDialog({
                  title: "Eliminar cliente",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    const ok = await deleteClient(id);
                    if (!ok) {
                      toast.error("No se pudo eliminar el cliente");
                      return false;
                    }
                    toast.success("Cliente eliminado");
                    await fetchClients("ACTIVO");
                    return true;
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      Estas seguro de eliminar este cliente?
                      <br />
                      Esta accion no se puede deshacer.
                    </p>
                  ),
                });
                return false;
              }
            : undefined,
        content: () => (
          <ClientForm
            mode={mode}
            initialData={client}
            hideHeaderActions
            onRegisterSubmit={(submit) => {
              submitClientRef.current = submit;
            }}
            onSave={async (data) => {
              if (mode === "create") {
                const ok = await addClient(data);
                if (!ok) {
                  toast.error("No se pudo crear el cliente");
                  return false;
                }
                toast.success("Cliente creado correctamente");
                await fetchClients("ACTIVO");
                return true;
              }

              const id = Number(client?.clienteId ?? 0);
              if (!id) return false;
              const ok = await updateClient(id, data);
              if (!ok) {
                toast.error("No se pudo actualizar el cliente");
                return false;
              }
              toast.success("Cliente actualizado");
              await fetchClients("ACTIVO");
              return true;
            }}
            onNew={() => {}}
          />
        ),
      });
    },
    [openDialog, addClient, updateClient, deleteClient, fetchClients],
  );

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
              onClick={() => openClientModal("edit", row.original)}
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
                    const ok = await deleteClient(row.original.clienteId);
                    if (!ok) {
                      toast.error("No se pudo eliminar el cliente");
                      return false;
                    }
                    toast.success("Cliente eliminado");
                    await fetchClients("ACTIVO");
                    return true;
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
    [columnHelper, openDialog, openClientModal, deleteClient, fetchClients],
  );

  return (
    <MaintenancePageFrame
      title="Clientes"
      description="Consulta, crea y edita clientes de forma rapida."
    >
      <DndTable
        data={clients}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            onClick={() => openClientModal("create")}
            title="Nuevo cliente"
            aria-label="Nuevo cliente"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default ClientList;
