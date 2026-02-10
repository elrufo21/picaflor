import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/* =========================
   DATA
========================= */

type InvoiceActivity = {
  label: string;
  actividad: string;
  cantidad?: number | null;
};

type InvoiceItem = {
  label: string;
  descripcion: string;
  precio?: number | null;
  cantidad?: number | null;
  subtotal?: number | null;
};

export type InvoiceData = {
  destino: string;
  fechaViaje: string;
  auxiliar: string;
  otrosPartidas?: string;
  telefonos: string;
  fechaEmision: string;
  counter: string;
  condicion: string;
  pasajeroNombre: string;
  pasajeroDocumento: string;
  pasajeroContacto: string;
  pasajeroCant: number | null;
  actividades: InvoiceActivity[];
  detalleServicio: {
    puntoPartida: string;
    horaPartida: string;
    otrosPuntos: string;
    visitas: string;
  };
  items: InvoiceItem[];
  impuestos: number;
  cargos: number;
  extraSoles: number;
  extraDolares: number;
  total: number;
  acuenta: number;
  saldo: number;
  fechaAdelanto: string;
  medioPago: string;
  documento: string;
  nroDocumento: string;
  observaciones: string;
  precioTotal?: number;
  mensajePasajero?: string;
  moneda?: string;
  fechaRegistro?: string;
};

type OptionItem = { value: string; label: string };

const ISO_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}:\d{2}:\d{2}))?$/;
const DMY_DATE_PATTERN =
  /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?$/;

function formatFechaParaMostrar(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();

  const isoMatch = trimmed.match(ISO_DATE_PATTERN);
  if (isoMatch) {
    const [, year, month, day, time] = isoMatch;
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }

  const dmyMatch = trimmed.match(DMY_DATE_PATTERN);
  if (dmyMatch) {
    const [, day, month, year, time] = dmyMatch;
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }

  return trimmed;
}

const formatFechaSoloFecha = (value?: string) => {
  const formatted = formatFechaParaMostrar(value);
  return formatted.split(" ")[0];
};

type TarifaRow = {
  id: string;
  precioUnit?: number;
  cantidad?: number;
};

type BuildInvoiceFormValues = {
  nombreCompleto?: string;
  documentoTipo?: string;
  documentoNumero?: string;
  celular?: string;
  telefono?: string;
  cantPax?: number;
  fechaViaje?: string;
  fechaPago?: string;
  fechaEmision?: string;
  canalVenta?: unknown;
  counter?: string;
  condicion?: unknown;
  puntoPartida?: string;
  otrosPartidas?: string;
  horaPresentacion?: string;
  visitas?: string;
  tarifaTour?: string;
  actividad1?: string;
  actividad2?: string;
  actividad3?: string;
  traslados?: string;
  entradas?: string;
  impuesto?: number;
  cargosExtra?: number;
  cobroExtraSol?: number;
  cobroExtraDol?: number;
  acuenta?: number;
  medioPago?: string;
  documentoCobranza?: string;
  nserie?: string;
  ndocumento?: string;
  notas?: string;
  destino?: string;
};

type BuildInvoiceDataInput = {
  values: BuildInvoiceFormValues;
  pkg?: { destino?: string };
  tarifaRows?: TarifaRow[];
  tarifaTotal?: number;
  totalPagar?: number;
  saldo?: number;
  partidas?: OptionItem[];
  almuerzos?: OptionItem[];
  actividades?: OptionItem[];
  trasladosOptions?: OptionItem[];
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const textValue = (value: unknown) => String(value ?? "").trim();

const resolveOptionLabel = (
  options: OptionItem[] | undefined,
  value: unknown,
) => {
  const key = textValue(value);
  if (!key || key === "") return "";
  const found = options?.find((opt) => String(opt.value) === key);
  return found?.label ?? key;
};

const resolveSelectLabel = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const typed = value as { label?: string; value?: string };
    return textValue(typed.label ?? typed.value);
  }
  return textValue(value);
};

