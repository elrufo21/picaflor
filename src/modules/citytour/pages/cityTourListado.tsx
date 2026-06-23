import * as XLSX from "xlsx-js-style";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
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
import { usePackageStore } from "../store/cityTourStore";
import { showToast } from "@/components/ui/AppToast";
import { toPlainText } from "@/shared/helpers/safeText";
import { normalizeLegacyXmlPayload } from "@/shared/helpers/normalizeLegacyXmlPayload";

const NUMERIC_KEYS = ["pax", "islas", "tubu"];
const EXCEL_EXCLUDED_KEYS = new Set(["clienteMovil", "clienteDespacho"]);

const LISTADO_FIELDS = [
  { key: "lq", label: "LQ", sourceIndex: 1 },
  { key: "nombreApellidos", label: "NombreApellidos", sourceIndex: 3 },
  { key: "celular", label: "Celular", sourceIndex: 4 },
  { key: "counter", label: "Counter", sourceIndex: 5 },
  { key: "pax", label: "PAX", sourceIndex: 6, meta: { align: "center" } },
  { key: "puntoEmbarque", label: "PuntoEmbarque", sourceIndex: 10 },
  { key: "clasificacion", label: "Clasificacion", sourceIndex: 11 },
  { key: "condicion", label: "Condicion", sourceIndex: 12 },
  { key: "observaciones", label: "Observaciones", sourceIndex: 13 },
  { key: "puntoParida", label: "PuntoParida", sourceIndex: 14 },
  { key: "hotel", label: "Hotel", sourceIndex: 15 },
];

