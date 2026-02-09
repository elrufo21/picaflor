import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Plus, Calendar, RefreshCw } from "lucide-react";

import DndTable from "../../../components/dataTabla/DndTable";
import { usePackageStore } from "../store/cityTourStore";
import { serviciosDB } from "@/app/db/serviciosDB";
import { refreshServiciosData } from "@/app/db/serviciosSync";
import { showToast } from "../../../components/ui/AppToast";
import { useDialogStore } from "@/app/store/dialogStore";

/* =========================
   HELPERS
========================= */

const buildCantMaxString = (
  data: { idDetalle: number; cantMax: number }[],
): string => {
  return data.map((item) => `${item.idDetalle}|${item.cantMax}`).join(";");
};

const todayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 🔥 PARSER BACKEND → TABLE
function parsePackages(raw: any) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];

  const rows = raw
    .split("¬")
    .map((r) => r.trim())
    .filter(Boolean);

  return rows
    .map((row) => {
      const cols = row.split("|");
      if (cols.length < 7) return null;

      const [
        id,
        destino,
        fecha,
        cantTotalPax,
        cantMaxPax,
        disponibles,
        estado,
      ] = cols;

      return {
        id: Number(id), // idDetalle
        destino,
        fecha,
        cantTotalPax: Number(cantTotalPax),
        cantMaxPax: Number(cantMaxPax),
        disponibles: Number(disponibles),
        estado,
      };
    })
    .filter(Boolean);
}

/* =========================
   TYPES
========================= */

type CantMaxChange = {
  idDetalle: number;
  cantMax: number;
};

/* =========================
   COMPONENT
========================= */