const resolveCanal = (value: unknown) => {
  if (!value) return { auxiliar: "", telefono: "" };
  if (typeof value === "string")
    return { auxiliar: value.trim(), telefono: "" };
  const typed = value as {
    auxiliar?: string;
    label?: string;
    value?: string;
    contacto?: string;
    telefono?: string;
  };
  return {
    auxiliar: textValue(
      typed.auxiliar ?? typed.label ?? typed.value ?? typed.contacto,
    ),
    telefono: textValue(typed.telefono),
  };
};

const resolvePartida = (value: unknown, partidas: OptionItem[] | undefined) => {
  const key = textValue(value);
  if (!key) return "";
  if (key === "HOTEL" || key === "OTROS") return key;
  return resolveOptionLabel(partidas, key) || key;
};

const buildDocumentoNumero = (serie: unknown, numero: unknown) => {
  const serieValue = textValue(serie);
  const numeroValue = textValue(numero);
  if (serieValue && numeroValue) {
    return `${serieValue}-${numeroValue}`;
  }
  return serieValue || numeroValue;
};

export const buildInvoiceData = ({
  values,
  pkg,
  tarifaRows,
  tarifaTotal,
  totalPagar,
  saldo,
  partidas,
  almuerzos,
  actividades,
  trasladosOptions,
}: BuildInvoiceDataInput): InvoiceData => {
  const rows = tarifaRows ?? [];
  const findRow = (id: string) => rows.find((row) => row.id === id);
  const canal = resolveCanal(values.canalVenta);
  const telefonos =
    canal.telefono || textValue(values.telefono) || textValue(values.celular);
  const pasajeroContacto =
    textValue(values.celular) || textValue(values.telefono);
  const pasajeroDocumento =
    textValue(values.documentoNumero) || textValue(values.documentoTipo);
  const actividadRows = [
    { key: "actividad1", label: "Actividad 01" },
    { key: "actividad2", label: "Actividad 02" },
  ];

  const actividadesData = actividadRows.map((row) => {
    const value = (values as Record<string, unknown>)[row.key];
    const actividad = resolveOptionLabel(actividades, value) || "";
    const cantidad = toNumber(findRow(row.key)?.cantidad);
    return {
      label: row.label,
      actividad,
      cantidad: actividad === "" ? null : cantidad || null,
    };
  });

  const buildItem = (
    id: string,
    label: string,
    descripcion: string,
    forceNA = false,
  ) => {
    const row = findRow(id);
    const precio = toNumber(row?.precioUnit);
    const cantidad = toNumber(row?.cantidad);
    const hasNumbers = precio > 0 || cantidad > 0;

    const resolvedDescripcion =
      descripcion && descripcion.trim() ? descripcion : forceNA ? "N/A" : "";

    return {
      label,
      descripcion: resolvedDescripcion,
      precio: hasNumbers ? precio : null,
      cantidad: hasNumbers ? cantidad : null,
      subtotal: hasNumbers ? Number((precio * cantidad).toFixed(2)) : null,
    };
  };

  const items = [
    buildItem(
      "actividad1",
      "Actividad 01 :",
      resolveOptionLabel(actividades, values.actividad1) || "",
    ),
    buildItem(
      "actividad2",
      "Actividad 02 :",
      resolveOptionLabel(actividades, values.actividad2) || "",
    ),
    buildItem(
      "traslados",
      "Traslados :",
      resolveOptionLabel(trasladosOptions, values.traslados) || "",
    ),
    buildItem("entradas", "Entradas :", "", true),
    buildItem(
      "otrosPagos",
      "Otros Pagos :",
      textValue(values.entradas) || "N/A",
    ),
  ];

  const impuestos = toNumber(values.impuesto);
  const cargos = toNumber(values.cargosExtra);
  const extraSoles = toNumber(values.cobroExtraSol);
  const extraDolares = toNumber(values.cobroExtraDol);
  const subtotal = toNumber(tarifaTotal);
  const total =
    totalPagar !== undefined
      ? toNumber(totalPagar)
      : subtotal + impuestos + cargos + extraSoles;
  const acuenta = toNumber(values.acuenta);
  const saldoValue = saldo !== undefined ? toNumber(saldo) : total - acuenta;

  return {
    destino: textValue(values.destino) || textValue(pkg?.destino),
    fechaViaje: textValue(values.fechaViaje),
    auxiliar: canal.auxiliar,
    telefonos,
    fechaEmision: textValue(values.fechaEmision),
    counter: textValue(values.counter),
    condicion: resolveSelectLabel(values.condicion),
    pasajeroNombre: textValue(values.nombreCompleto),
    pasajeroDocumento: pasajeroDocumento || "",
    pasajeroContacto: pasajeroContacto || "",
    pasajeroCant: toNumber(values.cantPax) || null,
    actividades: actividadesData,
    detalleServicio: {
      puntoPartida: resolvePartida(values.puntoPartida, partidas),
      horaPartida: textValue(values.horaPresentacion),
      otrosPuntos: textValue(values.otrosPartidas) || "",
      visitas: textValue(values.visitas),
    },
    items,
    impuestos,
    cargos,
    extraSoles,
    extraDolares,
    total,
    acuenta,
    saldo: saldoValue,
    fechaAdelanto: textValue(values.fechaPago),
    medioPago: textValue(values.medioPago),
    documento: textValue(values.documentoCobranza),
    nroDocumento: buildDocumentoNumero(values.nserie, values.ndocumento),
    observaciones: textValue(values.notas),
    moneda: textValue(values.moneda),
  };
};

