import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const formatDate = (date: string) => {
  if (!date) return "";

  const raw = String(date).trim();

  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}/${month}/${year}`;
  }

  const dmyMatch = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

const formatCurrency = (value: number | string) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const buildCityTourDescription = (data: any) => {
  const candidates = [
    data?.detalle?.act1?.servicio?.label,
    data?.detalle?.act2?.servicio?.label,
    data?.detalle?.act3?.servicio?.label,
    data?.detallexd?.act1?.servicio?.label,
    data?.detallexd?.act2?.servicio?.label,
    data?.detallexd?.act3?.servicio?.label,
  ];

  const labels = Array.from(
    new Set(
      candidates
        .map((item) => normalizeText(item))
        .filter((item) => item && item !== "-" && item !== "0"),
    ),
  );

  return labels.length > 0 ? labels.join(" + ").toUpperCase() : "";
};

const isCityTourFromUrl = () => {
  if (typeof window === "undefined") return false;
  return window.location.pathname.toLowerCase().includes("/citytour/");
};

const styles = StyleSheet.create({
  page: {
    fontSize: 8.5,
    padding: 28,
    fontFamily: "Helvetica",
  },

  row: { flexDirection: "row", marginTop: 3 },
  bold: { fontFamily: "Helvetica-Bold" },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  logoAndAddress: {
    width: "58%",
    alignItems: "center",
  },

  logoImage: {
    width: 140,
    height: 45,
    objectFit: "contain",
    marginBottom: 4,
  },

  rucBox: {
    width: "38%",
    border: "1px solid #000",
    backgroundColor: "#fdfdfd",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rucTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 6,
  },

  docTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 6,
  },

  docNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  docLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 6,
  },

  clientSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },

  itemsTable: {
    border: "1px solid #000",
    marginBottom: 8,
  },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#EDEDED",
    borderBottom: "1px solid #000",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 80,
  },

  colCantidad: {
    width: "12%",
    borderRight: "1px solid #000",
    justifyContent: "center",
    padding: 6,
    textAlign: "center",
  },

  colDescripcion: {
    width: "72%",
    borderRight: "1px solid #000",
    padding: 6,
    justifyContent: "center",
  },

  colImporte: {
    width: "16%",
    justifyContent: "center",
    padding: 6,
    textAlign: "right",
  },

  thText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },

  tdText: {
    fontSize: 8.5,
  },

  th: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
  },

  td: {
    padding: 4,
  },

  totalTable: {
    border: "0.8px solid #000",
    width: "38%",
  },
  footerContainer: {
    flexDirection: "row",
    paddingVertical: 14,
    marginTop: 8,
    alignItems: "flex-start",
  },

  leftFooter: {
    width: "46%",
  },

  centerFooter: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 44,
    marginRight: 44,
  },

  signatureLine: {
    width: 170,
    borderTop: "1px solid #000",
    marginBottom: 3,
  },

  paymentTitle: {
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },

  paymentText: {
    marginTop: 2,
  },

  signatureContainer: {
    marginTop: 18,
    alignItems: "center",
  },

  totalsContainer: {
    width: "33%",
  },

  totalLabel: {
    fontFamily: "Helvetica-Bold",
  },

  rightFooter: {
    width: "32%",
  },

  totalMainBox: {
    border: "1px solid #000",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 6,
  },

  totalLabelCol: {
    width: "55%",
  },

  totalCurrencyCol: {
    width: "10%",
  },

  totalValueCol: {
    width: "35%",
    textAlign: "right",
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
});

const buildItems = (data: any) => {
  const destino = normalizeText(data?.destino);
  const cityTourDescription = buildCityTourDescription(data);
  const isCityTour = isCityTourFromUrl();
  const producto =
    isCityTour && cityTourDescription ? cityTourDescription : destino || "-";
  const cantidad = Number(data?.cantPax ?? 0);
  const importe = Number(data?.precioTotal ?? data?.totalGeneral ?? 0);

  return [
    {
      descripcion: producto,
      cantidad,
      total: importe,
    },
  ];
};

export const InvoiceDocument = ({ data }: { data: any }) => {
  const items = buildItems(data);

  const moneda = data.moneda === "SOLES" ? "S/" : "USD $";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerTop}>
          <View style={styles.logoAndAddress}>
            <Image src="/images/picaflorV.png" style={styles.logoImage} />

            <Text>
              Av. Jose Pardo N° 620 Interior MZ-26 - Miraflores (Lima-Perú)
            </Text>
            <Text>Telf:(+51 1) 2415374 / 4441283</Text>
            <Text>Cel.:987420868 / #974930875 / (rpc) 984740005</Text>
            <Text>E-mail: info@viajespicaflorperu.net</Text>
          </View>

          <View style={styles.rucBox}>
            <Text style={styles.rucTitle}>RUC: 20535802972</Text>

            <Text style={styles.docTitle}>{data.documentoCobranza}</Text>

            <View style={styles.docNumberRow}>
              <Text style={styles.docLabel}>Nro.</Text>
              <Text>
                {data.nserie}-{data.ndocumento}
              </Text>
            </View>
          </View>
        </View>

        {/* CLIENT INFO */}
        <View style={styles.clientSection}>
          <View style={{ width: "58%" }}>
            <View style={styles.row}>
              <Text style={[styles.bold, { width: 70 }]}>Señor(es):</Text>
              <Text>{data.nombreCompleto}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.bold, { width: 70 }]}>Dirección:</Text>
              <Text>{data.direccion}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.bold, { width: 70 }]}>Teléfonos:</Text>
              <Text>{data.celular}</Text>
            </View>

            <View style={styles.row}>
              <Text style={[styles.bold, { width: 70 }]}>Counter:</Text>
              <Text>{data.counter}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.bold, { width: 70 }]}>Canal de venta:</Text>
              <Text>{data.auxiliar}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.bold, { width: 70 }]}>Tipo de moneda:</Text>
              <Text>{data.moneda}</Text>
            </View>
          </View>

          <View
            style={{
              width: "38%",
              border: "1px solid #000",
              height: 46,
            }}
          >
            {/* FILA 1 */}
            <View
              style={{
                flexDirection: "row",
                borderBottom: "1px solid #000",
                minHeight: 22,
              }}
            >
              {/* COLUMNA IZQUIERDA */}
              <View
                style={{
                  width: "55%",
                  backgroundColor: "#EDEDED",
                  borderRight: "1px solid #000",
                  justifyContent: "center",
                  paddingHorizontal: 6,
                }}
              >
                <Text>Liquidación N°</Text>
              </View>

              {/* COLUMNA DERECHA */}
              <View
                style={{
                  width: "45%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={styles.bold}>{data.notaId}</Text>
              </View>
            </View>

            {/* FILA 2 */}
            <View
              style={{
                flexDirection: "row",
                minHeight: 22,
              }}
            >
              {/* COLUMNA IZQUIERDA */}
              <View
                style={{
                  width: "55%",
                  backgroundColor: "#EDEDED",
                  borderRight: "1px solid #000",
                  justifyContent: "center",
                  paddingHorizontal: 6,
                }}
              >
                <Text>Fecha de Emisión:</Text>
              </View>

              {/* COLUMNA DERECHA */}
              <View
                style={{
                  width: "45%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={styles.bold}>{formatDate(data.fechaEmision)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ITEMS */}
        <View style={styles.itemsTable}>
          {/* HEADER */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.colCantidad}>
              <Text style={styles.thText}>Cantidad</Text>
            </View>

            <View style={styles.colDescripcion}>
              <Text style={styles.thText}>Producto</Text>
            </View>

            <View style={styles.colImporte}>
              <Text style={[styles.thText, { textAlign: "right" }]}>
                Importe
              </Text>
            </View>
          </View>

          {/* BODY */}
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colCantidad}>
                <Text style={styles.tdText}>{item.cantidad}</Text>
              </View>

              <View style={styles.colDescripcion}>
                <Text style={styles.tdText}>{item.descripcion}</Text>
              </View>

              <View style={styles.colImporte}>
                <Text style={[styles.tdText, { textAlign: "right" }]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footerContainer}>
          {/* LEFT */}
          <View style={styles.leftFooter}>
            <Text style={styles.bold}>WWW.VIAJESPICAFLORPERU.NET</Text>

            <Text style={{ marginTop: 6, fontFamily: "Helvetica-Bold" }}>
              Forma de Pago
            </Text>

            <Text style={{ marginTop: 2 }}>
              {String(data.medioPago || "").toUpperCase()}
            </Text>
          </View>

          {/* CENTER (FIRMA) */}
          <View style={styles.centerFooter}>
            <View style={styles.signatureLine} />
            <Text style={styles.bold}>AAVV</Text>
          </View>

          {/* RIGHT (TOTALES) */}
          <View
            style={{
              width: 220,
              borderColor: "#000",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "stretch",
                borderTopWidth: 0.8,
                borderRightWidth: 0.8,
                borderLeftWidth: 0.8,
              }}
            >
              <Text
                style={{
                  width: "49%",
                  paddingTop: 4,
                  paddingBottom: 4,
                  paddingLeft: 6,
                  paddingRight: 6,
                  fontSize: 9,
                  backgroundColor: "#EDEDED",
                  borderRightWidth: 0.8,
                  borderRightColor: "#000",
                  textAlign: "right",
                }}
              >
                Total: {moneda}
              </Text>

              <Text
                style={{
                  width: "45%",
                  paddingTop: 4,
                  paddingBottom: 4,
                  paddingLeft: 6,
                  paddingRight: 6,
                  fontSize: 9,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {formatCurrency(data.totalGeneral)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "stretch",
                borderTopWidth: 0.8,
              }}
            >
              <Text
                style={{
                  width: "49%",
                  padding: 6,
                  fontSize: 9,
                  textAlign: "right",
                }}
              >
                A cuenta: {moneda}
              </Text>

              <Text
                style={{
                  width: "45%",
                  padding: 6,
                  fontSize: 9,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {formatCurrency(data.acuenta)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "stretch",
              }}
            >
              <Text
                style={{
                  width: "49%",
                  padding: 6,
                  fontSize: 9,
                  textAlign: "right",
                }}
              >
                Saldo: {moneda}
              </Text>

              <Text
                style={{
                  width: "45%",
                  padding: 6,
                  fontSize: 9,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {formatCurrency(data.saldo)}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
