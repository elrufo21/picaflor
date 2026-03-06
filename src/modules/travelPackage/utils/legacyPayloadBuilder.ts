import type { ItineraryActivityRow, TravelPackageFormState } from "../types/travelPackage.types";

const cleanText = (value: unknown): string =>
  String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/[|;[\]]/g, " ")
    .trim();

const toDecimal = (value: unknown): string => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
};

const toInt = (value: unknown): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return String(Math.max(0, Math.floor(parsed)));
};

const toBoolFlag = (value: unknown): string => (value ? "1" : "0");

const isSinHotelPackage = (paquete: unknown) =>
  cleanText(paquete).toLowerCase().includes("sin hotel");

const resolveEstadoBySaldo = (form: TravelPackageFormState): string => {
  const estadoBase = cleanText(form.condicionPago || "CANCELADO").toUpperCase();
  if (estadoBase === "ACUENTA" || estadoBase === "CREDITO" || estadoBase === "CANCELADO") {
    return estadoBase;
  }
  return "CANCELADO";
};

const calculateHotelRoomImporteTotal = (
  habitaciones?: Array<{ cantidad: number; precio: number }>,
) =>
  Number(
    (habitaciones ?? [])
      .reduce(
        (sum, item) =>
          sum +
          Math.max(0, Number(item.cantidad || 0)) *
            Math.max(0, Number(item.precio || 0)),
        0,
      )
      .toFixed(2),
  );

const shouldPersistActivity = (row: ItineraryActivityRow) => {
  const detail = cleanText(row.detalle);
  const price = Number(row.precio || 0);
  const qty = Number(row.cant || 0);
  const subtotal = Number(row.subtotal || 0);

  if (row.tipo === "ENTRADA") {
    const normalized = detail.toUpperCase();
    if ((normalized === "" || normalized === "N/A") && price === 0 && qty === 0 && subtotal === 0) {
      return false;
    }
    return true;
  }

  if ((detail === "" || detail === "-") && price === 0 && qty === 0 && subtotal === 0) {
    return false;
  }

  return true;
};

export const buildTravelPackageLegacyPayload = (
  form: TravelPackageFormState,
): string => {
  const headerFields = [
    cleanText(form.fechaEmision),
    cleanText(form.programa),
    cleanText(form.fechaInicioViaje),
    cleanText(form.fechaFinViaje),
    cleanText(form.agencia?.value ?? ""),
    cleanText(form.agencia?.label ?? ""),
    cleanText(form.counter),
    cleanText(form.contacto),
    cleanText(form.telefono),
    cleanText(form.email),
    cleanText(form.condicionPago || "CANCELADO"),
    cleanText(form.moneda || "DOLARES"),
    cleanText(form.documentoCobranza),
    cleanText(form.nserie),
    cleanText(form.ndocumento),
    cleanText(form.medioPago),
    cleanText(form.entidadBancaria),
    cleanText(form.nroOperacion),
    toDecimal(form.precioExtraSoles),
    toDecimal(form.precioExtraDolares),
    toDecimal(form.igv),
    toDecimal(form.cargosExtra),
    toDecimal(form.totalGeneral),
    toDecimal(form.acuenta),
    toDecimal(form.deposito),
    toDecimal(form.efectivo),
    toDecimal(form.saldo),
    cleanText(form.mensajePasajero),
    cleanText(form.movilidadTipo),
    cleanText(form.movilidadEmpresa),
    toDecimal(form.movilidadPrecio),
    toBoolFlag(form.incluyeHotel),
    toInt(form.cantPax),
    cleanText(form.idioma),
    cleanText(form.incluye),
    cleanText(form.noIncluye),
    cleanText(form.impuestosAdicionales),
    cleanText(form.observaciones),
    resolveEstadoBySaldo(form),
  ];

  const detailRows: string[] = [];

  form.destinos.forEach((destino, index) => {
    const destinoName = cleanText(destino);
    if (!destinoName) return;
    detailRows.push(`DST|${index + 1}|${destinoName}|`);
  });

  form.paquetesViaje.forEach((row, index) => {
    const paqueteName = cleanText(row.paquete);
    if (!paqueteName) return;
    detailRows.push(
      `PAQ|${index + 1}|${paqueteName}|${toInt(row.cantPax)}|${toInt(row.cantidad)}|${isSinHotelPackage(paqueteName) ? "0" : "1"}`,
    );
  });

  form.pasajeros.forEach((row, index) => {
    const nombres = cleanText(row.nombres);
    if (!nombres) return;
    const fechaNacimiento = cleanText(row.fechaNacimiento);
    const fechaNacimientoToken = fechaNacimiento || "null";
    detailRows.push(
      `PAX|${index + 1}|${nombres}|${cleanText(row.pasaporte)}|${cleanText(row.nacionalidad)}|${cleanText(row.telefono)}|${fechaNacimientoToken}`,
    );
  });

  form.hotelesContratados.forEach((row, index) => {
    const hotelName = cleanText(row.hotel);
    if (!hotelName) return;

    const hotelKey = index + 1;
    const importeTotal = calculateHotelRoomImporteTotal(row.habitaciones);
    detailRows.push(
      `HOT|${hotelKey}|${index + 1}|${cleanText(row.region)}|${hotelName}|${cleanText(row.entradaSalida)}|${toBoolFlag(row.incluyeAlimentacion)}|${cleanText(row.alimentacionTipo)}|${toDecimal(row.alimentacionPrecio)}|${toDecimal(importeTotal)}`,
    );

    row.habitaciones.forEach((room, roomIndex) => {
      const roomType = cleanText(room.tipo);
      if (!roomType) return;
      detailRows.push(
        `HAB|${hotelKey}|${roomIndex + 1}|${roomType}|${toInt(room.cantidad)}|${toDecimal(room.precio)}`,
      );
    });
  });

  form.itinerario.forEach((day, dayIndex) => {
    const dayKey = dayIndex + 1;
    const date = cleanText(day.fecha);
    if (!date) return;

    detailRows.push(
      `DAY|${dayKey}|${dayIndex + 1}|${date}|${cleanText(day.titulo)}|${cleanText(day.origen)}|${cleanText(day.destino)}|${cleanText(day.observacion)}|${toDecimal(day.precioUnitario)}`,
    );

    day.actividades.forEach((row, rowIndex) => {
      if (!shouldPersistActivity(row)) return;
      detailRows.push(
        `ACT|${dayKey}|${rowIndex + 1}|${cleanText(row.tipo)}|${cleanText(row.detalle)}|${toDecimal(row.precio)}|${toInt(row.cant)}|${toDecimal(row.subtotal)}`,
      );
    });
  });

  // Legacy backend parser expects "orden[detalle" without closing bracket.
  return `${headerFields.join("|")}[${detailRows.join(";")}`;
};
