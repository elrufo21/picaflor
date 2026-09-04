import { useCallback, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { Pencil, Plus } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { SelectControlled, TextControlled } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { useDialogStore } from "@/app/store/dialogStore";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";
import { useHotelRegions } from "../../hotels/useHotelRegions";
import { type Guia, type SaveGuiaPayload, useGuias } from "../hooks/useGuias";

type GuiaFormValues = {
  idRegion: string;
  nombre: string;
  dni: string;
  telefono: string;
  clasificacion: string;
  observaciones: string;
  activo: "1" | "0";
};

type GuiaDialogPayload = Partial<GuiaFormValues> & { editingId?: string };

const GuiaDialogForm = ({
  payload,
  setPayload,
}: {
  payload: GuiaDialogPayload;
  setPayload: (next: Record<string, unknown>) => void;
}) => {
  const { control } = useForm<GuiaFormValues>({
    defaultValues: {
      idRegion: payload.idRegion ?? "",
      nombre: payload.nombre ?? "",
      dni: payload.dni ?? "",
      telefono: payload.telefono ?? "",
      clasificacion: payload.clasificacion ?? "",
      observaciones: payload.observaciones ?? "",
      activo: payload.activo === "0" ? "0" : "1",
    },
  });
  const { data: regions = [], isLoading } = useHotelRegions();
  const regionOptions = regions.map((region) => ({
    value: region.idRegion,
    label: region.nombre,
  }));

  return (
    <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
      <SelectControlled<GuiaFormValues>
        name="idRegion"
        control={control}
        label="Región"
        options={regionOptions}
        required
        size="small"
        helperText={isLoading ? "Cargando regiones..." : undefined}
        disabled={isLoading && !regionOptions.length}
        onChange={(event) => setPayload({ ...payload, idRegion: event.target.value })}
      />
      <TextControlled<GuiaFormValues>
        name="nombre"
        control={control}
        label="Nombre"
        required
        size="small"
        transform={(value) => value.toUpperCase()}
        onChange={(event) => setPayload({ ...payload, nombre: event.target.value })}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextControlled<GuiaFormValues>
          name="dni"
          control={control}
          label="DNI"
          placeholder="Opcional"
          size="small"
          inputProps={{ inputMode: "numeric", maxLength: 20 }}
          onChange={(event) => setPayload({ ...payload, dni: event.target.value })}
        />
        <TextControlled<GuiaFormValues>
          name="telefono"
          control={control}
          label="Teléfono"
          size="small"
          inputProps={{ inputMode: "tel", maxLength: 30 }}
          onChange={(event) => setPayload({ ...payload, telefono: event.target.value })}
        />
      </div>
      <TextControlled<GuiaFormValues>
        name="clasificacion"
        control={control}
        label="Clasificación"
        placeholder="Ej: Oficial"
        size="small"
        transform={(value) => value.toUpperCase()}
        onChange={(event) => setPayload({ ...payload, clasificacion: event.target.value })}
      />
      <TextControlled<GuiaFormValues>
        name="observaciones"
        control={control}
        label="Observaciones"
        size="small"
        multiline
        rows={3}
        transform={(value) => value.toUpperCase()}
        onChange={(event) => setPayload({ ...payload, observaciones: event.target.value })}
      />
      {payload.editingId ? (
        <select
          value={payload.activo === "0" ? "0" : "1"}
          onChange={(event) => setPayload({ ...payload, activo: event.target.value })}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
        >
          <option value="1">Activo</option>
          <option value="0">Inactivo</option>
        </select>
      ) : null}
    </form>
  );
};

const GuideList = () => {
  const { guias, isLoading, error, refresh, saveGuia } = useGuias();
  const openDialog = useDialogStore((state) => state.openDialog);
  const access = useMaintenanceAccessResolver()("maintenance.guides");

  const openGuiaModal = useCallback((mode: "create" | "edit", guia?: Guia) => {
    if ((mode === "create" && !access.create) || (mode === "edit" && !access.edit)) return;
    const editingId = mode === "edit" ? String(guia?.idGuia ?? "") : "";
    openDialog({
      title: mode === "create" ? "Crear guía" : "Editar guía",
      description: "Registra los datos usados al asignar guías a las salidas.",
      size: "md",
      confirmLabel: "Guardar guía",
      cancelLabel: "Cancelar",
      initialPayload: {
        idRegion: guia?.idRegion ? String(guia.idRegion) : "",
        nombre: guia?.nombre ?? "",
        dni: guia?.dni ?? "",
        telefono: guia?.telefono ?? "",
        clasificacion: guia?.clasificacion ?? "",
        observaciones: guia?.observaciones ?? "",
        activo: guia?.activo === false ? "0" : "1",
        editingId,
      },
      content: ({ payload, setPayload }) => (
        <GuiaDialogForm payload={payload as GuiaDialogPayload} setPayload={setPayload} />
      ),
      onConfirm: async (data) => {
        const idRegion = Number(data.idRegion ?? 0);
        const nombre = String(data.nombre ?? "").trim();
        if (!idRegion || !nombre) {
          showToast({ title: "Atención", description: "Región y nombre son requeridos.", type: "warning" });
          throw new Error("Región y nombre son requeridos.");
        }
        const payload: SaveGuiaPayload = {
          idGuia: Number(data.editingId ?? editingId) || 0,
          idRegion,
          region: "",
          nombre,
          dni: String(data.dni ?? "").trim(),
          telefono: String(data.telefono ?? "").trim(),
          clasificacion: String(data.clasificacion ?? "").trim(),
          observaciones: String(data.observaciones ?? "").trim(),
          activo: String(data.activo ?? "1") !== "0",
        };
        const id = await saveGuia(payload);
        if (!id) throw new Error("No se pudo guardar el guía.");
        await refresh();
        showToast({ title: "Éxito", description: "Guía guardado correctamente.", type: "success" });
        return true;
      },
    });
  }, [access.create, access.edit, openDialog, refresh, saveGuia]);

  const columns = useMemo(() => {
    const helper = createColumnHelper<Guia>();
    return [
      helper.accessor("region", { header: "Región" }),
      helper.accessor("nombre", { header: "Nombre" }),
      helper.accessor("dni", { header: "DNI", cell: (info) => info.getValue() || "-" }),
      helper.accessor("telefono", { header: "Teléfono", cell: (info) => info.getValue() || "-" }),
      helper.accessor("clasificacion", { header: "Clasificación", cell: (info) => info.getValue() || "-" }),
      helper.accessor("observaciones", { header: "Observaciones", cell: (info) => info.getValue() || "-" }),
      helper.accessor("activo", { header: "Estado", cell: (info) => info.getValue() ? "ACTIVO" : "INACTIVO" }),
      helper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <button
            type="button"
            disabled={!access.edit}
            onClick={(event) => { event.stopPropagation(); openGuiaModal("edit", row.original); }}
            className="text-blue-600 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ),
      }),
    ];
  }, [access.edit, openGuiaModal]);

  return (
    <MaintenancePageFrame title="Guías" description="Registra los guías disponibles por región.">
      {error ? <p className="px-1 pb-2 text-sm text-red-600">No se pudo cargar el listado: {error.message}</p> : null}
      <DndTable
        columns={columns}
        data={guias}
        isLoading={isLoading}
        enableDateFilter={false}
        emptyMessage="No hay guías registrados"
        onRowClick={(guia) => openGuiaModal("edit", guia)}
        headerAction={
          <button
            type="button"
            disabled={!access.create}
            onClick={() => openGuiaModal("create")}
            title="Crear guía"
            aria-label="Crear guía"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default GuideList;
