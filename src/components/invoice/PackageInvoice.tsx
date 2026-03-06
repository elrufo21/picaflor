// PackageInvoicePdf.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/* =========================
   TYPES (según tu JSON)
========================= */

type OptionItem = { value: string; label: string };

type Passenger = {
  id?: number;
  nombres: string;
  pasaporte: string;
  nacionalidad: string;
  telefono?: string;
  fechaNacimiento?: string; // ISO
};

type HotelRoom = {
  tipo: string;
  cantidad: number;
  precio?: number;
};

type HotelContratado = {
  id?: number;
  region: string;
  hotel: string;
  habitaciones: HotelRoom[];
  entradaSalida?: string;
  incluyeAlimentacion?: boolean;
  alimentacionTipo?: string;
  alimentacionPrecio?: number;
  importeTotal?: number;
};

type ItineraryActivity = {
  id?: number;
  tipo: "ACT1" | "ACT2" | "ACT3" | "TRASLADO" | "ENTRADA" | string;
  detalle: string;
  precio: number;
  cant: number;
  subtotal: number;
};

type ItineraryDay = {
  id?: number;
  fecha: string; // ISO
  titulo: string;
  precioUnitario?: number;
  observacion?: string;
  origen?: string;
  destino?: string;
  actividades: ItineraryActivity[];
};

export type PackageInvoiceData = {
  fechaEmision: string; // ISO
  destinos: string[];
  programa: string;
  fechaInicioViaje: string; // ISO
  fechaFinViaje: string; // ISO

  agencia?: OptionItem;
  counter: string;
  contacto: string;
  telefono: string;
  email: string;

  condicionPago: string; // CANCELADO, etc
  moneda: "DOLARES" | "SOLES" | string;

  documentoCobranza: string;
  nserie: string;
  ndocumento: string;
  medioPago: string;
  entidadBancaria: string;
  nroOperacion: string;

  precioExtraSoles: number;
  precioExtraDolares: number;
  igv: number;
  cargosExtra: number;

  totalGeneral: number;
  acuenta: number;
  saldo: number;

  deposito: number;
  efectivo: number;

  mensajePasajero?: string;

  movilidadTipo?: string;
  movilidadEmpresa?: string;
  movilidadPrecio?: number;

  incluyeHotel?: boolean;
  hotelesContratados: HotelContratado[];

  pasajeros: Passenger[];

  itinerario: ItineraryDay[];

  incluye?: string;
  noIncluye?: string;
  impuestosAdicionales?: string;
  observaciones?: string;

  cantPax?: string; // "1"
  liquidacionNumero?: string; // si lo tienes
};

/* =========================
   HELPERS
========================= */

const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}:\d{2}:\d{2}))?$/;

function formatFechaDMY(value?: string): string {
  if (!value) return "";
  const m = String(value).trim().match(ISO_DATE_PATTERN);
  if (!m) return String(value).trim();
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

function formatFechaTitulo(value?: string): string {
  // "2026-03-07" -> "07 MARZO"
  if (!value) return "";
  const m = String(value).trim().match(ISO_DATE_PATTERN);
  if (!m) return String(value).trim().toUpperCase();

  const [, y, mo, d] = m;
  const month = Number(mo);
  const MONTHS = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];
  return `${d} ${MONTHS[month - 1] || ""}`.trim();
}

function currencySymbol(moneda?: string) {
  return String(moneda).toUpperCase() === "DOLARES" ? "USD$" : "S/";
}

