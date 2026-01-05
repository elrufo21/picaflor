import { useMemo } from "react";
import DndTable from "../../../components/dataTabla/DndTable";
import { useDialogStore } from "../../../app/store/dialogStore";
import { usePackageStore } from "../store/packageStore";
import { useNavigate } from "react-router";

const PackageList = () => {
  const openDialog = useDialogStore((state) => state.openDialog);
  const packages = usePackageStore((state) => state.packages);
  const addPackage = usePackageStore((state) => state.addPackage);
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 text-emerald-600 rounded"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 text-emerald-600 rounded"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "destino",
        header: "Destino",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {String(info.getValue()).charAt(0)}
            </div>
            <span className="font-medium">{info.getValue()}</span>
          </div>
        ),
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: (info) => (
          <span className="text-slate-700">
            {new Date(String(info.getValue())).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        ),
      },
      { accessorKey: "cantTotalPax", header: "CanTotalPax" },
      { accessorKey: "cantMaxPax", header: "CantMaxPax" },
      { accessorKey: "disponibles", header: "Disponibles" },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const estado = info.getValue() as string;
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                estado === "BLOQUEADO"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {estado}
            </span>
          );
        },
      },
      {
        id: "verListado",
        header: "VerListado",
        cell: ({ row }) => (
          <a
            className="text-blue-700 underline text-sm"
            href={row.original.verListadoUrl || "#"}
          >
            Ver listado
          </a>
        ),
      },
    ],
    []
  );

  const handleRowClick = (row: { id?: number }) => {
    if (row?.id) navigate(`/package/${row.id}/passengers/new`);
  };

  const handleNewPackage = () => {
    const estadoOptions = [
      { value: "BLOQUEADO", label: "Bloqueado" },
      { value: "DISPONIBLE", label: "Disponible" },
    ];

    openDialog({
      title: "Nuevo paquete",
      description: "Completa los datos para registrar un paquete.",
      size: "md",
      initialPayload: {
        destino: "",
        fecha: new Date().toISOString().slice(0, 10),
        cantTotalPax: 0,
        cantMaxPax: 0,
        disponibles: 0,
        estado: estadoOptions[0].value,
        verListadoUrl: "#",
      },
      content: ({ payload, setPayload }) => (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Destino</span>
            <input
              type="text"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={String(payload.destino ?? "")}
              onChange={(e) =>
                setPayload({ ...payload, destino: e.target.value })
              }
              placeholder="Ej: FULL DAY PARACAS - ICA"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Fecha</span>
            <input
              type="date"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={String(payload.fecha ?? "")}
              onChange={(e) =>
                setPayload({ ...payload, fecha: e.target.value })
              }
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Estado</span>
            <select
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={String(payload.estado ?? "")}
              onChange={(e) =>
                setPayload({ ...payload, estado: e.target.value })
              }
            >
              {estadoOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-3">
            {["cantTotalPax", "cantMaxPax", "disponibles"].map((key) => (
              <label
                key={key}
                className="flex flex-col gap-1 text-sm text-slate-700"
              >
                <span className="font-medium">
                  {key === "cantTotalPax"
                    ? "CanTotalPax"
                    : key === "cantMaxPax"
                      ? "CantMaxPax"
                      : "Disponibles"}
                </span>
                <input
                  type="number"
                  min={0}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={Number((payload as any)[key] ?? 0)}
                  onChange={(e) =>
                    setPayload({
                      ...payload,
                      [key]: Number(e.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      ),
      onConfirm: (data) => {
        addPackage({
          destino: String(data.destino ?? ""),
          fecha: String(data.fecha ?? new Date().toISOString().slice(0, 10)),
          cantTotalPax: Number(data.cantTotalPax ?? 0),
          cantMaxPax: Number(data.cantMaxPax ?? 0),
          disponibles: Number(data.disponibles ?? 0),
          estado: String(data.estado ?? "BLOQUEADO"),
          verListadoUrl: String(data.verListadoUrl ?? "#"),
        });
      },
    });
  };

  return (
    <div className="w-full ">
      <div className="flex w-full justify-end ">
        <div>
          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md"
            onClick={handleNewPackage}
          >
            Nuevo Paquete
          </button>
        </div>
      </div>
      <DndTable data={packages} columns={columns} onRowClick={handleRowClick} />
    </div>
  );
};

export default PackageList;
