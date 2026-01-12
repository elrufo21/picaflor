import * as XLSX from "xlsx-js-style";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, FileDown, FileText } from "lucide-react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

import DndTable from "../../../components/dataTabla/DndTable";
import { usePackageStore } from "../store/fulldayStore";
import { showToast } from "@/components/ui/AppToast";

const LISTADO_FIELDS = [
  { key: "hora", label: "Hora", sourceIndex: 0 },
  { key: "lq", label: "LQ", sourceIndex: 1 },
  { key: "nombreApellidos", label: "NombreApellidos", sourceIndex: 3 },
  { key: "celular", label: "Celular", sourceIndex: 4 },
  { key: "counter", label: "Counter", sourceIndex: 5 },
  { key: "pax", label: "PAX", sourceIndex: 6, meta: { align: "center" } },
  { key: "islas", label: "Islas", sourceIndex: 7, meta: { align: "center" } },
  { key: "tubu", label: "Tubu", sourceIndex: 8, meta: { align: "center" } },
  { key: "reseN", label: "Rese.N", sourceIndex: 2 },
  { key: "puntoEmbarque", label: "PuntoEmbarque", sourceIndex: 10 },
  { key: "clasificacion", label: "Clasificacion", sourceIndex: 11 },
  { key: "condicion", label: "Condicion", sourceIndex: 12 },
  { key: "observaciones", label: "Observaciones", sourceIndex: 13 },
  { key: "puntoParida", label: "PuntoParida", sourceIndex: 14 },
  { key: "hotel", label: "Hotel", sourceIndex: 15 },
];

const parseListadoRow = (rowText: string, index: number) => {
  const values = rowText.split("|");
  const expectedLength =
    Math.max(...LISTADO_FIELDS.map((field) => field.sourceIndex)) + 1;
  let normalizedValues = values;

  if (values.length > expectedLength) {
    const mergedTail = values.slice(expectedLength - 1).join("|");
    normalizedValues = values.slice(0, expectedLength - 1).concat(mergedTail);
  }

  const row: Record<string, string> = {};
  LISTADO_FIELDS.forEach((field) => {
    row[field.key] = normalizedValues[field.sourceIndex] ?? "";
  });

  const lq = Number(row.lq);
  row.id = Number.isFinite(lq) && lq > 0 ? String(lq) : String(index + 1);
  return row;
};

const normalizeObjectRow = (item: Record<string, unknown>, index: number) => {
  const fallbackKeys: Record<string, string[]> = {
    hora: ["hora", "horaPartida"],
    lq: ["lq", "notaId", "NotaId", "notaID"],
    nombreApellidos: ["nombreApellidos", "cliente"],
    celular: ["celular", "telefono"],
    counter: ["counter", "usuario"],
    pax: ["pax", "cantidadPax"],
    islas: ["islas"],
    tubu: ["tubu", "tubulares"],
    reseN: ["reseN", "documento"],
    puntoEmbarque: ["puntoEmbarque", "puntoPartidaHotelOtrasPartidas"],
    clasificacion: ["clasificacion", "auxiliar"],
    condicion: ["condicion", "condicionSaldo"],
    observaciones: ["observaciones", "observacionesAlmuerzo"],
    puntoParida: ["puntoParida", "puntoPartida"],
    hotel: ["hotel"],
  };

  const row: Record<string, string> = {};
  LISTADO_FIELDS.forEach((field) => {
    const candidates = fallbackKeys[field.key] ?? [field.key];
    const value =
      candidates.reduce<unknown>(
        (acc, key) => acc ?? item[key],
        item[field.label]
      ) ?? "";
    row[field.key] = value === null || value === undefined ? "" : String(value);
  });

  const idCandidate =
    item.id ??
    item.idDetalle ??
    item.lq ??
    item.notaId ??
    item.NotaId ??
    item.notaID ??
    index + 1;
  row.id = String(idCandidate ?? index + 1);
  return row;
};

