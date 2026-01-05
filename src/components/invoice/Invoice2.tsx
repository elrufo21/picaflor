import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Estilos que replican la estética del documento original [cite: 1, 14, 16]
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0920e",
    color: "white",
    padding: 10,
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerRight: { textAlign: "right" },
  title: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginVertical: 10 },

  // Tablas y Grillas [cite: 4, 6, 9]
  row: { flexDirection: "row", marginBottom: 4 },
  label: { fontWeight: "bold", width: 100 },
  value: { flex: 1 },

  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    marginBottom: 10,
  },
  tableRow: { flexDirection: "row" },
  tableColHeader: {
    backgroundColor: "black",
    color: "white",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
  },
  tableCellHeader: {
    margin: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  tableCell: { margin: 4, fontSize: 8, textAlign: "center" },

  // Detalle de Tarifas [cite: 14]
  tarifaHeader: {
    color: "#c07c5a",
    borderBottomWidth: 1,
    borderBottomColor: "#c07c5a",
    flexDirection: "row",
    paddingBottom: 2,
  },
  tarifaRow: { flexDirection: "row", marginTop: 4, alignItems: "center" },
  orangeLabel: {
    backgroundColor: "#f0920e",
    color: "white",
    width: 80,
    paddingLeft: 4,
    marginRight: 5,
  },

  // Liquidación Final [cite: 16, 17]
  liquidationBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  totalRow: { flexDirection: "row", padding: 3, width: 200 },
  blueInfo: {
    width: 180,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#1e4b8f",
  },
  blueHeader: {
    backgroundColor: "#1e4b8f",
    color: "white",
    width: 80,
    padding: 2,
  },
  blueValue: { backgroundColor: "#f0f4f8", flex: 1, padding: 2 },

  stamp: {
    backgroundColor: "#2d5296",
    color: "white",
    padding: 10,
    textAlign: "center",
    width: 150,
    marginTop: 20,
    fontWeight: "bold",
  },
});

const MyPDFDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado [cite: 2, 10, 11] */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Viajes Picaflor</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>LIQUIDACION</Text>
          <Text style={{ fontSize: 12 }}>DE SERVICIO TURISTICO</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>FULL DAY PARACAS</Text>

      {/* Info General [cite: 4, 12] */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Viaje:</Text>
            <Text>17/02/2023</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Auxiliar:</Text>
            <Text>**DIRECTO</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teléfonos:</Text>
            <Text>924228332</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha Emisión:</Text>
            <Text>17/02/2023 03:39:57</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Counter:</Text>
            <Text>ANDRE RAMIREZ</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Condición:</Text>
            <Text>CANCELADO</Text>
          </View>
        </View>
      </View>

      {/* Pasajeros [cite: 6] */}
      <Text style={styles.sectionTitle}>CONTACTO Y ACTIVIDADES DEL PAX :</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableColHeader]}>
          <View style={{ flex: 2 }}>
            <Text style={styles.tableCellHeader}>Nombre y Apellido</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableCellHeader}>DNI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableCellHeader}>Telf</Text>
          </View>
          <View style={{ flex: 0.5 }}>
            <Text style={styles.tableCellHeader}>Cant</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={{ flex: 2, borderRightWidth: 1 }}>
            <Text style={styles.tableCell}>ANDRE RAMIREZ CALLA</Text>
          </View>
          <View style={{ flex: 1, borderRightWidth: 1 }}>
            <Text style={styles.tableCell}>48065873</Text>
          </View>
          <View style={{ flex: 1, borderRightWidth: 1 }}>
            <Text style={styles.tableCell}>924228332</Text>
          </View>
          <View style={{ flex: 0.5 }}>
            <Text style={styles.tableCell}>1</Text>
          </View>
        </View>
      </View>

      {/* Detalle Tarifas [cite: 14] */}
      <View style={{ marginTop: 20 }}>
        <View style={styles.tarifaHeader}>
          <Text style={{ flex: 2 }}>DETALLE DE TARIFA :</Text>
          <Text style={{ flex: 0.5, textAlign: "center" }}>Precio Unit.</Text>
          <Text style={{ flex: 0.5, textAlign: "center" }}>Cant.</Text>
          <Text style={{ flex: 0.5, textAlign: "right" }}>Sub Total</Text>
        </View>

        <View style={styles.tarifaRow}>
          <View style={styles.orangeLabel}>
            <Text>Tarifa Tour :</Text>
          </View>
          <Text style={{ flex: 1.1 }}>NO INCLUYE ALMUERZO</Text>
          <Text style={{ flex: 0.5, textAlign: "center" }}>99.00</Text>
          <Text style={{ flex: 0.5, textAlign: "center" }}>1</Text>
          <Text style={{ flex: 0.5, textAlign: "right" }}>99.00</Text>
        </View>
        <View style={styles.tarifaRow}>
          <View style={styles.orangeLabel}>
            <Text>Actividad 01 :</Text>
          </View>
          <Text style={{ flex: 1.1 }}>EXCURSIÓN ISLAS BALLESTAS</Text>
          <Text style={{ flex: 0.5, textAlign: "center" }}>-</Text>
          <Text style={{ flex: 0.5, textAlign: "center" }}>1</Text>
          <Text style={{ flex: 0.5, textAlign: "right" }}>-</Text>
        </View>
      </View>

      {/* Totales [cite: 16] */}
      <View style={styles.liquidationBox}>
        <View>
          <View style={[styles.totalRow, { backgroundColor: "#f0920e" }]}>
            <Text style={{ flex: 1, fontWeight: "bold" }}>TOTAL A PAGAR:</Text>
            <Text>S/ 150.00</Text>
          </View>
          <View style={[styles.totalRow, { backgroundColor: "#fcd34d" }]}>
            <Text style={{ flex: 1 }}>A CUENTA:</Text>
            <Text>S/ 150.00</Text>
          </View>
          <View style={[styles.totalRow, { backgroundColor: "#eeeeee" }]}>
            <Text style={{ flex: 1, fontWeight: "bold" }}>SALDO:</Text>
            <Text>S/ 0.00</Text>
          </View>
        </View>

        <View style={styles.blueInfo}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.blueHeader}>Fecha Adelanto:</Text>
            <Text style={styles.blueValue}>17/02/2023</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.blueHeader}>Medio Pago:</Text>
            <Text style={styles.blueValue}>EFECTIVO</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.blueHeader}>Documento:</Text>
            <Text style={styles.blueValue}>0001-00000001</Text>
          </View>
        </View>
      </View>

      {/* Sello Final [cite: 18] */}
      <View style={styles.stamp}>
        <Text>El Pasajero No</Text>
        <Text>Tiene Deuda</Text>
      </View>
    </Page>
  </Document>
);

export default MyPDFDocument;
