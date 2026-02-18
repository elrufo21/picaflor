import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import HotelFormDialog, {
  type HotelFormValues,
} from "../components/HotelFormDialog";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useHotelsQuery } from "../useHotelsQuery";
import type { Hotel } from "@/types/maintenance";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

const HotelList = () => {
  const { hotels, fetchHotels, addHotel, updateHotel, deleteHotel } =
    useMaintenanceStore();
  const openDialog = useDialogStore((s) => s.openDialog);
  const formRef = useRef<UseFormReturn<HotelFormValues> | null>(null);
  useHotelsQuery();

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const openHotelModal = useCallback(
    (mode: "create" | "edit", hotel?: Hotel) => {
      openDialog({
        title: mode === "create" ? "Crear hotel" : "Editar hotel",
        description:
          mode === "create"
            ? "Agrega los datos básicos del hotel."
            : "Actualiza los campos del hotel seleccionado.",
        size: "md",
        confirmLabel: mode === "create" ? "Crear hotel" : "Guardar cambios",
        content: () => (
          <HotelFormDialog formRef={formRef} initialData={hotel} />
        ),
        onConfirm: () => {
          if (!formRef.current) return;
          return formRef.current.handleSubmit(async (values) => {
            if (mode === "edit" && hotel) {
              await updateHotel(hotel.id, values);
              return;
            }
            await addHotel(values);
            await fetchHotels();
          })();
        },
      });
    },
    [openDialog, addHotel, updateHotel, fetchHotels],
  );

  const columns = useMemo(() => {
    const helper = createColumnHelper<Hotel>();
    return [
      helper.accessor("hotel", {
        header: "Hotel",
        cell: (info) => info.getValue(),
      }),
      helper.accessor("region", {
        header: "Región",
        cell: (info) => info.getValue(),
      }),
      helper.accessor("horaIngreso", {
        header: "Hora ingreso",
        cell: (info) => info.getValue(),
      }),
      helper.accessor("horaSalida", {
        header: "Hora salida",
        cell: (info) => info.getValue(),
      }),
      helper.accessor("direccion", {
        header: "Dirección",
        cell: (info) => (
          <span className="block max-w-[20rem] truncate">
            {info.getValue()}
          </span>
        ),
      }),
      helper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openHotelModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-900"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                openDialog({
                  title: "Eliminar hotel",
                  description:
                    "¿Estás seguro de eliminar este hotel? Esta acción no se puede deshacer.",
                  size: "sm",
                  confirmLabel: "Eliminar",
                  cancelLabel: "Cancelar",
                  onConfirm: async () => {
                    await deleteHotel(row.original.id);
                  },
                  content: () => (
                    <p className="text-sm text-slate-700">
                      Una vez eliminado, no podrás recuperar este hotel.
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
    ];
  }, [openDialog, deleteHotel, openHotelModal]);

  return (
    <MaintenancePageFrame
      title="Hoteles"
      description="Consulta y actualiza horarios y direccion de hoteles registrados."
    >
      <DndTable
        data={hotels}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            onClick={() => openHotelModal("create")}
            title="Crear hotel"
            aria-label="Crear hotel"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default HotelList;