const parseListado = (raw: unknown) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    if (raw.every((item) => typeof item === "string")) {
      return raw.flatMap((item, idx) =>
        String(item)
          .split("¬")
          .map((row) => row.trim())
          .filter(Boolean)
          .map((row, rowIndex) => parseListadoRow(row, idx * 1000 + rowIndex))
      );
    }
    return raw.map((item, index) =>
      item && typeof item === "object"
        ? normalizeObjectRow(item as Record<string, unknown>, index)
        : parseListadoRow(String(item ?? ""), index)
    );
  }

  if (typeof raw === "string") {
    return raw
      .split("¬")
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row, index) => parseListadoRow(row, index));
  }

  if (typeof raw === "object") {
    return [normalizeObjectRow(raw as Record<string, unknown>, 0)];
  }

  return [];
};

const FulldayListado = () => {
  const { id } = useParams();
  const idProducto = Number(id);
  const navigate = useNavigate();

  const {
    listado,
    listadoLoading,
    loadListadoByProducto,
    packages,
    date,
    selectedFullDayName,
  } = usePackageStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (Number.isFinite(idProducto)) {
      loadListadoByProducto(date, idProducto);
    }
  }, [date, idProducto, loadListadoByProducto]);

  const selectedProducto = useMemo(
    () =>
      packages.find(
        (pkg: any) => Number(pkg?.idProducto ?? pkg?.id) === Number(idProducto)
      ),
    [packages, idProducto]
  );
  const displayName =
    selectedFullDayName || selectedProducto?.destino || "Sin nombre";

  const normalizedListado = useMemo(() => parseListado(listado), [listado]);
  const filteredListado = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return normalizedListado;
    return normalizedListado.filter((row: any) =>
      String(row?.nombreApellidos ?? "")
        .toLowerCase()
        .includes(needle)
    );
  }, [normalizedListado, searchTerm]);

  const columns = useMemo(
    () =>
      LISTADO_FIELDS.map((field) => ({
        accessorKey: field.key,
        header: field.label,
        meta: field.meta,
      })),
    []
  );

  const exportCsvValue = (value: string) => {
    const safe = String(value ?? "");
    if (/[",\n]/.test(safe)) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };

  const handleExportExcel = () => {
    if (filteredListado.filter((l) => l.hora !== "~").length == 0) {
      showToast({
        title: "No hay datos",
        description: "No hay datos para exportar.",
        type: "error",
      });
      return;
    }
    const data = normalizedListado.map((row: any) => {
      const obj: any = {};
      LISTADO_FIELDS.forEach((f) => {
        obj[f.label] = row?.[f.key] ?? "";
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data, {
      origin: "A2",
      skipHeader: true,
    });

    LISTADO_FIELDS.forEach((field, index) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c: index });
      ws[ref] = {
        t: "s",
        v: field.label,
        s: {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          fill: { fgColor: { rgb: "3377FF" } },
          border: {
            top: { style: "thin", color: { rgb: "475569" } },
            bottom: { style: "thin", color: { rgb: "475569" } },
            left: { style: "thin", color: { rgb: "475569" } },
            right: { style: "thin", color: { rgb: "475569" } },
          },
        },
      };
    });

    const centeredKeys = ["pax", "islas", "tubu"];

    const centeredCols = LISTADO_FIELDS.map((f, i) =>
      centeredKeys.includes(f.key) ? i : null
    ).filter((i) => i !== null) as number[];
    const horaColIndex = LISTADO_FIELDS.findIndex(
      (field) => field.key === "hora"
    );

    const lastCol = XLSX.utils.encode_col(LISTADO_FIELDS.length - 1);
    const lastRow = data.length + 1;

    ws["!autofilter"] = {
      ref: `A1:${lastCol}${lastRow}`,
    };

    ws["!cols"] = LISTADO_FIELDS.map((f) => {
      if (f.key.includes("observaciones")) return { wch: 40 };
      if (f.key.includes("nombreApellidos")) return { wch: 30 };
      if (f.key.includes("puntoEmbarque") || f.key.includes("puntoParida")) {
        return { wch: 32 };
      }
      return { wch: 18 };
    });

    const range = XLSX.utils.decode_range(ws["!ref"]!);

    for (let R = 1; R <= range.e.r; R++) {
      const isEven = (R - 1) % 2 === 0;

      for (let C = 0; C <= range.e.c; C++) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[ref]) continue;

        const baseFont = ws[ref].s?.font;
        const font =
          C === horaColIndex
            ? { ...baseFont, color: { rgb: "DC2626" } }
            : baseFont;

        ws[ref].s = {
          ...(ws[ref].s || {}),
          font,
          alignment: centeredCols.includes(C)
            ? { horizontal: "center", vertical: "center" }
            : ws[ref].s?.alignment,
          fill: {
            fgColor: { rgb: isEven ? "F8FAFC" : "FFFFFF" },
          },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
          },
        };
      }
    }

    ws["!freeze"] = { ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Listado");

    XLSX.writeFile(wb, `fullday-${date}.xlsx`);
  };

  const pdfStyles = StyleSheet.create({
    page: { padding: 16, fontSize: 8 },
    title: { fontSize: 12, marginBottom: 8 },
    meta: { fontSize: 9, marginBottom: 6 },
    table: { borderWidth: 1, borderColor: "#e2e8f0" },
    row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0" },
    header: { backgroundColor: "#f8fafc" },
    cell: { flex: 1, padding: 3 },
  });

  const buildPdfDocument = () => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Listado de programacion</Text>
        <Text style={pdfStyles.meta}>Fecha: {date || "-"}</Text>
        <Text style={pdfStyles.meta}>Full Day: {displayName}</Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, pdfStyles.header]}>
            {LISTADO_FIELDS.map((field) => (
              <Text key={field.key} style={pdfStyles.cell}>
                {field.label}
              </Text>
            ))}
          </View>
          {filteredListado.map((row: any, index: number) => (
            <View key={row.id ?? index} style={pdfStyles.row}>
              {LISTADO_FIELDS.map((field) => (
                <Text key={field.key} style={pdfStyles.cell}>
                  {String(row?.[field.key] ?? "")}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  const handleExportPdf = async () => {
    const blob = await pdf(buildPdfDocument()).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fullday-listado-${idProducto}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!id || Number.isNaN(idProducto)) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm text-slate-600">Id de producto no valido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-20 text-sm font-semibold text-slate-700">
                Full Day:
              </label>
              <input
                type="text"
                value={displayName}
                disabled
                className="w-[260px] max-w-full px-3 py-2 text-sm border rounded-md bg-slate-50 text-slate-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-20 text-sm font-semibold text-slate-700">
                Buscar:
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre del pasajero"
                className="w-[260px] max-w-full px-3 py-2 text-sm border rounded-md"
              />
              <button
                type="button"
                onClick={() => navigate("/fullday")}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border rounded-md text-slate-600 hover:bg-slate-50"
                aria-label="Volver a Full Day"
              >
                <ArrowLeft size={14} />
                Volver
              </button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-blue-600">
                Fecha De Viaje:
              </label>
              <input
                type="date"
                value={date}
                disabled
                className="px-3 py-2 text-sm border rounded-md bg-slate-50 text-slate-600"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
              >
                <FileDown size={14} />
                Excel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-slate-800 text-white hover:bg-slate-900 transition"
              >
                <FileText size={14} />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <DndTable
        data={filteredListado.filter((l) => l.hora !== "~")}
        columns={columns}
        isLoading={listadoLoading}
        enableDateFilter={false}
        enableFiltering={false}
        enableSearching={false}
        enableSorting={false}
      />
    </div>
  );
};

export default FulldayListado;
