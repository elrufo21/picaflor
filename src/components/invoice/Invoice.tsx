import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#f89b2e",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#ffffff",
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 9,
    width: "30%",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 9,
    width: "70%",
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: 5,
    marginBottom: 5,
  },
  table: {
    width: "100%",
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4a4a4a",
    padding: 5,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    padding: 5,
    marginTop: 2,
  },
  tableCell: {
    fontSize: 8,
  },
  orangeRow: {
    flexDirection: "row",
    backgroundColor: "#f89b2e",
    padding: 5,
    marginTop: 2,
  },
  orangeLabel: {
    fontSize: 8,
    color: "#ffffff",
    fontWeight: "bold",
    width: "60%",
  },
  orangeValue: {
    fontSize: 8,
    color: "#ffffff",
    width: "20%",
    textAlign: "center",
  },
  grayRow: {
    flexDirection: "row",
    backgroundColor: "#d0d0d0",
    padding: 5,
    marginTop: 2,
  },
  grayLabel: {
    fontSize: 8,
    width: "60%",
  },
  grayValue: {
    fontSize: 8,
    width: "20%",
    textAlign: "center",
  },
  yellowRow: {
    flexDirection: "row",
    backgroundColor: "#ffd966",
    padding: 5,
    marginTop: 2,
  },
  yellowLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: "60%",
  },
  priceSection: {
    marginTop: 15,
  },
  priceTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: "bold",
    width: "40%",
  },
  priceValue: {
    fontSize: 9,
    width: "30%",
  },
  blueBox: {
    backgroundColor: "#4a6fa5",
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  blueBoxText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  detailRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailLabel: {
    fontSize: 9,
    width: "30%",
    fontWeight: "bold",
  },
  detailValue: {
    fontSize: 9,
    width: "70%",
  },
  visitasBox: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    marginTop: 5,
  },
  visitasText: {
    fontSize: 8,
  },
});

const PdfDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>✈ Viajes Picaflor</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>LIQUIDACION</Text>
          <Text style={styles.headerSubtitle}>DE SERVICIO TURISTICO</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>FULL DAY PARACAS</Text>

        {/* Info Section */}
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <View style={{ width: "50%" }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de Viaje:</Text>
              <Text style={styles.infoValue}>17/02/2023</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Auxiliar:</Text>
              <Text style={styles.infoValue}>**DIRECTO</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfonos:</Text>
              <Text style={styles.infoValue}>924228332</Text>
            </View>
          </View>
          <View style={{ width: "50%" }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de Emisión:</Text>
              <Text style={styles.infoValue}>17/02/2023 03:39:57</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Counter:</Text>
              <Text style={styles.infoValue}>ANDRE RAMIREZ</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Condición:</Text>
              <Text style={styles.infoValue}>CANCELADO</Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            CONTACTO Y ACTIVIDADES DEL PAX :
          </Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
              Nombre y Apellido del Pasajero
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "30%" }]}>
              D.N.I / Pasaporte
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Cant de PAX
            </Text>
            <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
              Cant de PAX
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "40%" }]}>
              ANDRE RAMIREZ CALLA
            </Text>
            <Text style={[styles.tableCell, { width: "30%" }]}>48065873</Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>924228332</Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>1</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "60%" }]}>
              Actividades Opcionales 1
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              EXCURSIÓN ISLAS BALLESTAS
            </Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>
              Cantidad Activ. 1
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "60%" }]}>
              Actividades Opcionales 2
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              AVENTURA EN TUBULARES Y SANDBOARD
            </Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>
              Cantidad Activ. 1
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "60%" }]}>
              Actividades Opcionales 3
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>-</Text>
            <Text style={[styles.tableCell, { width: "15%" }]}>
              Cantidad Activ.
            </Text>
          </View>
        </View>

        {/* Service Detail Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            DETALLE DEL SERVICIO TURISTICO :
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Punto de Partida</Text>
            <Text style={styles.detailValue}>PLAZA NORTE</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Otros Puntos de Partida</Text>
            <Text style={styles.detailValue}></Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hora de Partida</Text>
            <Text style={styles.detailValue}>04:30</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Visitas y Excursiones</Text>
          </View>

          <View style={styles.visitasBox}>
            <Text style={styles.visitasText}>
              BALNEARIO CERRO AZUL + PLAZA DE CAÑETE + PLAZA PRINCIPAL DE
              LUNAHUANÁ + CATAPALLA + DEGUSTACIÓN DE VINOS Y PISCO.
            </Text>
          </View>
        </View>

        {/* Price Detail Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DE TARIFA :</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "60%" }]}></Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: "15%", textAlign: "center" },
              ]}
            >
              Precio Unit.
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: "10%", textAlign: "center" },
              ]}
            >
              Cant.
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: "15%", textAlign: "center" },
              ]}
            >
              Sub Total
            </Text>
          </View>

          <View style={styles.orangeRow}>
            <Text style={styles.orangeLabel}>Tarifa de Tour :</Text>
            <Text style={styles.orangeValue}>99.00</Text>
            <Text style={[styles.orangeValue, { width: "10%" }]}>1</Text>
            <Text style={[styles.orangeValue, { width: "15%" }]}>99.00</Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.tableCell, { width: "85%" }]}>
              NO INCLUYE ALMUERZO
            </Text>
          </View>

          <View style={styles.orangeRow}>
            <Text style={styles.orangeLabel}>Actividad 01 :</Text>
            <Text style={styles.orangeValue}></Text>
            <Text style={[styles.orangeValue, { width: "10%" }]}>1</Text>
            <Text style={[styles.orangeValue, { width: "15%" }]}></Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.tableCell, { width: "85%" }]}>
              EXCURSIÓN ISLAS BALLESTAS
            </Text>
          </View>

          <View style={styles.orangeRow}>
            <Text style={styles.orangeLabel}>Actividad 02 :</Text>
            <Text style={styles.orangeValue}>35.00</Text>
            <Text style={[styles.orangeValue, { width: "10%" }]}>1</Text>
            <Text style={[styles.orangeValue, { width: "15%" }]}>35.00</Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.tableCell, { width: "85%" }]}>
              AVENTURA EN TUBULARES Y SANDBOARD
            </Text>
          </View>

          <View style={styles.orangeRow}>
            <Text style={styles.orangeLabel}>Actividad 03 :</Text>
            <Text style={styles.orangeValue}></Text>
            <Text style={[styles.orangeValue, { width: "10%" }]}></Text>
            <Text style={[styles.orangeValue, { width: "15%" }]}></Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.tableCell, { width: "85%" }]}>-</Text>
          </View>

          <View style={styles.orangeRow}>
            <Text style={styles.orangeLabel}>Traslados :</Text>
            <Text style={styles.orangeValue}></Text>
            <Text style={[styles.orangeValue, { width: "10%" }]}></Text>
            <Text style={[styles.orangeValue, { width: "15%" }]}></Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.tableCell, { width: "85%" }]}>-</Text>
          </View>

          <View style={styles.orangeRow}>
            <Text style={styles.orangeLabel}>Entradas :</Text>
            <Text style={styles.orangeValue}>16.00</Text>
            <Text style={[styles.orangeValue, { width: "10%" }]}>1</Text>
            <Text style={[styles.orangeValue, { width: "15%" }]}>16.00</Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.tableCell, { width: "85%" }]}>
              IMPTOS DE ISLAS + MUELLE
            </Text>
          </View>

          <View style={styles.grayRow}>
            <Text style={styles.grayLabel}>Impuestos (I.G.V.):</Text>
            <Text style={styles.grayValue}>N/A</Text>
          </View>

          <View style={styles.grayRow}>
            <Text style={styles.grayLabel}>Cargos:</Text>
            <Text style={styles.grayValue}>N/A</Text>
          </View>

          <View style={styles.yellowRow}>
            <Text style={styles.yellowLabel}>Cobros Extras:</Text>
            <Text style={[styles.grayValue, { width: "40%" }]}>
              En Soles ( S/ ) -{">"} 0.00 | En Dólares ( US$ ) 0.00
            </Text>
          </View>
        </View>

        {/* Final Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.priceTitle}>PRECIO DE LA LIQUIDACION</Text>

          <View style={{ flexDirection: "row" }}>
            <View style={{ width: "50%" }}>
              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    { backgroundColor: "#ffd966", padding: 3 },
                  ]}
                >
                  TOTAL A PAGAR:
                </Text>
                <Text style={styles.priceValue}>S/ 150.00</Text>
              </View>

              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    { backgroundColor: "#ffd966", padding: 3 },
                  ]}
                >
                  A CUENTA
                </Text>
                <Text style={styles.priceValue}>S/ 150.00</Text>
              </View>

              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    { backgroundColor: "#ffd966", padding: 3 },
                  ]}
                >
                  SALDO:
                </Text>
                <Text style={styles.priceValue}>S/ 0.00</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Cobro Extra Soles:</Text>
                <Text style={styles.priceValue}>S/ 0.00</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Cobro Extra Dólares:</Text>
                <Text style={styles.priceValue}>US$ 0.00</Text>
              </View>
            </View>

            <View style={{ width: "50%", paddingLeft: 20 }}>
              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    {
                      backgroundColor: "#4a6fa5",
                      color: "#ffffff",
                      padding: 3,
                    },
                  ]}
                >
                  Fecha Adelanto:
                </Text>
                <Text style={styles.priceValue}>17/02/2023</Text>
              </View>

              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    {
                      backgroundColor: "#4a6fa5",
                      color: "#ffffff",
                      padding: 3,
                    },
                  ]}
                >
                  Medio de Pago:
                </Text>
                <Text style={styles.priceValue}>EFECTIVO</Text>
              </View>

              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    {
                      backgroundColor: "#4a6fa5",
                      color: "#ffffff",
                      padding: 3,
                    },
                  ]}
                >
                  Documento de Vta:
                </Text>
                <Text style={styles.priceValue}>DOCUMENTO COBRANZA</Text>
              </View>

              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.priceLabel,
                    {
                      backgroundColor: "#4a6fa5",
                      color: "#ffffff",
                      padding: 3,
                    },
                  ]}
                >
                  Nº Documento:
                </Text>
                <Text style={styles.priceValue}>0001-00000001</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.priceTitle, { marginTop: 15 }]}>
            OBSERVACIONES
          </Text>

          <View style={styles.blueBox}>
            <Text style={styles.blueBoxText}>El Pasajero No Tiene Deuda</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default PdfDocument;