function formatMoney(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function safeText(v: unknown) {
  return String(v ?? "").trim();
}

function nonEmptyLine(line?: string) {
  const t = safeText(line);
  if (!t) return false;
  const u = t.toUpperCase();
  return u !== "-" && u !== "N/A" && u !== "NA";
}

function buildNroDocumento(nserie: string, ndocumento: string) {
  const s = safeText(nserie);
  const n = safeText(ndocumento);
  if (s && n) return `${s}-${n}`;
  return s || n || "";
}

function normalizeDestinos(destinos: string[]) {
  const cleaned = (destinos ?? []).map((d) => safeText(d)).filter(Boolean);
  return cleaned.length ? cleaned.join(", ") : "";
}

/* =========================
   STYLES (similar al excel)
========================= */

const S = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", backgroundColor: "#F8FAFC" },
  content: { padding: 12 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  brandLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 120, height: 28, objectFit: "contain" },
  brandTextBox: {},
  brandName: { fontSize: 16, fontWeight: "bold" },
  brandTag: { fontSize: 9, color: "#444" },

  companyRight: { alignItems: "flex-end", gap: 2 },
  companyLine: { fontSize: 8, color: "#333" },
  companyLink: { fontSize: 8, color: "#1a5fb4" },

  centerTitle: { marginTop: 8, marginBottom: 10, alignItems: "center" },
  centerTitleText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0F172A",
    letterSpacing: 0.6,
  },

  twoCols: { flexDirection: "row", gap: 10 },
  col: { width: "50%" },
  infoCard: {
    borderWidth: 1,
    borderColor: "#D5DEE9",
    backgroundColor: "#FFFFFF",
    padding: 6,
  },

  kvRow: { flexDirection: "row", marginBottom: 3 },
  kvLabel: { width: "38%", fontSize: 8, fontWeight: "bold", color: "#475569" },
  kvValue: { width: "62%", fontSize: 8, color: "#0F172A" },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    marginVertical: 8,
  },

  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#0F172A",
    letterSpacing: 0.4,
  },

  table: { borderWidth: 1, borderColor: "#CBD5E1", backgroundColor: "#FFFFFF" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#1E293B" },
  th: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#334155",
  },
  tdRow: { flexDirection: "row", backgroundColor: "#FFFFFF" },
  tdRowAlt: { flexDirection: "row", backgroundColor: "#F8FAFC" },
  td: {
    fontSize: 8,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    color: "#0F172A",
  },
  lastCell: { borderRightWidth: 0 },

  servicesBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#D5DEE9",
    backgroundColor: "#FFFFFF",
    padding: 6,
  },
  servicesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  servicesLabel: {
    width: "24%",
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
  },
  servicesColon: {
    width: "4%",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    color: "#475569",
  },
  servicesValue: { width: "72%", fontSize: 8, color: "#0F172A" },
  servicesValueBlock: { width: "72%" },
  hotelItemBox: {
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    padding: 4,
  },
  hotelTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#B91C1C",
  },
  hotelLine: {
    fontSize: 8,
    color: "#475569",
    marginTop: 1,
  },

  redText: { color: "#B91C1C" },

  itineraryBox: { marginTop: 10 },
  dayBox: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  dayHeader: {
    backgroundColor: "#F59E0B",
    color: "#FFFFFF",
    padding: 5,
    fontSize: 9,
    fontWeight: "bold",
  },
  dayBody: { padding: 6 },
  bullet: { fontSize: 8, marginBottom: 2, color: "#334155" },

  priceBox: { marginTop: 10 },
  priceTable: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  priceRow: { flexDirection: "row" },
  priceCell: {
    fontSize: 8,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    color: "#0F172A",
  },
  priceHeader: { backgroundColor: "#F1F5F9" },
  alignRight: { textAlign: "right" },
  alignCenter: { textAlign: "center" },

  footerTwo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  payLeft: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#D5DEE9",
    backgroundColor: "#FFFFFF",
    padding: 6,
  },
  payRight: {
    width: "52%",
    borderWidth: 1,
    borderColor: "#D5DEE9",
    backgroundColor: "#FFFFFF",
    padding: 6,
  },

  payTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 4 },
  payLine: { flexDirection: "row", marginBottom: 2 },
  payLabel: { width: "55%", fontSize: 8, fontWeight: "bold" },
  payValue: { width: "45%", fontSize: 8, textAlign: "right", color: "#0F172A" },

  statusBar: {
    marginTop: 8,
    backgroundColor: "#FFD000",
    paddingVertical: 5,
    alignItems: "center",
  },
  statusText: { fontSize: 8, fontWeight: "bold" },
  mensajePasajeroBox: {
    marginTop: 8,
    backgroundColor: "#305496",
    paddingVertical: 8,
    alignItems: "center",
  },
  mensajePasajeroText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },

  notesBox: { marginTop: 8, borderWidth: 1, borderColor: "#CBD5E1" },
  notesHeader: {
    backgroundColor: "#F1F5F9",
    padding: 4,
    fontSize: 9,
    fontWeight: "bold",
    color: "#0F172A",
  },
  notesBody: { padding: 6, minHeight: 40, fontSize: 8, color: "#0F172A" },
});