const PackageList = () => {
  /* =========================
     STATES
  ========================= */

  const [productId, setProductId] = useState<string>("");
  const [productos, setProductos] = useState<any[]>([]);
  const [destino, setDestino] = useState<string>("");
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);
  const [cantMaxChanges, setCantMaxChanges] = useState<CantMaxChange[]>([]);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const {
    packages,
    loadPackages,
    loading,
    loadServiciosFromDB,
    createProgramacion,
    deleteProgramacion,
    editarCantMax,
    date,
    setDate,
    setSelectedFullDayName,
  } = usePackageStore();
  const navigate = useNavigate();
  const openDialog = useDialogStore((state) => state.openDialog);

  const location = useLocation();
  useEffect(() => {
    let canceled = false;

    const refreshServices = async () => {
      try {
        await refreshServiciosData();
        await loadServiciosFromDB();
        const data = await serviciosDB.productosCityTourOrdena.toArray();
        if (!canceled) {
          setProductos(data);
        }
      } catch (err) {
        console.error("Error recargando servicios de City Tour", err);
      }
    };

    refreshServices();

    return () => {
      canceled = true;
    };
  }, [location.pathname, loadServiciosFromDB]);

  useEffect(() => {
    loadPackages(date);
  }, [date, loadPackages]);

  useEffect(() => {
    setCantMaxChanges([]);
    setSelectedPackages([]);
  }, [packages]);

  const parsedPackages = useMemo(() => parsePackages(packages), [packages]);

  const handleRowClick = useCallback(
    (row: { id?: number }) => {
      if (row?.id) {
        navigate(`/cityTour/${row.id}/passengers/new`);
      }
    },
    [navigate],
  );

  const handleListadoClick = useCallback(
    (row: { id?: number; idProducto?: number }) => {
      const idProducto = row?.idProducto ?? row?.id;
      if (!idProducto) return;
      setSelectedFullDayName(row?.destino ?? "");
      navigate(`/cityTour/${idProducto}/listado`);
    },
    [navigate, setSelectedFullDayName],
  );

  const handleCantMaxChange = (id: number, value: number, row: any) => {
    const idDetalle = row.original.idDetalle;

    setCantMaxChanges((prev) => {
      const exists = prev.find((p) => p.idDetalle === idDetalle);

      if (exists) {
        return prev.map((p) =>
          p.idDetalle === idDetalle ? { ...p, cantMax: value } : p,
        );
      }

      return [
        ...prev,
        {
          idDetalle,
          cantMax: value,
        },
      ];
    });
  };

  const handleGuardarCambios = async () => {
    const rs = buildCantMaxString(cantMaxChanges);
    if (cantMaxChanges.length === 0) {
      showToast({
        title: "Sin cambios",
        description: "No hay cambios para guardar",
        type: "info",
      });
      return;
    }

    try {
      await editarCantMax(cantMaxChanges, date);
      setCantMaxChanges([]);
      showToast({
        title: "Guardado",
        description: "Cambios guardados correctamente",
        type: "success",
      });
    } catch (e: any) {
      showToast({ title: "Error", description: e.message, type: "error" });
    }
  };

  const handleAddServicio = async () => {
    if (!productId) {
      showToast({
        title: "Atención",
        description: "Seleccione un producto",
        type: "warning",
      });
      return;
    }

    try {
      const result = await createProgramacion({
        idProducto: Number(productId),
        destino,
        fecha: date,
        cantMax: 0,
        region: "SUR",
      });
      if (result === "EXISTE") {
        showToast({
          title: "Error",
          description: "Ya existe este registro",
          type: "error",
        });
        return;
      }
      /* showToast({
        title: "Éxito",
        description: "Se agrego el registro correctamente",
        type: "success",
      });*/
    } catch (e: any) {
      showToast({ title: "Error", description: e.message, type: "error" });
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "destino", header: "Destino" },
      { accessorKey: "fecha", header: "Fecha" },
      {
        accessorKey: "cantTotalPax",
        header: "Total Pax",
        meta: { align: "center" },
      },
      {
        accessorKey: "cantMaxPax",
        header: "Max Pax",
        meta: { align: "center" },
        cell: ({ row, table }: any) => {
          const rowIndex = row.index;
          const rowId = row.original.idDetalle ?? row.original.id;

          return (
            <input
              ref={(el) => {
                inputRefs.current[rowIndex] = el;
              }}
              type="number"
              min={0}
              defaultValue={
                row.original.cantMaxPax === 0 ? "" : row.original.cantMaxPax
              }
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) =>
                handleCantMaxChange(
                  row.original.id,
                  Number(e.target.value),
                  row,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "Enter") {
                  e.preventDefault();
                  const next = inputRefs.current[rowIndex + 1];
                  next?.focus();
                }

                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prev = inputRefs.current[rowIndex - 1];
                  prev?.focus();
                }
              }}
              className="w-20 text-center border border-slate-300 rounded-md px-2 py-1 text-sm
          focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          );
        },
      },

      {
        accessorKey: "disponibles",
        header: "Disponibles",
        meta: { align: "center" },
      },
      {
        id: "action",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }: any) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (row.original.estado === "BLOQUEADO") return;
                handleRowClick({ id: row.original.id });
              }}
              className={`w-28 px-3 py-1.5 rounded-lg text-xs font-semibold
                ${
                  row.original.estado === "BLOQUEADO"
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
            >
              {row.original.estado}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (row.original.estado === "BLOQUEADO") return;
                handleListadoClick(row.original);
              }}
              className={`w-28 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200
                `}
            >
              {row.original.accionTexto}
            </button>
          </div>
        ),
      },
    ],
    [handleRowClick, handleListadoClick],
  );

  const confirmDeleteSelected = useCallback(() => {
    if (selectedPackages.length === 0) {
      return;
    }

    openDialog({
      title: "Eliminar registros",
      size: "sm",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        try {
          for (const pkg of selectedPackages) {
            const idToDelete = pkg.idDetalle ?? pkg.id;
            await deleteProgramacion(idToDelete, date);
          }

          setSelectedPackages([]);
        } catch (err) {
          console.error("Error eliminando:", err);
        }
      },
      content: () => (
        <p className="text-sm text-slate-700">
          Deseas eliminar{" "}
          {selectedPackages.length === 1 ? "este registro" : "estos registros"}?
          <br />
          Esta accion no se puede deshacer.
        </p>
      ),
    });
  }, [selectedPackages, deleteProgramacion, date, openDialog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        confirmDeleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmDeleteSelected]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col gap-4 w-full md:flex-row md:items-end">
          {/* FECHA */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fecha
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>

          {/* DESTINO */}
          <div className="w-full md:max-w-xs">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Destino
            </label>
            <select
              value={productId}
              onChange={(e) => {
                const i = e.target.selectedIndex;
                setDestino(e.target.options[i].text);
                setProductId(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">Seleccione</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* AGREGAR */}
          <button
            onClick={handleAddServicio}
            className="
              w-full md:w-auto
              px-4 py-2
              bg-emerald-600 text-white
              rounded-lg
              hover:bg-emerald-700
              transition
              flex justify-center
            "
          >
            <Plus size={18} />
          </button>

          {/* BOTONES DERECHA */}
          <div
            className="
        w-full
        flex gap-2
        flex-col sm:flex-row
        md:ml-auto md:w-auto
      "
          >
            <button
              onClick={handleGuardarCambios}
              className="
          w-full sm:w-auto
          px-5 py-2
          rounded-lg
          bg-blue-600 text-white
          hover:bg-blue-700
          transition
        "
            >
              Guardar
            </button>

            <button
              onClick={() => loadPackages(date)}
              title="Refrescar"
              className="
          w-full sm:w-auto
          p-2
          rounded-lg
          bg-emerald-500
          text-slate-100
          hover:bg-emerald-600
          transition
          flex justify-center items-center
        "
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <DndTable
        data={parsedPackages.filter((c) => c.id)}
        columns={columns}
        isLoading={loading}
        enableRowSelection
        onSelectionChange={setSelectedPackages}
        enableDateFilter={false}
        enableSearching={false}
        enableFiltering={false}
        enableSorting={false}
      />
    </div>
  );
};

export default PackageList;
