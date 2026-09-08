import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, RefreshCw, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import * as XLSX from "xlsx-js-style";

import { fetchEgresosFecha, fetchPedidosFecha, type Egreso } from "../api/fulldayApi";
import { useAuthStore } from "@/store/auth/auth.store";
import { serviciosDB } from "@/app/db/serviciosDB";
import { refreshServiciosData } from "@/app/db/serviciosSync";

type FullDay = { fecha?: string; id?: number; idProducto?: number; destino?: string };
type ProductOption = { id: number; name: string };
type SaleRow = {
  id: string;
  producto: string;
  counter: string;
  pasajeros: number;
  total: number;
  moneda: "SOLES" | "DOLARES";
  servicio: "FULL DAY" | "CITY TOUR";
};

const number = (value: unknown) => {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCurrency = (value: string): SaleRow["moneda"] =>
  /DOL|USD|\$/.test(value.toUpperCase()) ? "DOLARES" : "SOLES";

const dateToInput = (value?: string) => {
  const match = String(value ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? String(value)
    : new Date().toLocaleDateString("en-CA");
};

const displayDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);

const parseSales = (payload: string): SaleRow[] =>
  String(payload ?? "")
    .replace(/~/g, "¬")
    .split("¬")
    .map((line, index) => {
      const raw = line.split("|").map((value) => value.trim());
      if (!raw[0] || raw[0].toUpperCase() === "NOTAID") return null;

      // Algunos listados antiguos insertan clienteId en la posición 6.
      const values = raw.length >= 56 ? raw.filter((_, i) => i !== 6) : raw;
      const flag = values[51] ?? "";
      const servicio =
        flag === "1" ? "FULL DAY" : flag === "2" ? "CITY TOUR" : "";
      if (!servicio) return null;

      return {
        id: values[0] || String(index),
        producto: values[3] || servicio,
        counter: values[9] || "Sin counter",
        pasajeros: number(values[10]),
        total: number(values[17]),
        moneda: normalizeCurrency(values[43] ?? ""),
        servicio,
      } as SaleRow;
    })
    .filter((row): row is SaleRow => Boolean(row));

export default function FullDayUtilityDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const fullDay = (location.state as { fullDay?: FullDay } | null)?.fullDay;
  const [date, setDate] = useState(() => dateToInput(fullDay?.fecha));
  const [productId, setProductId] = useState(() => String(fullDay?.idProducto ?? fullDay?.id ?? ""));
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [exchangeRate, setExchangeRate] = useState("3.4");
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [expenses, setExpenses] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSales = useCallback(async () => {
    const areaId = Number(user?.areaId ?? user?.area ?? 0);
    const usuarioId = Number(user?.id ?? 0);
    if (!areaId || !usuarioId) {
      setError("No se pudo identificar al usuario para cargar las ventas.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [payload, egresos] = await Promise.all([
        fetchPedidosFecha({
          fechaInicio: date,
          fechaFin: date,
          areaId,
          usuarioId,
          esViaje: true,
        }),
        fetchEgresosFecha(date),
      ]);
      setSales(parseSales(payload));
      setExpenses(egresos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  }, [date, user]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await refreshServiciosData();
        const destinos = await serviciosDB.productos.toArray();
        if (!cancelled) {
          setProducts(
            destinos
              .map((producto) => ({ id: producto.id, name: producto.nombre.trim() }))
              .filter((producto) => producto.name),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los destinos.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((item) => String(item.id) === productId),
    [productId, products],
  );
  const filteredSales = useMemo(
    () =>
      selectedProduct
        ? sales.filter((sale) => sale.producto.trim().toLowerCase() === selectedProduct.name.toLowerCase())
        : sales,
    [sales, selectedProduct],
  );
  const filteredExpenses = useMemo(
    () => (productId ? expenses.filter((expense) => String(expense.idProducto) === productId) : expenses),
    [expenses, productId],
  );

  const totals = useMemo(() => {
    const soles = filteredSales
      .filter((sale) => sale.moneda === "SOLES")
      .reduce((sum, sale) => sum + sale.total, 0);
    const dollars = filteredSales
      .filter((sale) => sale.moneda === "DOLARES")
      .reduce((sum, sale) => sum + sale.total, 0);
    const rate = number(exchangeRate);
    const egresos = filteredExpenses.reduce((sum, expense) => sum + Number(expense.monto || 0), 0);
    return {
      soles,
      dollars,
      rate,
      total: soles + dollars * rate,
      egresos,
      utilidad: soles + dollars * rate - egresos,
      pasajeros: filteredSales.reduce((sum, sale) => sum + sale.pasajeros, 0),
    };
  }, [exchangeRate, filteredExpenses, filteredSales]);

  const salesInSoles = useCallback(
    (sale: SaleRow) => sale.total * (sale.moneda === "DOLARES" ? totals.rate : 1),
    [totals.rate],
  );

  const byCounter = useMemo(
    () =>
      Object.values(
        filteredSales.reduce<Record<string, { name: string; pasajeros: number; total: number }>>(
          (result, sale) => {
            const name = sale.counter.trim() || "Sin counter";
            const item = (result[name] ??= { name, pasajeros: 0, total: 0 });
            item.pasajeros += sale.pasajeros;
            item.total += salesInSoles(sale);
            return result;
          },
          {},
        ),
      ).sort((a, b) => b.total - a.total),
    [filteredSales, salesInSoles],
  );

  const byTour = useMemo(
    () =>
      Object.values(
        filteredSales.reduce<Record<string, { name: string; service: string; total: number }>>(
          (result, sale) => {
            const key = `${sale.servicio}|${sale.producto}`;
            const item = (result[key] ??= {
              name: sale.producto,
              service: sale.servicio,
              total: 0,
            });
            item.total += salesInSoles(sale);
            return result;
          },
          {},
        ),
      ).sort((a, b) => b.total - a.total),
    [filteredSales, salesInSoles],
  );

  const byExpense = useMemo(
    () =>
      Object.values(
        filteredExpenses.reduce<Record<string, { concept: string; total: number }>>(
          (result, expense) => {
            const concept = expense.concepto || "Sin concepto";
            const item = (result[concept] ??= { concept, total: 0 });
            item.total += Number(expense.monto || 0);
            return result;
          },
          {},
        ),
      ).sort((a, b) => b.total - a.total),
    [filteredExpenses],
  );

  const hasDollars = totals.dollars > 0;

  const downloadExcel = () => {
    const border = { style: "thin", color: { rgb: "D7DEE8" } };
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "EA580C" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { top: border, bottom: border, left: border, right: border },
    };
    const money = '"S/" #,##0.00';
    const addTableStyle = (sheet: XLSX.WorkSheet, headerRow: number, lastRow: number, columns: number) => {
      for (let column = 0; column < columns; column += 1) {
        const header = sheet[XLSX.utils.encode_cell({ r: headerRow, c: column })];
        if (header) header.s = headerStyle;
      }
      for (let row = headerRow + 1; row <= lastRow; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
          if (!cell) continue;
          cell.s = {
            fill: { fgColor: { rgb: row % 2 ? "FFF7ED" : "FFFFFF" } },
            border: { top: border, bottom: border, left: border, right: border },
            alignment: { vertical: "center", horizontal: column ? "right" : "left" },
          };
        }
      }
    };
    const counterRows = byCounter.length
      ? byCounter.map((item) => [item.name, item.pasajeros, item.total])
      : [["Sin ventas", 0, 0]];
    const expenseRows = byExpense.length
      ? byExpense.map((item) => [item.concept, item.total])
      : [["Sin egresos", 0]];

    const summaryRows: (string | number)[][] = [
      ["PICAFLOR · RESUMEN DIARIO"],
      [`Fecha de viaje: ${displayDate(date)}${selectedProduct ? ` · ${selectedProduct.name}` : ""}`],
      [],
      ["INDICADOR", "MONTO"],
      ["Ingresos en soles", totals.soles],
      ["Ingresos en dólares", totals.dollars],
      ["Tipo de cambio", totals.rate],
      ["TOTAL INGRESOS EN SOLES", totals.total],
      ["TOTAL EGRESOS", totals.egresos],
      ["UTILIDAD ESTIMADA", totals.utilidad],
      [],
      ["VENTAS POR COUNTER"],
      ["Counter", "Pax", "Ventas (S/)"],
      ...counterRows,
      [],
      ["EGRESOS POR CONCEPTO"],
      ["Concepto", "Monto (S/)"],
      ...expenseRows,
    ];
    const summary = XLSX.utils.aoa_to_sheet(summaryRows);
    const counterHeaderRow = 12;
    const counterLastRow = counterHeaderRow + counterRows.length;
    const expenseHeaderRow = counterLastRow + 3;
    const expenseLastRow = expenseHeaderRow + expenseRows.length;
    summary["!merges"] = [
      XLSX.utils.decode_range("A1:C1"),
      XLSX.utils.decode_range("A2:C2"),
      XLSX.utils.decode_range("A12:C12"),
      XLSX.utils.decode_range(`A${expenseHeaderRow}:C${expenseHeaderRow}`),
    ];
    summary["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 18 }];
    summary["!freeze"] = { ySplit: 3 };
    const title = summary.A1;
    if (title) title.s = { font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "C2410C" } }, alignment: { horizontal: "center", vertical: "center" } };
    const subtitle = summary.A2;
    if (subtitle) subtitle.s = { font: { italic: true, color: { rgb: "475569" } }, fill: { fgColor: { rgb: "FFF7ED" } }, alignment: { horizontal: "center" } };
    addTableStyle(summary, 3, 9, 2);
    ["B5", "B8", "B9", "B10"].forEach((cell) => { if (summary[cell]) summary[cell].z = money; });
    if (summary.B6) summary.B6.z = '"US$" #,##0.00';
    if (summary.B7) summary.B7.z = "0.000";
    ["A8", "B8"].forEach((cell) => { if (summary[cell]) summary[cell].s = { ...summary[cell].s, font: { bold: true, color: { rgb: "075985" } }, fill: { fgColor: { rgb: "E0F2FE" } } }; });
    ["A9", "B9"].forEach((cell) => { if (summary[cell]) summary[cell].s = { ...summary[cell].s, font: { bold: true, color: { rgb: "9F1239" } }, fill: { fgColor: { rgb: "FFE4E6" } } }; });
    ["A10", "B10"].forEach((cell) => { if (summary[cell]) summary[cell].s = { ...summary[cell].s, font: { bold: true, color: { rgb: "5B21B6" } }, fill: { fgColor: { rgb: "EDE9FE" } } }; });
    ["A12", `A${expenseHeaderRow}`].forEach((cell) => { if (summary[cell]) summary[cell].s = { font: { bold: true, color: { rgb: "C2410C" } }, fill: { fgColor: { rgb: "FFEDD5" } } }; });
    addTableStyle(summary, counterHeaderRow, counterLastRow, 3);
    addTableStyle(summary, expenseHeaderRow, expenseLastRow, 2);
    for (let row = counterHeaderRow + 1; row <= counterLastRow; row += 1) if (summary[`C${row + 1}`]) summary[`C${row + 1}`].z = money;
    for (let row = expenseHeaderRow + 1; row <= expenseLastRow; row += 1) if (summary[`B${row + 1}`]) summary[`B${row + 1}`].z = money;

    const tour = XLSX.utils.aoa_to_sheet([
      ["VENTAS POR TOUR"],
      [`Fecha de viaje: ${displayDate(date)}`],
      [],
      ["Tour", "Servicio", "Ventas (S/)"],
      ...byTour.map((item) => [item.name, item.service, item.total]),
    ]);
    tour["!merges"] = [XLSX.utils.decode_range("A1:C1"), XLSX.utils.decode_range("A2:C2")];
    tour["!cols"] = [{ wch: 48 }, { wch: 18 }, { wch: 18 }];
    tour["!freeze"] = { ySplit: 3 };
    if (tour.A1) tour.A1.s = title?.s;
    if (tour.A2) tour.A2.s = subtitle?.s;
    addTableStyle(tour, 3, 3 + Math.max(byTour.length, 1), 3);
    for (let row = 4; row <= 3 + byTour.length; row += 1) if (tour[`C${row + 1}`]) tour[`C${row + 1}`].z = money;

    const expenseDetail = XLSX.utils.aoa_to_sheet([
      ["DETALLE DE EGRESOS"],
      [`Fecha de viaje: ${displayDate(date)}`],
      [],
      ["Concepto", "Monto (S/)", "Usuario", "Registrado"],
      ...filteredExpenses.map((item) => [item.concepto || "Sin concepto", Number(item.monto || 0), item.usuario || "", item.fechaRegistro || ""]),
    ]);
    expenseDetail["!merges"] = [XLSX.utils.decode_range("A1:D1"), XLSX.utils.decode_range("A2:D2")];
    expenseDetail["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 24 }, { wch: 22 }];
    expenseDetail["!freeze"] = { ySplit: 3 };
    if (expenseDetail.A1) expenseDetail.A1.s = title?.s;
    if (expenseDetail.A2) expenseDetail.A2.s = subtitle?.s;
    addTableStyle(expenseDetail, 3, 3 + Math.max(filteredExpenses.length, 1), 4);
    for (let row = 4; row <= 3 + filteredExpenses.length; row += 1) if (expenseDetail[`B${row + 1}`]) expenseDetail[`B${row + 1}`].z = money;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summary, "Resumen");
    XLSX.utils.book_append_sheet(workbook, tour, "Ventas por tour");
    XLSX.utils.book_append_sheet(workbook, expenseDetail, "Egresos");
    XLSX.writeFile(workbook, `resumen-diario-${date}.xlsx`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {selectedProduct?.name || "Todos los productos"} · {displayDate(date)}
          </p>
          <h1 className="text-2xl font-bold text-slate-800">Resumen de ventas diario</h1>
          <p className="mt-1 text-sm text-slate-500">Selecciona el producto y la fecha que deseas revisar.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm text-slate-600">
            Fecha
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
            />
          </label>
          <label className="text-sm text-slate-600">
            Producto
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
            >
              <option value="">Todos los productos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadSales()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
          <button
            type="button"
            onClick={downloadExcel}
            disabled={loading || (hasDollars && !totals.rate)}
            title={hasDollars && !totals.rate ? "Ingresa el tipo de cambio antes de descargar" : undefined}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} /> Descargar Excel
          </button>
          <button
            type="button"
            onClick={() => navigate("/fullday")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-700">Ingresos en soles</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{formatMoney(totals.soles)}</p>
        </section>
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-700">Ingresos en dólares</p>
          <p className="mt-2 text-3xl font-bold text-amber-900">US$ {totals.dollars.toFixed(2)}</p>
          {hasDollars && (
            <label className="mt-3 flex items-center gap-2 text-sm text-amber-800">
              Tipo de cambio
              <input
                type="number"
                min="0"
                step="0.001"
                value={exchangeRate}
                onChange={(event) => setExchangeRate(event.target.value)}
                placeholder="Ej. 3.40"
                className="w-28 rounded-md border border-amber-300 bg-white px-2 py-1"
              />
            </label>
          )}
        </section>
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-sm font-medium text-sky-700">Total ingresos en soles</p>
          <p className="mt-2 text-3xl font-bold text-sky-900">{formatMoney(totals.total)}</p>
          {hasDollars && !totals.rate && <p className="mt-2 text-xs text-sky-700">Ingresa el tipo de cambio para sumar los dólares.</p>}
        </section>
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-medium text-rose-700">Total egresos</p>
          <p className="mt-2 text-3xl font-bold text-rose-900">{formatMoney(totals.egresos)}</p>
        </section>
        <section className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <p className="text-sm font-medium text-violet-700">Utilidad estimada</p>
          <p className="mt-2 text-3xl font-bold text-violet-900">{formatMoney(totals.utilidad)}</p>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Egresos</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Concepto</th>
                <th className="px-3 py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.idEgreso} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{expense.concepto || "Sin concepto"}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-800">{formatMoney(Number(expense.monto || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !filteredExpenses.length && <p className="py-8 text-center text-sm text-slate-500">Sin egresos registrados.</p>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users size={19} className="text-violet-600" />
              <h2 className="font-semibold text-slate-800">Ventas por counter</h2>
            </div>
            <span className="text-sm text-slate-500">{totals.pasajeros} pax</span>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Counter</th><th className="px-3 py-2 text-center">Pax</th><th className="px-3 py-2 text-right">Ventas</th></tr>
              </thead>
              <tbody>
                {byCounter.map((counter) => (
                  <tr key={counter.name} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{counter.name}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{counter.pasajeros}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800">{formatMoney(counter.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !byCounter.length && <p className="py-8 text-center text-sm text-slate-500">Sin ventas registradas.</p>}
          </div>
      </section>
    </div>
  );
}
