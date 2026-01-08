import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Calendar } from "lucide-react";

import DndTable from "../../../components/dataTabla/DndTable";
import { usePackageStore } from "../store/packageStore";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";
import { toast } from "sonner";

/* =========================
   HELPERS
========================= */

const buildCantMaxString = (
  data: { idDetalle: number; cantMax: number }[]
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
    loadServicios,
    loadServiciosFromDB,
    createProgramacion,
    deleteProgramacion,
    editarCantMax,
    date,
    setDate,
  } = usePackageStore();
  console.log("cantMaxChanges", cantMaxChanges);
  const navigate = useNavigate();

  /* =========================
     INIT
  ========================= */

  useEffect(() => {
    const init = async () => {
      const data = await serviciosDB.productos.toArray();
      setProductos(data);

      const exists = await hasServiciosData();
      if (exists) {
        await loadServiciosFromDB();
      } else {
        await loadServicios();
      }
    };

    init();
  }, []);

  /* =========================
     LOAD PACKAGES BY DATE
  ========================= */

  useEffect(() => {
    loadPackages(date);
  }, [date, loadPackages]);

  /* =========================
     CLEAR CHANGES ON NEW DATA
  ========================= */

  useEffect(() => {
    setCantMaxChanges([]);
  }, [packages]);

  /* =========================
     NORMALIZED DATA
  ========================= */

  const parsedPackages = useMemo(() => parsePackages(packages), [packages]);

  /* =========================
     HANDLERS
  ========================= */

  const handleRowClick = useCallback(
    (row: { id?: number }) => {
      if (row?.id) {
        navigate(`/package/${row.id}/passengers/new`);
      }
    },
    [navigate]
  );

  const handleCantMaxChange = (id: number, value: number, row: any) => {
    console.log("Row", row.original);
    const idDetalle = row.original.idDetalle;

    setCantMaxChanges((prev) => {
      const exists = prev.find((p) => p.idDetalle === idDetalle);

      if (exists) {
        return prev.map((p) =>
          p.idDetalle === idDetalle ? { ...p, cantMax: value } : p
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
    console.log("rs", rs);
    if (cantMaxChanges.length === 0) {
      alert("No hay cambios para guardar");
      return;
    }

    try {
      await editarCantMax(cantMaxChanges, date);
      setCantMaxChanges([]);
    } catch (e: any) {
      alert(e.message);
    }
    /**  if (cantMaxChanges.length === 0) {
      alert("No hay cambios para guardar");
      return;
    }

    try {
      for (const item of cantMaxChanges) {
        await createProgramacion({
          idDetalle: item.idDetalle,
          cantMax: item.cantMax,
          fecha,
        });
      }

      setCantMaxChanges([]);
      loadPackages(fecha);
    } catch (e: any) {
      alert(e.message);
    } */
  };

  const handleAddServicio = async () => {
    if (!productId) {
      alert("Seleccione un producto");
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
        toast.error("Ya existe este registro");
        return;
      }
      toast.success("Se agrego el registro correctamente");
    } catch (e: any) {
      alert(e.message);
    }
  };

  /* =========================
     TABLE COLUMNS
  ========================= */
  console.log("packages", packages);
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
              defaultValue={row.original.cantMaxPax}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) =>
                handleCantMaxChange(
                  row.original.id,
                  Number(e.target.value),
                  row
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
        cell: ({ row }: any) => (
          <div className="flex justify-end gap-2">
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
                if (row.original.estado === "BLOQUEADO") return;
                e.stopPropagation();
                // handleRowClick({ id: row.original.id });
              }}
              className={`w-28 px-3 py-1.5 rounded-lg text-xs font-semibold
                ${
                  row.original.estado === "BLOQUEADO"
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
            >
              {row.original.accionTexto}
            </button>
          </div>
        ),
      },
    ],
    [handleRowClick]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedPackages.length === 0) {
          console.log("No hay filas seleccionadas");
          return;
        }

        // 🔥 función async interna
        const deleteSelected = async () => {
          try {
            for (const pkg of selectedPackages) {
              const idToDelete = pkg.idDetalle ?? pkg.id;
              await deleteProgramacion(idToDelete, date); // pasar fecha para refrescar tabla
            }

            console.log("Eliminados:", selectedPackages);
            setSelectedPackages([]);
          } catch (err) {
            console.error("Error eliminando:", err);
            // opcional: mostrar notificación al usuario
          }
        };

        deleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPackages, deleteProgramacion]);

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* FECHA */}
          <div>
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
                className="pl-9 pr-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>

          {/* DESTINO */}
          <div className="flex-1 max-w-xs">
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            <Plus size={18} />
          </button>

          {/* GUARDAR */}
          <button
            onClick={handleGuardarCambios}
            className="ml-auto px-5 py-2 bg-blue-600 text-white rounded-lg"
          >
            Guardar
          </button>
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
      />
    </div>
  );
};

export default PackageList;