const parseListadoRow = (rowText: string, index: number) => {
  const values = normalizeLegacyXmlPayload(rowText).split("|");
  const expectedLength =
    Math.max(...LISTADO_FIELDS.map((field) => field.sourceIndex)) + 1;
  let normalizedValues = values;

  if (values.length > expectedLength) {
    const mergedTail = values.slice(expectedLength - 1).join("|");
    normalizedValues = values.slice(0, expectedLength - 1).concat(mergedTail);
  }

  const row: Record<string, string> = {};
  LISTADO_FIELDS.forEach((field) => {
    row[field.key] = cleanListadoValue(normalizedValues[field.sourceIndex]);
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
    reseN: ["otros", "reseN", "documento"],
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
        item[field.label],
      ) ?? "";
    row[field.key] =
      value === null || value === undefined
        ? ""
        : cleanListadoValue(value);
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
        normalizeLegacyXmlPayload(String(item))
          .split("¬")
          .map((row) => row.trim())
          .filter(Boolean)
          .map((row, rowIndex) => parseListadoRow(row, idx * 1000 + rowIndex)),
      );
    }
    return raw.map((item, index) =>
      item && typeof item === "object"
        ? normalizeObjectRow(item as Record<string, unknown>, index)
        : parseListadoRow(String(item ?? ""), index),
    );
  }

  if (typeof raw === "string") {
    return normalizeLegacyXmlPayload(raw)
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

const cleanListadoValue = (value: unknown) =>
  normalizeLegacyXmlPayload(String(value ?? "")).trim();

const excelColumnWidth = (
  field: (typeof LISTADO_FIELDS)[number],
  rows: Record<string, unknown>[],
) => {
  const minWidthByKey: Record<string, number> = {
    celular: 38,
    nombreApellidos: 42,
    puntoEmbarque: 55,
    puntoParida: 55,
    hotel: 55,
    observaciones: 45,
  };
  const maxWidthByKey: Record<string, number> = {
    celular: 70,
    nombreApellidos: 70,
    puntoEmbarque: 90,
    puntoParida: 90,
    hotel: 90,
    observaciones: 80,
  };
  const contentWidth = rows.reduce(
    (max, row) => Math.max(max, toPlainText(row?.[field.key]).length + 2),
    field.label.length + 2,
  );

  return {
    wch: Math.min(
      Math.max(contentWidth, minWidthByKey[field.key] ?? 18),
      maxWidthByKey[field.key] ?? 35,
    ),
  };
};

const CityTourListado = () => {
  const { id } = useParams();
  const idProducto = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    listado,
    listadoLoading,
    loadPackages,
    loadListadoByProducto,
    packages,
    date,
    selectedFullDayName,
  } = usePackageStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (Number.isFinite(idProducto)) {
      loadListadoByProducto(date, idProducto);
      loadPackages(date);
    }
  }, [date, idProducto, loadListadoByProducto, loadPackages]);

  const selectedProducto = useMemo(
    () =>
      packages.find(
        (pkg: any) => Number(pkg?.idProducto ?? pkg?.id) === Number(idProducto),
      ),
    [packages, idProducto],
  );
  const displayName = toPlainText(
    selectedFullDayName || selectedProducto?.destino || "Sin nombre",
  );
  const routeMeta =
    location.state && typeof location.state === "object"
      ? (location.state as { transporte?: unknown; guia?: unknown })
      : {};
  const transportePdf = toPlainText(
    routeMeta.transporte ?? selectedProducto?.transporte ?? "",
  );
  const guiaPdf = toPlainText(routeMeta.guia ?? selectedProducto?.guia ?? "");

  const normalizedListado = useMemo(() => parseListado(listado), [listado]);
  const filteredListado = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return normalizedListado;
    return normalizedListado.filter((row: any) =>
      toPlainText(row?.nombreApellidos).toLowerCase().includes(needle),
    );
  }, [normalizedListado, searchTerm]);

  const columns = useMemo(
    () =>
      LISTADO_FIELDS.map((field) => ({
        accessorKey: field.key,
        header: field.label,
        meta: field.meta,
        cell: ({ getValue }: { getValue: () => unknown }) =>
          toPlainText(getValue()),
      })),
    [],
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
    const excelFields = LISTADO_FIELDS.filter(
      (field) => !EXCEL_EXCLUDED_KEYS.has(field.key),
    );

    const data = normalizedListado.map((row: any) => {
      const obj: any = {};
      excelFields.forEach((f) => {
        const value = row?.[f.key];
        if (NUMERIC_KEYS.includes(f.key)) {
          const num = Number(value);
          obj[f.label] = Number.isFinite(num) ? num : 0;
        } else {
          obj[f.label] = value ?? "";
        }
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data, {
      origin: "A2",
      skipHeader: true,
    });

    excelFields.forEach((field, index) => {
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

    const centeredKeys = NUMERIC_KEYS;

    const centeredCols = excelFields.map((f, i) =>
      centeredKeys.includes(f.key) ? i : null,
    ).filter((i) => i !== null) as number[];
    const horaColIndex = excelFields.findIndex(
      (field) => field.key === "hora",
    );

    const lastCol = XLSX.utils.encode_col(excelFields.length - 1);
    const lastRow = data.length + 1;

    ws["!autofilter"] = {
      ref: `A1:${lastCol}${lastRow}`,
    };

    ws["!cols"] = excelFields.map((field) => excelColumnWidth(field, data));
    const numericCols = excelFields.map((f, i) =>
      NUMERIC_KEYS.includes(f.key) ? i : null,
    ).filter((i) => i !== null) as number[];

    const range = XLSX.utils.decode_range(ws["!ref"]!);
    for (let R = 1; R <= range.e.r; R++) {
      for (const C of numericCols) {
        const ref = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[ref]) continue;

        ws[ref].t = "n";
        ws[ref].v = Number(ws[ref].v) || 0;
      }
    }

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

    XLSX.writeFile(wb, `citytour-${date}.xlsx`);
  };

  const pdfStyles = StyleSheet.create({
    page: {
      paddingHorizontal: 16,
      paddingVertical: 18,
      fontSize: 6.8,
      fontFamily: "Helvetica",
      color: "#000",
    },
    title: { fontSize: 10, fontWeight: 700, marginBottom: 8 },
    divider: { fontSize: 7, marginBottom: 5 },
    metaRow: { flexDirection: "row", marginBottom: 2 },
    metaLabel: { width: 38, fontSize: 8, fontWeight: 700 },
    metaValue: { fontSize: 8, fontWeight: 700 },
    table: { marginTop: 14, borderTopWidth: 1, borderLeftWidth: 1 },
    row: { flexDirection: "row", minHeight: 16 },
    header: { backgroundColor: "#cfcfcf" },
    cell: {
      paddingHorizontal: 2,
      paddingVertical: 2,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      fontSize: 6.3,
    },
    headerCell: { fontSize: 6.5, fontWeight: 700 },
    center: { textAlign: "center" },
    red: { color: "#ff0000", fontWeight: 700 },
  });
  const pdfColumns = [
    { key: "lq", label: "LQ", width: 34, center: true },
    { key: "nombreApellidos", label: "NOMBRES", width: 160 },
    { key: "celular", label: "CELULAR", width: 92 },
    { key: "counter", label: "COUNTER", width: 84, center: true },
    { key: "pax", label: "PAX", width: 34, center: true },
    { key: "puntoEmbarque", label: "RECOJO", width: 170, center: true },
    { key: "condicion", label: "CONDICION", width: 64, center: true },
    { key: "clasificacion", label: "AGENCIA", width: 78, center: true },
    { key: "observaciones", label: "OBSERVACIONES", width: 100 },
  ];
  const formatPdfDate = (value: string) => {
    const [year, month, day] = String(value ?? "").split("-");
    return year && month && day ? `${day}/${month}/${year}` : value || "-";
  };

  const buildPdfDocument = () => (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{displayName.toUpperCase()}</Text>
        <Text style={pdfStyles.divider}>
          -------------------------------------------------------------------------------
        </Text>
        <View style={pdfStyles.metaRow}>
          <Text style={pdfStyles.metaLabel}>TRANS :</Text>
          <Text style={pdfStyles.metaValue}>{transportePdf}</Text>
        </View>
        <View style={pdfStyles.metaRow}>
          <Text style={pdfStyles.metaLabel}>FECHA :</Text>
          <Text style={pdfStyles.metaValue}>{formatPdfDate(date)}</Text>
        </View>
        <View style={pdfStyles.metaRow}>
          <Text style={pdfStyles.metaLabel}>GUIA :</Text>
          <Text style={pdfStyles.metaValue}>{guiaPdf}</Text>
        </View>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, pdfStyles.header]}>
            {pdfColumns.map((field) => (
              <Text
                key={field.key}
                style={[
                  pdfStyles.cell,
                  pdfStyles.headerCell,
                  field.center ? pdfStyles.center : {},
                  { width: field.width },
                ]}
              >
                {field.label}
              </Text>
            ))}
          </View>
          {filteredListado
            .filter((row: any) => row.hora !== "~")
            .map((row: any, index: number) => (
              <View key={row.id ?? index} style={pdfStyles.row}>
                {pdfColumns.map((field) => (
                  <Text
                    key={field.key}
                    style={[
                      pdfStyles.cell,
                      field.center ? pdfStyles.center : {},
                      field.key === "condicion" &&
                      toPlainText(row?.[field.key]).toUpperCase().includes("DEBE")
                        ? pdfStyles.red
                        : {},
                      { width: field.width },
                    ]}
                  >
                    {toPlainText(row?.[field.key])}
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
    anchor.download = `citytour-listado-${idProducto}.pdf`;
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
                City Tour:
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
                onClick={() => navigate("/citytour")}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border rounded-md text-slate-600 hover:bg-slate-50"
                aria-label="Volver a City Tour"
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
        enableCellNavigation={true}
      />
    </div>
  );
};

export default CityTourListado;