/* =========================
   STYLES GENERALES (COMPACTO)
========================= */

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  content: {
    padding: 10, // 👈 antes 15
  },
  title: {
    fontSize: 12, // 👈 antes 14
    fontWeight: "bold",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 8,
    width: "30%",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 8,
    width: "70%",
  },
});

/* =========================
   CONTACT STYLES (COMPACTO)
========================= */

const contactS = StyleSheet.create({
  section: { marginTop: 8 },
  title: { fontSize: 9, fontWeight: "bold", marginBottom: 3 },

  table: { width: "100%", borderWidth: 1, borderColor: "#000" },
  headerRow: { flexDirection: "row", backgroundColor: "#000" },
  headerCell: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "bold",
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
  },
  bodyRow: { flexDirection: "row", backgroundColor: "#FFF9EE" },
  bodyCell: {
    fontSize: 8,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
  },
  lastCell: { borderRightWidth: 0 },

  /* ACTIVIDADES */
  activityRowFixed: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 1,
  },
  activityLeft: { flexDirection: "row", width: "70%" },
  activityLabelFixed: {
    width: "35%",
    backgroundColor: "#3F4348",
    color: "#FFF",
    fontSize: 8,
    padding: 4,
  },
  activityValueFixed: {
    width: "65%",
    backgroundColor: "#EEECE7",
    fontSize: 8,
    padding: 4,
    textTransform: "uppercase",
  },
  activityArrowFixed: {
    width: "5%",
    textAlign: "center",
    fontSize: 9,
    alignSelf: "center",
  },
  activityRight: { flexDirection: "row", width: "25%" },
  activityQtyLabelFixed: {
    width: "65%",
    backgroundColor: "#3F4348",
    color: "#FFF",
    fontSize: 8,
    padding: 4,
    textAlign: "center",
  },
  activityQtyValueFixed: {
    width: "35%",
    backgroundColor: "#EEECE7",
    fontSize: 8,
    padding: 4,
    textAlign: "center",
  },

  /* DETALLE SERVICIO */
  detailSection: { marginTop: 8 },
  detailTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 3 },
  detailRow: { flexDirection: "row" },
  detailLabel: {
    width: "25%",
    backgroundColor: "#3F4348",
    color: "#FFF",
    fontSize: 8,
    padding: 4,
  },
  detailValue: {
    width: "45%",
    backgroundColor: "#EEECE7",
    fontSize: 8,
    padding: 4,
  },
  detailHourLabel: {
    width: "18%",
    backgroundColor: "#3F4348",
    color: "#FFF",
    fontSize: 8,
    padding: 4,
    textAlign: "center",
  },
  detailHourValue: {
    width: "12%",
    backgroundColor: "#EEECE7",
    fontSize: 8,
    padding: 4,
    textAlign: "center",
  },
  detailFullValue: {
    width: "75%",
    backgroundColor: "#EEECE7",
    fontSize: 8,
    padding: 4,
  },

  /* TARIFA */
  tarifaSection: { marginTop: 8 },
  tarifaHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#EEECE7",
    paddingVertical: 2,
  },
  tarifaTitle: {
    width: "55%",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  tarifaColHeader: {
    width: "15%",
    fontSize: 8,
    color: "#C05A1A",
    textAlign: "center",
  },
  tarifaRow: { flexDirection: "row", minHeight: 14 },
  tarifaLabel: {
    width: "20%",
    backgroundColor: "#ED8A3A",
    color: "#FFF",
    fontSize: 8,
    padding: 3,
  },
  tarifaDesc: { width: "35%", fontSize: 8, padding: 3 },
  tarifaUnit: { width: "15%", fontSize: 8, textAlign: "center", padding: 3 },
  tarifaCant: { width: "15%", fontSize: 8, textAlign: "center", padding: 3 },
  tarifaSub: {
    width: "15%",
    fontSize: 8,
    textAlign: "right",
    padding: 3,
  },

  divider: { height: 6, backgroundColor: "#EEECE7", marginVertical: 4 },

  taxRow: { flexDirection: "row" },
  taxLabel: {
    width: "20%",
    backgroundColor: "#FFD000",
    fontSize: 8,
    padding: 3,
  },
  taxValue: { width: "65%", fontSize: 8, padding: 3 },
  taxAmount: {
    width: "15%",
    fontSize: 8,
    textAlign: "right",
    padding: 3,
  },

  extraRow: { flexDirection: "row", backgroundColor: "#FFF9EE" },

  /* LIQUIDACION */
  liquidationSection: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  liquidationTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 4 },
  liquidationTable: { width: "48%" },
  liquidationRow: { flexDirection: "row" },
  liquidationLabel: {
    width: "45%",
    backgroundColor: "#FFD000",
    fontSize: 8,
    fontWeight: "bold",
    padding: 4,
  },
  liquidationCurrency: {
    width: "15%",
    backgroundColor: "#EEECE7",
    fontSize: 8,
    padding: 4,
    textAlign: "center",
  },
  liquidationAmount: {
    width: "40%",
    backgroundColor: "#EEECE7",
    fontSize: 8,
    padding: 4,
    textAlign: "right",
  },
  noDebtBox: {
    marginTop: 8,
    backgroundColor: "#305496",
    paddingVertical: 8,
    alignItems: "center",
  },
  noDebtText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },

  paymentInfoBox: { width: "48%" },
  paymentRow: { flexDirection: "row" },
  paymentLabel: {
    width: "50%",
    backgroundColor: "#2E6DA4",
    color: "#FFF",
    fontSize: 8,
    padding: 4,
  },
  paymentValue: {
    width: "50%",
    backgroundColor: "#E3F0F8",
    fontSize: 8,
    padding: 4,
  },

  obsBox: { marginTop: 8 },
  obsTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 3 },
  obsContent: {
    backgroundColor: "#EEECE7",
    minHeight: 30,
    fontSize: 8,
    padding: 4,
  },
});