/* =========================
   COMPONENT
========================= */

export default function PackageInvoicePdf({
  data,
  pdfName,
  logoSrc,
}: {
  data: PackageInvoiceData;
  pdfName?: string;
  logoSrc?: string; // pásale una URL absoluta o base64, o una ruta válida para tu runtime
}) {
  const curr = currencySymbol(data.moneda);
  const nroDoc = buildNroDocumento(data.nserie, data.ndocumento);
  const isCondicionCancelado =
    safeText(data.condicionPago).toUpperCase() === "CANCELADO";
  const totalGeneral = Number(data.totalGeneral ?? 0);
  const igv = Number(data.igv ?? 0);
  const cargoExtra = Number(data.cargosExtra ?? 0);
  const subtotalBase = totalGeneral - igv - cargoExtra;

  // Servicios / hoteles render-friendly
  const hotelLines = (data.hotelesContratados ?? []).map((h) => {
    const region = safeText(h.region).toUpperCase();
    const hotel = safeText(h.hotel);
    const hs = safeText(h.entradaSalida);
    const habit = (h.habitaciones ?? [])
      .map(
        (r) =>
          `${String(r.cantidad ?? 0).padStart(2, "0")} ${safeText(r.tipo).toUpperCase()}`,
      )
      .join("  |  ");
    const alim =
      h.incluyeAlimentacion && nonEmptyLine(h.alimentacionTipo)
        ? `  •  ALIMENTACIÓN: ${safeText(h.alimentacionTipo).toUpperCase()}`
        : "";
    const check = hs ? ` / ${hs}` : "";
    return {
      key: `${region}-${hotel}-${h.id ?? ""}`,
      line: `${region} : ${hotel}${check}`,
      rooms: habit,
      alim,
    };
  });

  // Itinerario bullets: usa detalle cuando sea útil, si no, arma lista por actividades
  const itineraryDays = (data.itinerario ?? []).map((d) => {
    const acts = (d.actividades ?? [])
      .filter((a) => nonEmptyLine(a.detalle))
      .map((a) => a.detalle.trim())
      .filter(Boolean);

    // Si todo viene vacío, al menos pone el título
    const bullets = acts.length
      ? acts
      : [safeText(d.titulo) || "SIN ACTIVIDAD"];

    return {
      key: `${d.fecha}-${d.id ?? ""}`,
      header: `${formatFechaTitulo(d.fecha)} : ${safeText(d.titulo).toUpperCase()}`,
      bullets,
    };
  });

  // Filas de liquidación (si tienes paquetesViaje, aquí lo puedes usar; por ahora usamos movilidad + hotel + días con precioUnitario)
  const pricingRows: {
    desc: string;
    unit: number;
    qty: number;
    total: number;
  }[] = [];

  // movilidad si tiene precio
  if (Number(data.movilidadPrecio ?? 0) > 0) {
    pricingRows.push({
      desc: `MOVILIDAD ${safeText(data.movilidadTipo).toUpperCase()} - ${safeText(
        data.movilidadEmpresa,
      ).toUpperCase()}`,
      unit: Number(data.movilidadPrecio ?? 0),
      qty: 1,
      total: Number(data.movilidadPrecio ?? 0),
    });
  }

  // hoteles (importeTotal)
  for (const h of data.hotelesContratados ?? []) {
    const total = Number(h.importeTotal ?? 0);
    if (total > 0) {
      pricingRows.push({
        desc: `HOTEL ${safeText(h.region).toUpperCase()} - ${safeText(h.hotel).toUpperCase()}`,
        unit: total,
        qty: 1,
        total,
      });
    }
  }

  // días con precioUnitario
  for (const d of data.itinerario ?? []) {
    const unit = Number(d.precioUnitario ?? 0);
    if (unit > 0) {
      pricingRows.push({
        desc: safeText(d.titulo).toUpperCase(),
        unit,
        qty: 1,
        total: unit,
      });
    }
  }

  // si quedó vacío, al menos 1 fila con total general
  if (!pricingRows.length) {
    pricingRows.push({
      desc: `PAQUETE ${normalizeDestinos(data.destinos).toUpperCase()} / ${safeText(data.programa).toUpperCase()}`,
      unit: Number(data.totalGeneral ?? 0),
      qty: 1,
      total: Number(data.totalGeneral ?? 0),
    });
  }

  return (
    <Document title={pdfName}>
      <Page size="A4" style={S.page}>
        <Image src="/images/invoice/header.jpeg" />
        <View style={S.content}>
          {/* TITLE */}

          {/* INFO BLOCK */}
          <View style={S.twoCols}>
            <View style={[S.col, S.infoCard]}>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>FECHA</Text>
                <Text style={S.kvValue}>
                  : {formatFechaDMY(data.fechaEmision)}
                </Text>
              </View>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>DESTINO</Text>
                <Text style={S.kvValue}>
                  : {normalizeDestinos(data.destinos).toUpperCase()}
                </Text>
              </View>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>PROGRAMA</Text>
                <Text style={S.kvValue}>
                  : {safeText(data.programa).toUpperCase()}
                </Text>
              </View>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>FECHA DE VIAJE</Text>
                <Text style={S.kvValue}>
                  : DEL {formatFechaTitulo(data.fechaInicioViaje)} AL{" "}
                  {formatFechaTitulo(data.fechaFinViaje)}
                </Text>
              </View>
            </View>

            <View style={[S.col, S.infoCard]}>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>AGENCIA</Text>
                <Text style={S.kvValue}>
                  : {safeText(data.agencia?.label).toUpperCase()}
                </Text>
              </View>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>COUNTER</Text>
                <Text style={S.kvValue}>
                  : {safeText(data.counter).toUpperCase()}
                </Text>
              </View>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>CONTACTO</Text>
                <Text style={S.kvValue}>
                  : {safeText(data.contacto).toUpperCase()}
                </Text>
              </View>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>FIJO/MOVIL</Text>
                <Text style={S.kvValue}>: {safeText(data.telefono)}</Text>
              </View>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>E-MAIL</Text>
                <Text style={S.kvValue}>: {safeText(data.email)}</Text>
              </View>
            </View>
          </View>

          <View style={S.divider} />

          {/* PASSENGERS */}
          <Text style={S.sectionTitle}>DATOS DEL (LOS) PASAJERO(S)</Text>
          <View style={S.table}>
            <View style={S.tableHeaderRow}>
              <Text style={[S.th, { width: "8%" }]}>NRO</Text>
              <Text style={[S.th, { width: "44%" }]}>
                NOMBRE(S) Y APELLIDO(S)
              </Text>
              <Text style={[S.th, { width: "18%" }]}>PASAPORTE</Text>
              <Text style={[S.th, { width: "15%" }]}>FECHA DE NAC</Text>
              <Text style={[S.th, S.lastCell, { width: "15%" }]}>
                NACIONALIDAD
              </Text>
            </View>

            {(data.pasajeros ?? []).map((p, idx) => (
              <View
                key={p.id ?? idx}
                style={idx % 2 === 0 ? S.tdRow : S.tdRowAlt}
              >
                <Text style={[S.td, { width: "8%" }]}>
                  {String(idx + 1).padStart(3, "0")}
                </Text>
                <Text style={[S.td, { width: "44%" }]}>
                  {safeText(p.nombres).toUpperCase()}
                </Text>
                <Text style={[S.td, { width: "18%", textAlign: "center" }]}>
                  {safeText(p.pasaporte).toUpperCase()}
                </Text>
                <Text style={[S.td, { width: "15%", textAlign: "center" }]}>
                  {formatFechaDMY(p.fechaNacimiento)}
                </Text>
                <Text
                  style={[
                    S.td,
                    S.lastCell,
                    { width: "15%", textAlign: "center" },
                  ]}
                >
                  {safeText(p.nacionalidad).toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          {/* SERVICES */}
          <View style={S.servicesBox}>
            <Text style={S.sectionTitle}>SERVICIOS CONTRATADOS</Text>

            <View style={S.servicesRow}>
              <Text style={S.servicesLabel}>MOVILIDAD</Text>
              <Text style={S.servicesColon}>:</Text>
              <Text style={S.servicesValue}>
                {safeText(data.movilidadTipo).toUpperCase()}{" "}
                {safeText(data.movilidadEmpresa)
                  ? `- ${safeText(data.movilidadEmpresa).toUpperCase()}`
                  : ""}
              </Text>
            </View>

            <View style={S.servicesRow}>
              <Text style={S.servicesLabel}>HOTELES</Text>
              <Text style={S.servicesColon}>:</Text>
              <View style={S.servicesValueBlock}>
                {hotelLines.length ? (
                  <>
                    {hotelLines.map((h) => (
                      <View key={h.key} style={S.hotelItemBox}>
                        <Text style={S.hotelTitle}>{h.line}</Text>
                        {nonEmptyLine(h.rooms) ? (
                          <Text style={S.hotelLine}>{h.rooms}</Text>
                        ) : null}
                        {nonEmptyLine(h.alim) ? (
                          <Text style={S.hotelLine}>{h.alim}</Text>
                        ) : null}
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={S.hotelLine}>N/A</Text>
                )}
              </View>
            </View>

            {/* TIPO HABITACIÓN (resumen) */}
            <View style={[S.servicesRow, { marginTop: 4 }]}>
              <Text style={S.servicesLabel}>TIPO DE HABITACIÓN</Text>
              <Text style={S.servicesColon}>:</Text>
              <View style={S.servicesValueBlock}>
                {(() => {
                  const map = new Map<string, number>();
                  for (const h of data.hotelesContratados ?? []) {
                    for (const r of h.habitaciones ?? []) {
                      const k = safeText(r.tipo).toUpperCase();
                      const v = Number(r.cantidad ?? 0);
                      if (!k || !v) continue;
                      map.set(k, (map.get(k) ?? 0) + v);
                    }
                  }
                  const entries = Array.from(map.entries());
                  if (!entries.length)
                    return <Text style={S.hotelLine}>N/A</Text>;
                  return entries.map(([tipo, cant]) => (
                    <Text key={tipo} style={[S.hotelLine, S.redText]}>
                      {String(cant).padStart(2, "0")} {tipo}
                    </Text>
                  ));
                })()}
              </View>
            </View>
          </View>

          {/* ITINERARY */}
          <View style={S.itineraryBox}>
            {itineraryDays.map((d) => (
              <View key={d.key} style={S.dayBox}>
                <Text style={S.dayHeader}>{d.header}</Text>
                <View style={S.dayBody}>
                  {d.bullets.map((b, i) => (
                    <Text key={i} style={S.bullet}>
                      {i === 0 ? "" : ""}- {b}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* PRICING + PAYMENTS */}
          <View style={S.priceBox}>
            <Text style={S.sectionTitle}>LIQUIDACIÓN</Text>

            <View style={S.priceTable}>
              <View style={[S.priceRow, S.priceHeader]}>
                <Text style={[S.priceCell, { width: "55%" }]}>DESCRIPCIÓN</Text>
                <Text style={[S.priceCell, { width: "15%" }, S.alignRight]}>
                  {curr}
                </Text>
                <Text style={[S.priceCell, { width: "15%" }, S.alignCenter]}>
                  CANT
                </Text>
                <Text
                  style={[
                    S.priceCell,
                    S.lastCell,
                    { width: "15%" },
                    S.alignRight,
                  ]}
                >
                  TOTAL
                </Text>
              </View>

              {pricingRows.map((r, idx) => (
                <View key={idx} style={S.priceRow}>
                  <Text style={[S.priceCell, { width: "55%" }]}>{r.desc}</Text>
                  <Text style={[S.priceCell, { width: "15%" }, S.alignRight]}>
                    {formatMoney(r.unit)}
                  </Text>
                  <Text style={[S.priceCell, { width: "15%" }, S.alignCenter]}>
                    {r.qty}
                  </Text>
                  <Text
                    style={[
                      S.priceCell,
                      S.lastCell,
                      { width: "15%" },
                      S.alignRight,
                    ]}
                  >
                    {formatMoney(r.total)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={S.footerTwo}>
              {/* LEFT TOTALS */}
              <View style={S.payLeft}>
                <Text style={S.payTitle}>RESUMEN</Text>

                {[
                  ["SUB TOTAL", subtotalBase],
                  ["IGV", igv],
                  ["CARGO EXTRA", cargoExtra],
                  ["TOTAL A PAGAR", totalGeneral],
                  ["A CUENTA", data.acuenta],
                  ["SALDO", data.saldo],
                ].map(([label, val]) => {
                  const isEmphasized =
                    label === "TOTAL A PAGAR" || label === "SALDO";
                  return (
                    <View key={String(label)} style={S.payLine}>
                      <Text style={S.payLabel}>{label}:</Text>
                      <Text
                        style={[
                          S.payValue,
                          isEmphasized && { fontWeight: "bold" },
                        ]}
                      >
                        {`${curr} ${formatMoney(val)}`}
                      </Text>
                    </View>
                  );
                })}

                {data.mensajePasajero ? (
                  <View
                    style={[
                      S.mensajePasajeroBox,
                      !isCondicionCancelado && { backgroundColor: "#9b111e" },
                    ]}
                  >
                    <Text style={S.mensajePasajeroText}>
                      {safeText(data.mensajePasajero)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* RIGHT PAYMENT INFO */}
              <View style={S.payRight}>
                <Text style={S.payTitle}>DATOS DE PAGO</Text>

                {[
                  ["CONDICIÓN", data.condicionPago],
                  ["MEDIO DE PAGO", data.medioPago],
                  ["ENTIDAD BANCARIA", data.entidadBancaria],
                  ["NRO OPERACIÓN", data.nroOperacion],
                  ["DOCUMENTO", data.documentoCobranza],
                  ["NRO DOCUMENTO", nroDoc || "-"],
                  ["DEPÓSITO", `${curr} ${formatMoney(data.deposito)}`],
                  ["EFECTIVO", `${curr} ${formatMoney(data.efectivo)}`],
                ].map(([label, value]) => (
                  <View key={label} style={S.kvRow}>
                    <Text
                      style={[
                        S.kvLabel,
                        { width: "45%" },
                        { fontWeight: "bold" },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text
                      style={[
                        S.kvValue,
                        { width: "55%" },
                        { fontWeight: "bold" },
                      ]}
                    >
                      : {safeText(value)}
                    </Text>
                  </View>
                ))}

                <View style={S.notesBox}>
                  <Text style={S.notesHeader}>OBSERVACIONES</Text>
                  <Text style={[S.notesBody, { fontWeight: "bold" }]}>
                    {safeText(data.observaciones)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Flags al final (opcional) */}
            {nonEmptyLine(data.noIncluye) ? (
              <View style={[S.statusBar, { backgroundColor: "#FFEB99" }]}>
                <Text style={S.statusText}>
                  {safeText(data.noIncluye).toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}
