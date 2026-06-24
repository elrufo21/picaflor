import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";

import DndTable from "@/components/dataTabla/DndTable";
import { useAuthStore } from "@/store/auth/auth.store";
import { formatCurrency } from "@/shared/helpers/formatCurrency";
import { formatDate } from "@/shared/helpers/formatDate";
import { fetchPendingLiquidations, type SaleLiquidationRow } from "../api";

const ESTADO_OPTIONS = [
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Cancelados", value: "CANCELADO" },
] as const;

const TIPO_OPTIONS = [
  { label: "Todos", value: "TODOS" },
  { label: "Credito", value: "CREDITO" },
  { label: "A cuenta", value: "ACUENTA" },
] as const;

type EstadoFilter = (typeof ESTADO_OPTIONS)[number]["value"];
type TipoFilter = (typeof TIPO_OPTIONS)[number]["value"];

const normalizeFilter = (value?: string) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
const normalizeCurrency = (value?: string) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .includes("DOL")
    ? "DOLARES"
    : "SOLES";
const formatTotalsAmount = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const SaleLiquidationList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore((state) => state.user);
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("PENDIENTE");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("CREDITO");
  const [filteredRowsForTotals, setFilteredRowsForTotals] = useState<
    SaleLiquidationRow[] | null
  >(null);
  const areaId = authUser?.areaId ?? 0;
  const personalId = authUser?.personalId ?? 0;
  const { data: rows = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ["sale-liquidations", "pending", areaId, personalId],
    queryFn: () => fetchPendingLiquidations(areaId, personalId),
    staleTime: Infinity,
    refetchOnMount: (location.state as { useCache?: boolean } | null)?.useCache
      ? true
      : "always",
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const estado = normalizeFilter(row.estado);
      const condicion = normalizeFilter(row.condicion);

      if (estado !== estadoFilter) return false;
      if (tipoFilter === "TODOS") return true;

      return tipoFilter === "CREDITO"
        ? condicion === "CREDITO"
        : condicion === "ACUENTA" || (row.acuenta > 0 && row.saldo > 0);
    });
  }, [estadoFilter, rows, tipoFilter]);

  const totals = useMemo(
    () =>
      (filteredRowsForTotals ?? filteredRows).reduce(
        (acc, row) => {
          const currency = normalizeCurrency(row.moneda);
          const saldo = Number(row.saldo) || 0;
          const bucket =
            normalizeFilter(row.formaPago) === "EFECTIVO"
              ? "efectivo"
              : "depTarYa";
          const key =
            `${bucket}${currency === "DOLARES" ? "Dolares" : "Soles"}` as keyof typeof acc;
          acc[key] += saldo;
          return acc;
        },
        {
          efectivoDolares: 0,
          depTarYaDolares: 0,
          efectivoSoles: 0,
          depTarYaSoles: 0,
        },
      ),
    [filteredRows, filteredRowsForTotals],
  );

  const columns = useMemo(() => {
    const helper = createColumnHelper<SaleLiquidationRow>();

    return [
      helper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() =>
              navigate(`/sale-liquidation/${row.original.notaId}`, {
                state: { fromSaleList: true },
              })
            }
            className="text-xs font-semibold text-blue-800 cursor-pointer hover:text-slate-900"
          >
            Ver
          </button>
        ),
        meta: { align: "center" },
      }),
      helper.accessor("notaId", { header: "Nro Liquidaciòn" }),
      helper.accessor("documento", { header: "Documento" }),
      helper.accessor("fechaViaje", {
        header: "Fecha viaje",
        cell: (info) => formatDate(info.getValue()),
      }),
      helper.accessor("cliente", { header: "Cliente" }),
      helper.accessor("auxiliar", { header: "Canal de venta" }),
      helper.accessor("servicio", { header: "Servicio" }),
      helper.accessor("moneda", { header: "Moneda" }),
      helper.accessor("total", {
        header: "Total",
        cell: (info) => formatCurrency(info.getValue()),
        meta: { align: "right" },
      }),
      helper.accessor("acuenta", {
        header: "A cuenta",
        cell: (info) => formatCurrency(info.getValue()),
        meta: { align: "right" },
      }),
      helper.accessor("saldo", {
        header: "Saldo",
        cell: (info) => formatCurrency(info.getValue()),
        meta: { align: "right" },
      }),
      helper.accessor("estado", { header: "Estado" }),
      helper.accessor("counter", { header: "Counter" }),
    ];
  }, [navigate]);

  const Filters = () => (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-[360px] items-end gap-3">
        <div className="flex min-w-[140px] flex-col gap-1 text-xs text-slate-500">
          <label className="font-medium text-slate-600">Estado</label>
          <select
            value={estadoFilter}
            onChange={(event) =>
              setEstadoFilter(event.target.value as EstadoFilter)
            }
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {ESTADO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-[140px] flex-col gap-1 text-xs text-slate-500">
          <label className="font-medium text-slate-600">Tipo</label>
          <select
            value={tipoFilter}
            onChange={(event) =>
              setTipoFilter(event.target.value as TipoFilter)
            }
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {TIPO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <DndTable
        data={filteredRows}
        columns={columns}
        enableSorting={false}
        isLoading={loading || isFetching}
        emptyMessage="No se encontraron liquidaciones pendientes"
        enableFiltering={false}
        searchColumns={[
          "documento",
          "cliente",
          "servicio",
          "condicion",
          "formaPago",
          "estado",
          "counter",
          "notaId",
          "auxiliar",
        ]}
        dateFilterComponent={Filters}
        onFilteredDataChange={setFilteredRowsForTotals}
        paginationBottomContent={
          <div className="px-4 sm:px-6 py-3 bg-slate-50/60">
            <div className="overflow-x-auto">
              {estadoFilter === "PENDIENTE" ? (
                <table className="ml-auto min-w-[360px] text-right text-xs sm:text-sm">
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 align-top">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Deuda Dolares
                        </div>
                        <div className="font-semibold text-slate-900">
                          {formatTotalsAmount(
                            totals.efectivoDolares + totals.depTarYaDolares,
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top border-l border-slate-200">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Deuda Soles
                        </div>
                        <div className="font-semibold text-slate-900">
                          {formatTotalsAmount(
                            totals.efectivoSoles + totals.depTarYaSoles,
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="ml-auto min-w-[680px] text-right text-xs sm:text-sm">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="px-4 py-2 align-top">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Dolares - Efectivo
                        </div>
                        <div className="font-medium text-slate-800">
                          {formatTotalsAmount(totals.efectivoDolares)}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top border-l border-slate-200">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Dolares - Dep/Tar/Yape
                        </div>
                        <div className="font-medium text-slate-800">
                          {formatTotalsAmount(totals.depTarYaDolares)}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top border-l border-slate-200">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Dolares - Total
                        </div>
                        <div className="font-semibold text-slate-900">
                          {formatTotalsAmount(
                            totals.efectivoDolares + totals.depTarYaDolares,
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 align-top">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Soles - Efectivo
                        </div>
                        <div className="font-medium text-slate-800">
                          {formatTotalsAmount(totals.efectivoSoles)}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top border-l border-slate-200">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Soles - Dep/Tar/Yape
                        </div>
                        <div className="font-medium text-slate-800">
                          {formatTotalsAmount(totals.depTarYaSoles)}
                        </div>
                      </td>
                      <td className="px-4 py-2 align-top border-l border-slate-200">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Soles - Total
                        </div>
                        <div className="font-semibold text-slate-900">
                          {formatTotalsAmount(
                            totals.efectivoSoles + totals.depTarYaSoles,
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
};

export default SaleLiquidationList;