/* =========================
   PDF
========================= */

const InvoiceCityTour = ({
  data,
  pdfName,
}: {
  data?: InvoiceData;
  pdfName?: string;
}) => {
  const invoiceData = data ?? DEFAULT_INVOICE_DATA;
  const {
    destino,
    fechaViaje,
    auxiliar,
    telefonos,
    fechaEmision,
    counter,
    condicion,
    pasajeroNombre,
    pasajeroDocumento,
    pasajeroContacto,
    pasajeroCant,
    actividades,
    detalleServicio,
    items,
    impuestos,
    cargos,
    extraSoles,
    extraDolares,
    total,
    acuenta,
    saldo,
    fechaAdelanto,
    medioPago,
    documento,
    nroDocumento,
    observaciones,
    otrosPartidas,
    precioTotal,
    fechaRegistro,
    igv,
    cargosExtra,
  } = invoiceData;

  const currencySymbol = invoiceData.moneda === "DOLARES" ? "USD$" : "S/";
  const formatNumber = (value: unknown) => {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed)) return "";
    return parsed.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Document title={pdfName}>
      <Page size="A4" style={styles.page}>
        <Image src="/images/invoice/header.jpeg" />

        <View style={styles.content}>
          <Text style={styles.title}>{destino || ""}</Text>

          {/* Info Section */}
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            {[
              [
                ["Fecha de Viaje:", formatFechaParaMostrar(fechaViaje) || ""],
                ["Auxiliar:", auxiliar || ""],
                ["Telefonos:", telefonos || ""],
              ],
              [
                [
                  "Fecha de Emision:",
                  formatFechaParaMostrar(fechaRegistro ?? fechaEmision) || "",
                ],
                ["Counter:", counter || ""],
                ["Condicion:", condicion || ""],
              ],
            ].map((col, i) => (
              <View key={i} style={{ width: "50%" }}>
                {col.map(([l, v], j) => (
                  <View key={j} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{l}</Text>
                    <Text style={styles.infoValue}>{v}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={contactS.section}>
            {/* TITULO */}
            <Text style={contactS.title}>CONTACTO Y ACTIVIDADES DEL PAX :</Text>

            {/* TABLA */}
            <View style={contactS.table}>
              {/* HEADER */}
              <View style={contactS.headerRow}>
                <Text style={[contactS.headerCell, { width: "35%" }]}>
                  Nombre y Apellido del Pasajero
                </Text>
                <Text style={[contactS.headerCell, { width: "20%" }]}>
                  D.N.I / Pasaporte
                </Text>
                <Text style={[contactS.headerCell, { width: "25%" }]}>
                  Contacto del PAX
                </Text>
                <Text
                  style={[
                    contactS.headerCell,
                    contactS.lastCell,
                    { width: "20%" },
                  ]}
                >
                  Cant de PAX
                </Text>
              </View>

              {/* BODY */}
              <View style={contactS.bodyRow}>
                <Text style={[contactS.bodyCell, { width: "35%" }]}>
                  {pasajeroNombre || ""}
                </Text>
                <Text style={[contactS.bodyCell, { width: "20%" }]}>
                  {pasajeroDocumento || ""}
                </Text>
                <Text style={[contactS.bodyCell, { width: "25%" }]}>
                  {pasajeroContacto || ""}
                </Text>
                <Text
                  style={[
                    contactS.bodyCell,
                    contactS.lastCell,
                    { width: "20%" },
                  ]}
                >
                  {pasajeroCant ?? ""}
                </Text>
              </View>
            </View>
          </View>
          {/** <View style={{ marginTop: 10 }}>
            {actividades.slice(0, 2).map((item, index) => (
              <View key={index} style={contactS.activityRowFixed}>
                <View style={contactS.activityLeft}>
                  <Text style={contactS.activityLabelFixed}>
                    Atractivo de Lima {index + 1}
                  </Text>

                  <Text style={contactS.activityValueFixed}>
                    {item.actividad || "-"}
                  </Text>
                </View>

                <Text style={contactS.activityArrowFixed}>-&gt;</Text>

                <View style={contactS.activityRight}>
                  <Text style={contactS.activityQtyLabelFixed}>
                    Turno/Horario
                  </Text>
                  <Text style={contactS.activityQtyValueFixed}>
                    {item.turno || "-"}
                  </Text>
                </View>
              </View>
            ))}
          </View> */}
          <View style={contactS.detailSection}>
            {/* TITULO */}
            <Text style={contactS.detailTitle}>
              DETALLE DEL SERVICIO TURISTICO :
            </Text>

            {/* PUNTO DE PARTIDA */}
            <View style={contactS.detailRow}>
              <Text style={contactS.detailLabel}>Punto de Partida</Text>
              <Text style={contactS.detailValue}>
                {detalleServicio.puntoPartida || ""}
              </Text>
              <Text style={contactS.detailHourLabel}>Hora de Partida</Text>
              <Text style={contactS.detailHourValue}>
                {detalleServicio.horaPartida || ""}
              </Text>
            </View>

            {/* OTROS PUNTOS */}
            <View style={contactS.detailRow}>
              <Text style={contactS.detailLabel}>Otros Puntos de Partida</Text>
              <Text
                style={[
                  contactS.detailFullValue,
                  { textTransform: "uppercase" },
                ]}
              >
                {otrosPartidas || ""}
              </Text>
            </View>

            {/* VISITAS */}
            <View style={contactS.detailRow}>
              <Text style={contactS.detailLabel}>
                Visitas y{"\n"}Excursiones
              </Text>
              <Text style={contactS.detailFullValue}>
                {detalleServicio.visitas || ""}
              </Text>
            </View>
          </View>
          <View style={[contactS.tarifaSection]}>
            {/* HEADER */}
            <View style={contactS.tarifaHeaderRow}>
              <Text style={contactS.tarifaTitle}>DETALLE DE TARIFA :</Text>
              <Text style={contactS.tarifaColHeader}>Precio Unit.</Text>
              <Text style={contactS.tarifaColHeader}>Cant.</Text>
              <Text style={contactS.tarifaColHeader}>Sub Total</Text>
            </View>

            {/* ACTIVIDADES (SOLO 2) */}
            <View style={contactS.tarifaRow}>
              <Text style={contactS.tarifaLabel}>Tarifa de Tour :</Text>
              <Text style={[contactS.tarifaDesc, { fontStyle: "italic" }]}>
                {data?.items[0].descripcion}
              </Text>
              <Text style={contactS.tarifaUnit}>{data?.items[0].precio}</Text>
              <Text style={contactS.tarifaCant}>{data?.items[0].cantidad}</Text>
              <Text style={contactS.tarifaSub}>
                {data?.items[0].subtotal?.toFixed(2)}
              </Text>
            </View>
            {/* TRASLADOS (FIJO) */}
            <View style={contactS.tarifaRow}>
              <Text style={contactS.tarifaLabel}>Traslados :</Text>
              <Text style={contactS.tarifaDesc}>N/A</Text>
              <Text style={contactS.tarifaUnit}></Text>
              <Text style={contactS.tarifaCant}></Text>
              <Text style={contactS.tarifaSub}></Text>
            </View>

            {/* ENTRADAS (FIJO) */}
            <View style={contactS.tarifaRow}>
              <Text style={contactS.tarifaLabel}>Entradas :</Text>
              <Text style={[contactS.tarifaDesc, { fontStyle: "italic" }]}>
                N/A
              </Text>
              <Text style={contactS.tarifaUnit}></Text>
              <Text style={contactS.tarifaCant}></Text>
              <Text style={contactS.tarifaSub}></Text>
            </View>

            {/* OTROS PAGOS (FIJO) */}
            <View style={contactS.tarifaRow}>
              <Text style={contactS.tarifaLabel}>Otros Pagos :</Text>
              <Text style={contactS.tarifaDesc}>N/A</Text>
              <Text style={contactS.tarifaUnit}></Text>
              <Text style={contactS.tarifaCant}></Text>
              <Text style={contactS.tarifaSub}></Text>
            </View>

            {/* DIVIDER */}
            <View style={contactS.divider} />

            {/* IMPUESTOS 
            <View style={contactS.taxRow}>
              <Text style={contactS.taxLabel}>Impuestos (I.G.V.) :</Text>
              <Text style={contactS.taxValue}>N/A</Text>
              <Text style={contactS.taxAmount}>{impuestos.toFixed(2)}</Text>
            </View>

            <View style={contactS.taxRow}>
              <Text style={contactS.taxLabel}>Cargos :</Text>
              <Text style={contactS.taxValue}>N/A</Text>
              <Text style={contactS.taxAmount}>{cargos.toFixed(2)}</Text>
            </View>

            <View style={contactS.extraRow}>
              <Text style={contactS.taxLabel}>Cobros Extras :</Text>
              <Text style={contactS.taxValue}>
                En Soles ( S/ ) {extraSoles.toFixed(2)}
                {"   |   "}
                En Dolares ( US$ ) {extraDolares.toFixed(2)}
              </Text>
              <Text style={contactS.taxAmount}></Text>
            </View>*/}
            {/* DIVIDER */}

            {/* IGV */}
            <View style={contactS.taxRow}>
              <Text style={contactS.taxLabel}>Impuestos (I.G.V.) :</Text>
              <Text style={contactS.taxValue}>Incluye Impuestos</Text>
              <Text style={contactS.taxAmount}>{formatNumber(igv)}</Text>
            </View>

            {/* CARGOS */}
            <View style={contactS.taxRow}>
              <Text style={contactS.taxLabel}>Cargos :</Text>
              <Text style={contactS.taxValue}>Pagos {medioPago || ""}</Text>
              <Text style={contactS.taxAmount}>
                {formatNumber(cargosExtra)}
              </Text>
            </View>

            {/* COBROS EXTRAS */}
            <View style={contactS.extraRow}>
              <Text style={contactS.taxLabel}>Cobros Extras :</Text>
              <Text style={contactS.taxValue}>
                En Soles ( S/ ) {formatNumber(extraSoles)}
                {"   |   "}
                En Dolares ( US$ ) {formatNumber(extraDolares)}
              </Text>
              <Text style={contactS.taxAmount}></Text>
            </View>
            <View style={contactS.divider} />

            <View>
              <Text style={contactS.liquidationTitle}>
                PRECIO DE LA LIQUIDACION
              </Text>

              <View style={contactS.liquidationSection}>
                {/* IZQUIERDA */}
                <View style={contactS.liquidationTable}>
                  {[
                    ["TOTAL A PAGAR:", currencySymbol, total],
                    ["A CUENTA:", currencySymbol, acuenta],
                    ["SALDO:", currencySymbol, saldo],
                    ["Cobro Extra Soles:", "S/", extraSoles],
                    ["Cobro Extra Dolares:", "US$", extraDolares],
                  ].map(([label, curr, value], i) => {
                    const emphasize =
                      label === "TOTAL A PAGAR:" || label === "SALDO:";
                    return (
                      <View key={i} style={contactS.liquidationRow}>
                        <Text style={contactS.liquidationLabel}>{label}</Text>
                        <Text style={contactS.liquidationCurrency}>{curr}</Text>
                        <Text
                          style={[
                            contactS.liquidationAmount,
                            emphasize && { fontWeight: "bold" },
                          ]}
                        >
                          {formatNumber(value)}
                        </Text>
                      </View>
                    );
                  })}

                  {/* ESTADO */}
                  {data.mensajePasajero && (
                    <View
                      style={[
                        contactS.noDebtBox,
                        data.condicion !== "CANCELADO" && {
                          backgroundColor: "#C00000",
                        },
                      ]}
                    >
                      <Text style={contactS.noDebtText}>
                        {data.mensajePasajero}
                      </Text>
                    </View>
                  )}
                </View>

                {/* DERECHA */}
                <View style={contactS.paymentInfoBox}>
                  {[
                    [
                      "Fecha Adelanto:",
                      formatFechaSoloFecha(fechaAdelanto) || "",
                    ],
                    ["Medio de Pago:", medioPago || ""],
                    ["Documento de Vta:", documento || ""],
                    [
                      "Nro Documento:",
                      nroDocumento == "-"
                        ? data.nserie + "-" + data.ndocumento
                        : nroDocumento || "",
                    ],
                  ].map(([label, value], i) => (
                    <View key={i} style={contactS.paymentRow}>
                      <Text style={contactS.paymentLabel}>{label}</Text>
                      <Text style={contactS.paymentValue}>{value}</Text>
                    </View>
                  ))}

                  {/* OBSERVACIONES */}
                  <View style={contactS.obsBox}>
                    <Text style={contactS.obsTitle}>OBSERVACIONES</Text>
                    <Text style={contactS.obsContent}>
                      {observaciones || ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceCityTour;
