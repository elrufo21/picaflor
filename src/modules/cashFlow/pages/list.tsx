import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { cashFlowSeeds } from "../data/cashFlowSeeds";
import type { CashFlowRecord } from "../types";

const formatDate = (value: string) => {
  if (!value) return "Pendiente";
  const date = new Date(value);
  return date.toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const sumVentaTotal = (record: CashFlowRecord) =>
  (record.ventaTotal.efectivo ?? 0) +
  (record.ventaTotal.tarjeta ?? 0) +
  (record.ventaTotal.deposito ?? 0);

const sumConteo = (record: CashFlowRecord) =>
  record.conteoMonedas.reduce((sum, item) => {
    const cantidad = Number(item.cantidad || 0);
    return sum + cantidad * item.denominacion;
  }, 0);

const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`;

const CashFlowList = () => {
  const navigate = useNavigate();
  const columnHelper = createColumnHelper<CashFlowRecord>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("caja", {
        header: "Caja",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor((row) => row.encargado?.label ?? "Sin asignar", {
        id: "encargado",
        header: "Encargado",
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: (info) => (
          <span
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
              info.getValue() === "ABIERTA"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("fechaApertura", {
        header: "Apertura",
        cell: (info) => formatDate(info.getValue() ?? ""),
      }),
      columnHelper.display({
        id: "totalVenta",
        header: "Venta total",
        cell: (info) => formatCurrency(sumVentaTotal(info.row.original)),
        meta: { align: "right" },
      }),
      columnHelper.display({
        id: "efectivoCaja",
        header: "Efectivo esperado",
        cell: (info) => formatCurrency(sumConteo(info.row.original)),
        meta: { align: "right" },
      }),
      columnHelper.display({
        id: "diferencial",
        header: "Diferencial",
        cell: (info) => {
          const efectivo = sumConteo(info.row.original);
          const ventas = sumVentaTotal(info.row.original);
          const diferencia = efectivo - ventas;
          return (
            <span
              className={`font-semibold ${
                diferencia > 0
                  ? "text-emerald-700"
                  : diferencia < 0
                    ? "text-red-600"
                    : "text-slate-800"
              } text-right block`}
            >
              {formatCurrency(diferencia)}
            </span>
          );
        },
        meta: { align: "right" },
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        cell: (info) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/cashflow/${info.row.original.id}/edit`);
            }}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Abrir
          </button>
        ),
        meta: { align: "center" },
      }),
    ],
    [columnHelper, navigate],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Control de flujo de caja
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/cashflow/create")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#E8612A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff5c1f]"
        >
          <Plus className="w-4 h-4" />
          Nuevo control
        </button>
      </header>

      <DndTable
        data={cashFlowSeeds}
        columns={columns}
        enableSearching
        enableSorting
        enablePagination
        emptyMessage="No hay registros de caja"
        onRowClick={(row) => navigate(`/cashflow/${row.id}/edit`)}
      />
    </div>
  );
};

export default CashFlowList;
