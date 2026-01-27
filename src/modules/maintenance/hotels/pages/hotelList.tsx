import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import HotelFormDialog, {
  type HotelFormValues,
} from "../components/HotelFormDialog";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import { useHotelsQuery } from "../useHotelsQuery";
import type { Hotel } from "@/types/maintenance";

const HotelList = () => {
  const { hotels, fetchHotels, addHotel, updateHotel } = useMaintenanceStore();
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
            } else {
              await addHotel(values);
            }
          })();
        },
      });
    },
    [openDialog, addHotel, updateHotel],
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
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => openHotelModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-900"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ];
  }, [openHotelModal]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hoteles</h1>
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => openHotelModal("create")}
        >
          + Crear hotel
        </button>
      </div>

      <DndTable data={hotels} columns={columns} enableDateFilter={false} />
    </div>
  );
};

export default HotelList;
