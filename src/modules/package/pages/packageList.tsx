import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Calendar } from "lucide-react";

import DndTable from "../../../components/dataTabla/DndTable";
import { usePackageStore } from "../store/packageStore";
import { hasServiciosData, serviciosDB } from "@/app/db/serviciosDB";

/* =========================
   HELPERS
========================= */

const todayISO = () => new Date().toISOString().slice(0, 10);

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
        id: Number(id),
        destino,
        fecha,
        cantTotalPax: Number(cantTotalPax),
        cantMaxPax: Number(cantMaxPax),
        disponibles: Number(disponibles),
        estado,
        verListadoUrl: "#",
      };
    })
    .filter(Boolean);
}

/* =========================
   COMPONENT
========================= */

const PackageList = () => {
  /* =========================
     STATES
  ========================= */

  const [fecha, setFecha] = useState<string>(todayISO());
  const [productId, setProductId] = useState<string>("");
  const [productos, setProductos] = useState<any[]>([]);
  const [destino, setDestino] = useState<string>("");
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);
  const {
    packages,
    loadPackages,
    loading,
    loadServicios,
    loadServiciosFromDB,
    createProgramacion,
    deleteProgramacion,
  } = usePackageStore();
  console.log("packages", packages);
  const navigate = useNavigate();

  /* =========================
     INIT
  ========================= */

  useEffect(() => {
    const init = async () => {
      // productos desde IndexedDB
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
    loadPackages(fecha);
  }, [fecha, loadPackages]);

  /* =========================
     NORMALIZED DATA
  ========================= */

  const parsedPackages = useMemo(() => parsePackages(packages), [packages]);

  /* =========================
     TABLE
  ========================= */

  const handleRowClick = (row: { id?: number }) => {
    if (row?.id) {
      navigate(`/package/${row.id}/passengers/new`);
    }
  };

  const handleCantMaxChange = (id: number, value: number, row: any) => {
    console.log(
      "Actualizar cantMaxPax:",
      { id, value },
      row.original.idDetalle,
      packages
    );
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "destino",
        header: "Destino",
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
      },
      {
        accessorKey: "cantTotalPax",
        header: "Total Pax",
        meta: { align: "center" },
      },
      {
        accessorKey: "cantMaxPax",

        header: "Max Pax",
        cell: ({ row }: any) => (
          <input
            type="number"
            min={0}
            defaultValue={row.original.cantMaxPax}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) =>
              handleCantMaxChange(row.original.id, Number(e.target.value), row)
            }
            className="w-20 border border-slate-300 rounded-md px-2 py-1 text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ),
        meta: { align: "center" },
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
                handleRowClick({ id: row.original.id });
              }}
              className={`
    w-28 px-3 py-1.5
    rounded-lg text-xs font-semibold
    text-center whitespace-nowrap
    transition
    ${
      row.original.estado === "BLOQUEADO"
        ? "bg-red-100 text-red-700 hover:bg-red-200"
        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
    }
  `}
            >
              {row.original.estado}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick({ id: row.original.id });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-emerald-100 text-emerald-700
                hover:bg-emerald-200 transition"
            >
              VER LISTADO
            </button>
          </div>
        ),
      },
    ],
    [handleRowClick]
  );

  /* =========================
     ADD BUTTON HANDLER
  ========================= */

  const handleAddServicio = async () => {
    if (!productId) {
      alert("Seleccione un producto");
      return;
    }

    try {
      await createProgramacion({
        idProducto: Number(productId),
        destino: destino,
        fecha,
        cantMax: 0,
        region: "SUR",
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  /* =========================
     RENDER
  ========================= */

  const onTableRowClick = (row) => {
    console.log("ID (idDetalle):", row.id); // El idDetalle
    console.log("Datos:", row);

    // Puedes hacer lo que necesites aquí
    // navigate(`/package/${row.original.idDetalle}/passengers/new`);
  };
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
              await deleteProgramacion(idToDelete, fecha); // pasar fecha para refrescar tabla
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

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 ">
        <div className="flex flex-wrap items-end gap-3">
          {/* Fecha */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Fecha de viaje
            </label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={16}
                />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-[180px] pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg
            bg-white transition-all duration-200
            hover:border-slate-400
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => setFecha(todayISO())}
                className="px-2.5 py-2 text-xs font-medium text-emerald-700 
          bg-emerald-50 rounded-lg border border-emerald-200
          hover:bg-emerald-100 hover:border-emerald-300
          transition-all duration-200 whitespace-nowrap"
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Destino */}
          <div className="w-full sm:w-auto sm:flex-1 sm:max-w-[280px]">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Destino
            </label>
            <select
              value={productId}
              onChange={(e) => {
                const selectedIndex = e.target.selectedIndex;
                setDestino(e.target.options[selectedIndex].text);
                setProductId(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg
        bg-white transition-all duration-200
        hover:border-slate-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3c%2Fpolyline%3E%3c%2Fsvg%3E')]
        bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-9"
            >
              <option value="">Seleccione un destino</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Botón agregar */}
          <button
            type="button"
            onClick={handleAddServicio}
            disabled={!productId || !fecha}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2
      bg-green-600 text-white text-sm font-medium rounded-lg
      hover:bg-green-700 active:bg-green-800
      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
      transition-all duration-200 shadow-sm hover:shadow
      disabled:opacity-50 disabled:cursor-not-allowed"
            title="Agregar servicio"
          >
            <Plus size={20} />
          </button>

          {/* 🔹 Botón Guardar (al final) */}
          <div className="w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2
        bg-blue-600 text-white text-sm font-semibold rounded-lg
        hover:bg-blue-700 active:bg-blue-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <DndTable
        data={parsedPackages}
        columns={columns}
        isLoading={loading}
        enableDateFilter={false}
        enableSearching={false}
        enableRowSelection={true}
        onRowClick={(row) => onTableRowClick(row)}
        onSelectionChange={setSelectedPackages}
      />
    </div>
  );
};

export default PackageList;
