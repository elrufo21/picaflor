import { useForm } from "react-hook-form";

import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
} from "@mui/material";
import {
  ChevronLeft,
  Loader2,
  Lock,
  Plus,
  Printer,
  Save,
  Trash,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CanalVentaComponent from "./components/canalVentaComponent";
import PaxDetailComponent from "./components/paxDetailComponent";
import ViajeDetalleComponent from "./components/viajeDetalleComponent";
import PaimentDetailComponent from "./components/paimentDetailComponent";
import { useLocation, useNavigate, useParams } from "react-router";
import { usePackageStore } from "../store/cityTourStore";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import type { InvoiceData } from "@/components/invoice/Invoice";
import { roundCurrency } from "@/shared/helpers/formatCurrency";
import { showToast } from "@/components/ui/AppToast";
import { toISODate } from "@/shared/helpers/helpers";
import { formatDate } from "@/shared/helpers/formatDate";
function parseFecha(fecha: string): string {
  if (!fecha) return "";

  const [day, month, year] = fecha.split("/");

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
function fechaEmisionYMD(): string {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function n(v: any) {
  return v === null || v === undefined || v === "" ? "" : String(v);
}

function d(v: any) {
  return Number(v || 0).toFixed(2);
}

function isIslasBallestasActivity(servicio: any) {
  const label =
    servicio && typeof servicio === "object"
      ? (servicio.label ?? servicio.value)
      : servicio;
  if (!label) return false;
  return String(label).toLowerCase().includes("islas ballestas");
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

type ValidationError = {
  message: string;
  focus?: string;
};
const isServicioVacio = (servicio: any) => {
  if (!servicio) return true;

  if (typeof servicio === "object") {
    const value = String(servicio.value ?? "").trim();
    const label = String(servicio.label ?? "").trim();
    const id = String(servicio.id ?? "").trim();

    return value === "" || value === "0" || label === "-" || id === "0";
  }

  return String(servicio).trim() === "" || String(servicio).trim() === "-";
};
const isEmptyOrDash = (v: any) =>
  v === null ||
  v === undefined ||
  String(v).trim() === "" ||
  String(v).trim() === "-";

const validarTurnoActividad = (
  actividad: any,
  key: "act1" | "act2",
): ValidationError | null => {
  if (isServicioVacio(actividad?.servicio)) {
    return null;
  }

  const horaVacia = isEmptyOrDash(actividad?.hora);
  const turnoVacio = isEmptyOrDash(actividad?.turno);

  if (horaVacia && turnoVacio) {
    return {
      message: `LA ${
        key === "act1" ? "PRIMERA" : "SEGUNDA"
      } ACTIVIDAD REQUIERE HORA O TURNO (AM / PM)`,
      focus: `detalle.${key}.hora`,
    };
  }

  return null;
};

const getDetailField = (values: any, key: string) =>
  values?.detalle?.[key] ?? {};

const validateViajeValues = (values: any): ValidationError | null => {
  const canalSeleccionado = values.canalVenta ?? values.canalDeVenta;
  const canalVentaSelected = Boolean(
    canalSeleccionado && (canalSeleccionado.value || canalSeleccionado.label),
  );

  if (!canalVentaSelected) {
    return { message: "SELECCIONE UN CANAL DE VENTA", focus: "canalVenta" };
  }

  const condicionValue = String(values.condicion?.value ?? "")
    .trim()
    .toUpperCase();

  if (!condicionValue) {
    return {
      message: "SELECCIONE LA CONDICION DEL SERVICIO DE VIAJE",
      focus: "condicion",
    };
  }

  // ===============================
  // VALIDAR TURNOS DE ACTIVIDADES
  // ===============================
  const act1Error = validarTurnoActividad(
    getDetailField(values, "act1"),
    "act1",
  );
  if (act1Error) return act1Error;

  const act2Error = validarTurnoActividad(
    getDetailField(values, "act2"),
    "act2",
  );
  if (act2Error) return act2Error;

  // ===============================
  // VALIDAR: AL MENOS UNA ACTIVIDAD
  // ===============================
  const act1 = getDetailField(values, "act1");
  const act2 = getDetailField(values, "act2");

  const act1Selected =
    act1?.servicio &&
    act1.servicio !== "-" &&
    (act1.servicio.value || act1.servicio.label);

  const act2Selected =
    act2?.servicio &&
    act2.servicio !== "-" &&
    (act2.servicio.value || act2.servicio.label);

  if (!act1Selected && !act2Selected) {
    return {
      message: "DEBE SELECCIONAR AL MENOS UNA ACTIVIDAD",
      focus: "detalle.act1.servicio",
    };
  }

  // ===============================
  // VALIDAR PUNTO DE PARTIDA
  // ===============================
  if (!values.puntoPartida?.trim()) {
    return {
      message: "SELECCIONE EL PUNTO DE PARTIDA DE VIAJE",
      focus: "puntoPartida",
    };
  }

  // ===============================
  // VALIDAR MEDIO DE PAGO
  // ===============================
  if (!values.medioPago) {
    return { message: "SELECCIONE EL MEDIO DE PAGO", focus: "medioPago" };
  }

  if (condicionValue !== "CREDITO" && values.medioPago === "-") {
    return { message: "SELECCIONE EL MEDIO DE PAGO", focus: "medioPago" };
  }

  const medioPagoValue = String(values.medioPago ?? "")
    .trim()
    .toUpperCase();

  if (
    ["DEPOSITO", "YAPE", "TARJETA"].includes(medioPagoValue) &&
    !values.nroOperacion?.trim()
  ) {
    return {
      message: "DEPOSITO, YAPE o TARJETA requieren numero de operacion",
      focus: "nroOperacion",
    };
  }

  if (
    ["DEPOSITO", "YAPE", "TARJETA"].includes(medioPagoValue) &&
    !values.entidadBancaria
  ) {
    return {
      message: "SELECCIONE LA ENTIDAD BANCARIA",
      focus: "entidadBancaria",
    };
  }

  // ===============================
  // VALIDAR DATOS DEL CLIENTE
  // ===============================
  if (!values.nombreCompleto?.trim()) {
    return {
      message: "INGRESE EL NOMBRE DEL CLIENTE",
      focus: "nombreCompleto",
    };
  }

  if (!values.celular?.trim()) {
    return {
      message: "INGRESE EL TELEFONO DEL CLIENTE",
      focus: "celular",
    };
  }

  if (!values.cantPax) {
    return {
      message: "INGRESE LA CANTIDAD DE PASAJEROS",
      focus: "cantPax",
    };
  }

  // ===============================
  // VALIDAR TOTAL MAYOR A CERO
  // ===============================
  const totalToPay = Number(values.precioTotal ?? values.totalGeneral ?? 0);

  if (!Number.isFinite(totalToPay) || totalToPay <= 0) {
    return {
      message: "EL TOTAL A PAGAR DEBE SER MAYOR A CERO",
      focus: "precioTotal",
    };
  }

  // ===============================
  // VALIDAR SALDO
  // ===============================
  const saldo = Number(values.saldo ?? 0);
  if (saldo < 0) {
    return {
      message: "EL SALDO NO PUEDE SER NEGATIVO",
      focus: "saldo",
    };
  }

  // ===============================
  // VALIDAR PRECIO ACTIVIDADES
  // ===============================
  const primeraActividadTieneDetalle =
    act1?.detalleId !== undefined &&
    act1?.detalleId !== null &&
    String(act1?.detalleId).trim() !== "";

  if (
    act1Selected &&
    !primeraActividadTieneDetalle &&
    Number(act1?.precio) <= 0 &&
    !isIslasBallestasActivity(act1.servicio)
  ) {
    return {
      message: "SI SELECCIONO UNA PRIMERA ACTIVIDAD INGRESE EL PRECIO",
      focus: "detalle.act1.precio",
    };
  }

  const segundaActividadTieneDetalle =
    act2?.detalleId !== undefined &&
    act2?.detalleId !== null &&
    String(act2?.detalleId).trim() !== "";

  /*if (
    act2Selected &&
    !segundaActividadTieneDetalle &&
    Number(act2?.precio) <= 0 &&
    !isIslasBallestasActivity(act2.servicio)
  ) {
    return {
      message: "SI SELECCIONO UNA SEGUNDA ACTIVIDAD INGRESE EL PRECIO",
      focus: "detalle.act2.precio",
    };
  }*/

  // ===============================
  // VALIDAR ACUENTA
  // ===============================
  if (condicionValue.includes("ACUENTA")) {
    if (!values.acuenta && values.acuenta !== 0) {
      return {
        message:
          "SI SELECCIONO LA CONDICION ACUENTA, INGRESAR EL MONTO QUE LE DIO",
        focus: "acuenta",
      };
    }

    if (Number(values.acuenta) <= 0) {
      return {
        message:
          "SI SELECCIONO LA CONDICION ACUENTA, EL MONTO NO PUEDE SER CERO",
        focus: "acuenta",
      };
    }
  }

  return null;
};

function resolveServicioLabel(servicio: any) {
  if (!servicio) return "";
  if (typeof servicio === "object") {
    return servicio.label?.trim() ?? servicio.value?.trim() ?? "";
  }
  return String(servicio).trim();
}

function normalizarDetalleCreate(detalle: any): string {
  return Object.values(detalle)
    .map((i: any) => {
      const label = resolveServicioLabel(i?.servicio) || "-";

      const hora =
        typeof i?.turno === "string" && i.turno.trim() ? i.turno.trim() : "-";

      return [label, d(i?.precio), Number(i?.cant), d(i?.total), hora].join(
        "|",
      );
    })
    .join(";");
}

function normalizarDetalleEdit(detalle: any): string {
  return Object.values(detalle)
    .map((i: any) => {
      const hasServicioObject = i?.servicio && typeof i.servicio === "object";
      const detalleId =
        i?.detalleId ?? (hasServicioObject ? i.servicio.detalleId : undefined);

      let resolvedServicioLabel = resolveServicioLabel(i?.servicio) || "";
      const normalizedLabel = resolvedServicioLabel.trim().toUpperCase();
      if (!resolvedServicioLabel || normalizedLabel === "N/A") {
        resolvedServicioLabel = "-";
      }

      const hora =
        typeof i?.turno === "string" && i.turno.trim()
          ? i.turno.trim() // "AM" | "PM"
          : "-";

      return {
        detalleId,
        servicioLabel: resolvedServicioLabel,
        cant: Number(i?.cant),
        precio: i?.precio,
        total: i?.total,
        hora,
      };
    })
    .filter(
      (item) =>
        item.detalleId !== undefined &&
        item.detalleId !== null &&
        item.servicioLabel,
    )
    .map((item) =>
      [
        item.detalleId,
        item.servicioLabel,
        d(item.precio),
        item.cant,
        d(item.total),
        item.hora, // 👈 AM / PM
      ].join("|"),
    )
    .join(";");
}

function resolveActividadesEspeciales(detalle: any, idProducto: number) {
  if (Number(idProducto) !== 4) {
    return { islas: "", tubulares: "", otros: "" };
  }

  let islas = "";
  let tubulares = "";
  let otros = "";

  const actividades = ["act1", "act2", "act3"];

  actividades.forEach((key) => {
    const act = detalle?.[key];
    if (!act?.servicio || Number(act.cant) <= 0) return;

    const label =
      typeof act.servicio === "object"
        ? (act.servicio.label ?? act.servicio.value)
        : act.servicio;

    if (!label || label === "-" || label === "N/A") return;

    const text = String(label).toLowerCase();

    if (text.includes("islas ballestas")) {
      islas = String(act.cant);
    }

    if (text.includes("tubulares")) {
      tubulares = String(act.cant);
    }
  });

  const act3 = detalle?.act3;
  if (
    act3?.servicio &&
    act3.servicio !== "-" &&
    act3.servicio !== "N/A" &&
    Number(act3.cant) > 0
  ) {
    otros = String(act3.cant);
  }

  return { islas, tubulares, otros };
}

function buildListaOrdenCreate(data) {
  const detalle = normalizarDetalleCreate(data.detalle);

  const { islas, tubulares, otros } = resolveActividadesEspeciales(
    data.detalle,
    data.idProducto,
  );

  const orden = [
    n(data.documentoCobranza), // 1 NotaDocu
    2, // 2 flagServicio ✅ FIJO
    n(data.nombreCompleto), // 3 nombrePax
    n(data.documentoNumero), // 4 dniPax
    n(data.clienteId ?? 0), // 5 ClienteId
    n(data.counter), // 6 NotaUsuario
    n(data.medioPago), // 7 NotaFormaPago
    n(data.condicion?.value), // 8 NotaCondicion
    n(data.celular), // 9 NotaTelefono
    d(data.totalGeneral), // 10 NotaSubtotal
    d(data.precioTotal), // 11 NotaTotal
    d(data.acuenta), // 12 NotaAcuenta
    d(data.saldo), // 13 NotaSaldo
    d(data.precioExtra), // 14 NotaAdicional
    d(data.precioTotal), // 15 NotaPagar
    n(data.condicion?.value), // 16 NotaEstado
    1, // 17 CompaniaId
    "N/A", // 18 IncluyeIGV
    "", // 19 Serie
    "", // 20 Numero
    0, // 21 NotaGanancia
    data.usuarioId, // 22 UsuarioId
    n(data.entidadBancaria), // 23 EntidadBancaria
    n(data.nroOperacion), // 24 NroOperacion
    d(data.efectivo), // 25 Efectivo
    d(data.deposito), // 26 Deposito
    data.idProducto, // 27 IdProducto
    n(data.canalVenta), // 28 Auxiliar
    n(data.canalDeVentaTelefono), // 29 TelefonoAuxiliar
    data.cantPax, // 30 CantidadPax
    n(data.puntoPartida), // 31 PuntoPartida
    n(data.horaPartida), // 32 HoraPartida
    n(data.otrosPartidas ?? ""), // 33 otrasPartidas
    n(data.visitas), // 34 VisitasExCur
    n(Number(data.precioExtraSoles ?? 0)), // 35 CobroExtraSol
    n(Number(data.precioExtraDolares ?? 0)), // 36 CobroExtraDol
    data.fechaAdelanto, // 37 FechaAdelanto
    n(data.mensajePasajero?.toUpperCase() ?? ""), // 38 MensajePasajero
    n(data.observaciones ?? ""), // 39 Observaciones
    islas, // 40 Islas
    tubulares, // 41 Tubulares
    otros, // 42 otros
    data.fechaViaje, // 43 FechaViaje
    0, // 44 IGV
    "N/A", // 45 IncluyeCargos
    data.moneda, // 46 Monedas
    n(data?.detalle?.tarifa?.servicio?.label ?? ""), // 47 IncluyeALmuerzo
    "", // 48 NotaImagen
    n(data?.hotel?.label ?? ""), // 49 Hotel
    data.region, // 50 Region
  ].join("|");

  return `${orden}[${detalle}]`;
}

function buildListaOrdenEdit(data) {
  const detalle = normalizarDetalleEdit(data.detalle);
  const { islas, tubulares, otros } = resolveActividadesEspeciales(
    data.detalle,
    data.idProducto,
  );
  const orden = [
    n(data.documentoCobranza), // 1  NotaDocu
    n(data.nombreCompleto), // 2  nombrePax
    n(data.documentoNumero), // 3  dniPax
    Number(data.clienteId), // 4  ClienteId
    n(data.counter), // 5  NotaUsuario
    n(data.medioPago), // 6  NotaFormaPago
    n(data.condicion?.value), // 7  NotaCondicion
    n(data.celular), // 8  NotaTelefono
    d(data.totalGeneral), // 9  NotaSubtotal
    d(data.precioTotal), // 10 NotaTotal
    d(data.acuenta), // 11 NotaAcuenta
    d(data.saldo), // 12 NotaSaldo
    d(data.precioExtra), // 13 NotaAdicional
    d(data.precioTotal), // 14 NotaPagar
    n(data.condicion?.value), // 15 NotaEstado
    1, // 16 CompaniaId (hardcoded to 2)
    "N/A", // 17 IncluyeIGV
    n(data.nserie), // 18 Serie
    n(data.ndocumento), // 19 Numero
    0, // 20 NotaGanancia
    Number(data.usuarioId), // 21 UsuarioId
    n(data.entidadBancaria), // 22 EntidadBancaria
    n(data.nroOperacion), // 23 NroOperacion
    d(data.efectivo), // 24 Efectivo
    d(data.deposito), // 25 Deposito
    Number(data.idProducto), // 26 IdProducto
    n(data.canalVenta), // 27 Auxiliar
    n(data.canalDeVentaTelefono), // 28 TelefonoAuxiliar
    Number(data.cantPax), // 29 CantidadPax
    n(data.puntoPartida), // 30 PuntoPartida
    n(data.horaPartida), // 31 HoraPartida
    n(data.otrosPartidas ?? ""), // 32 otrasPartidas
    n(data.visitas), // 33 VisitasExCur
    n(Number(data.precioExtraSoles ?? 0)), // 34 CobroExtraSol
    n(Number(data.precioExtraDolares ?? 0)), // 35 CobroExtraDol
    n(toISODate(data.fechaAdelanto)), // 36 FechaAdelanto
    n(data.mensajePasajero?.toUpperCase() ?? ""), // 37 MensajePasajero
    n(data.observaciones ?? ""), // 38 Observaciones
    islas, // 39 Islas
    tubulares, // 40 Tubulares
    otros, // 41 otros
    n(toISODate(data.fechaViaje)), // 42 FechaViaje
    0, // 43 IGV
    "N/A", // 44 IncluyeCargos
    Number(data.notaId), // 45 NotaId
    0, // 46 Aviso
    n(data.moneda), // 47 Monedas
    n(data.detalle.tarifa.servicio.label ?? ""), // 48 IncluyeALmuerzo
    "", // 49 NotaImagen
    n(data?.hotel?.label ?? ""), // 50 Hotel
    n(data.region), // 51 Region
  ].join("|");

  return `${orden}[${detalle}]`;
}

async function agregarViaje(valores, edit) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/Programacion/${!edit ? "agregar-viaje" : "editar-viaje"}`,
      {
        valores: valores,
      },
      {
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Error backend:", error.response.data);
    } else {
      console.error("Error axios:", error.message);
    }
  }
}

//pdf
export function parseBackendResponse(response: string) {
  const raw = String(response).trim();

  // Detectar separador
  const separator = raw.includes("¬") ? "¬" : "-";

  const parts = raw.split(separator);

  if (parts.length < 4) {
    throw new Error(`Formato de respuesta inválido: ${raw}`);
  }

  const [notaId, serie, numero, fechaEmision] = parts;

  return {
    notaId: notaId.trim(),
    serie: serie.trim(),
    numero: numero.trim(),
    fechaEmision: fechaEmision.trim(),
    nroDocumento: `${serie.trim()}-${numero.trim()}`,
  };
}
export function parseFechaToYMD(fecha: string): string {
  if (!fecha) return fecha;

  const match = fecha.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?$/,
  );

  if (!match) return fecha;

  const [, day, month, year, time] = match;

  return time ? `${year}-${month}-${day} ${time}` : `${year}-${month}-${day}`;
}

export function adaptViajeJsonToInvoice(
  viajeJson: any,
  backendResponse: string | boolean,
): InvoiceData {
  const isEdit = backendResponse === true;
  const backend = isEdit
    ? {
        serie: viajeJson.nserie,
        numero: viajeJson.ndocumento,
        fechaEmision: viajeJson.fechaEmision,
        nroDocumento: `${viajeJson.nserie}-${viajeJson.ndocumento}`,
      }
    : parseBackendResponse(String(backendResponse));

  const actividades = ["act1", "act2"].map((key, idx) => {
    const act = viajeJson.detalle?.[key];

    const actividad =
      act?.servicio && typeof act.servicio === "object"
        ? (act.servicio.label ?? "")
        : "";

    const turno =
      typeof act?.turno === "string" && act.turno.trim()
        ? act.turno.trim()
        : null;

    return {
      label: `Actividad ${idx + 1}`,
      actividad,
      turno, // 👈 AM / PM
    };
  });

  const detalle = viajeJson.detalle || {};
  const detalleRows = [
    { key: "tarifa", label: "Tarifa de Tour :" },
    { key: "act1", label: "Actividad 01 :" },
    { key: "act2", label: "Actividad 02 :" },
    { key: "act3", label: "Actividad 03 :" },
    { key: "traslado", label: "Traslados :" },
    { key: "entrada", label: "Entradas :" },
  ];

  const items = detalleRows.map(({ key, label }) => {
    const row = detalle[key] || {};
    const servicio = row.servicio;
    const descripcion =
      typeof servicio === "object"
        ? (servicio?.label ?? "-")
        : (servicio ?? "-");
    const precioValue = Number(row.precio ?? 0);
    const cantidadValue = Number(row.cant ?? 0);
    const subtotalValue = Number(row.total ?? 0);
    const hasAmounts =
      precioValue > 0 || cantidadValue > 0 || subtotalValue > 0;

    return {
      label,
      descripcion: descripcion || "-",
      precio: hasAmounts ? roundCurrency(precioValue) : null,
      cantidad: hasAmounts ? cantidadValue || null : null,
      subtotal: hasAmounts ? roundCurrency(subtotalValue) : null,
    };
  });

  return {
    destino: viajeJson.destino,
    fechaViaje: viajeJson.fechaViaje,
    otrosPartidas: viajeJson.otrosPartidas,
    auxiliar: viajeJson.canalVenta ?? viajeJson.auxiliar,
    telefonos: viajeJson.canalDeVentaTelefono || viajeJson.celular,

    fechaEmision: backend.fechaEmision,
    counter: viajeJson.counter,
    condicion: viajeJson.condicion?.value,

    pasajeroNombre: viajeJson.nombreCompleto,
    pasajeroDocumento: viajeJson.documentoNumero,
    pasajeroContacto: viajeJson.celular,
    pasajeroCant: viajeJson.cantPax,

    actividades,

    detalleServicio: {
      puntoPartida: viajeJson.puntoPartida,
      horaPartida: viajeJson.horaPartida,
      otrosPuntos: "-",
      visitas: viajeJson.visitas,
    },

    items,
    fechaRegistro: viajeJson?.fechaRegistro || null,
    impuestos: 0,
    cargos: 0,
    extraSoles: viajeJson.precioExtra ?? 0,
    extraDolares: 0,

    total: viajeJson.totalGeneral,
    acuenta: viajeJson.acuenta,
    saldo: viajeJson.saldo,

    fechaAdelanto: isEdit ? viajeJson?.fechaRegistro : backend.fechaEmision,
    medioPago: viajeJson.medioPago,

    documento: viajeJson.documentoCobranza,
    nroDocumento: backend.nroDocumento,

    observaciones: viajeJson.observaciones ?? "",
    mensajePasajero: viajeJson.mensajePasajero.toUpperCase() ?? "",
    precioTotal: viajeJson.precioTotal,
    moneda: viajeJson.moneda,
  };
}
export function parseDateForInput(
  value?: Date | string | number | null,
): string {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) return "";

  // YYYY-MM-DD (sin timezone bugs)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const ViajeForm = () => {
  const { formData, setFormData, isEditing, setIsEditing } = usePackageStore();
  const location = useLocation();
  const incomingFormData = (location.state as { formData?: any })?.formData;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      destino: "",
      fechaViaje: "",
      descripcion: "",
      fechaEmision: "",
      cantPax: 0,
      canalVenta: null,
      documentoCobranza: "DOCUMENTO COBRANZA",
      disponibles: 0,
      region: "",
      counter: "",
      moneda: "DOLARES",
      canalDeVentaTelefono: "",
      fechaAdelanto: parseDateForInput(Date()),
      saldo: "0",
      medioPago: "",
      detalle: {
        tarifa: { servicio: null, precio: 0, cant: 1, total: 0 },
        act1: {
          servicio: {
            label: "City Tour Lima",
            id: "22",
            value: "22",
            descripcion:
              "Parque del Amor Miraflores + Parque El Olivar + Plaza Mayor de Lima, Convento San Francisco + Catacumbas + Palacio de Gobierno + Palacio Municipal + Catedral de Lima.",
          },
          precio: 20,
          cant: 0,
          total: 0,
          turno: "",
        },
        act2: { servicio: null, precio: 0, cant: 0, total: 0 },
        act3: { servicio: null, precio: 0, cant: 0, total: 0 },
        traslado: { servicio: null, precio: 0, cant: 0, total: 0 },
        entrada: { servicio: null, precio: 0, cant: 0, total: 0 },
      },
      totalGeneral: 0,
    },
  });
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!formData) return;

    reset({
      ...formData,

      condicion: formData.condicion ?? {
        value: "PENDIENTE",
        label: "Pendiente",
      },

      detalle: formData.detalle ?? {
        tarifa: { servicio: null, precio: 0, cant: 1, total: 0 },
        act1: { servicio: null, precio: 0, cant: 0, total: 0 },
        act2: { servicio: null, precio: 0, cant: 0, total: 0 },
        act3: { servicio: null, precio: 0, cant: 0, total: 0 },
        traslado: { servicio: null, precio: 0, cant: 0, total: 0 },
        entrada: { servicio: null, precio: 0, cant: 0, total: 0 },
      },
    });

    hydratedRef.current = true; // 🔐 CLAVE
  }, [formData, reset]);

  const navigate = useNavigate();
  //sesion
  const sessionRaw = localStorage.getItem("picaflor.auth.session");
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const { idProduct, liquidacionId } = useParams();
  const { packages, date, loadPackages } = usePackageStore();
  useEffect(() => {
    if (!incomingFormData || formData) return;
    setFormData(incomingFormData);
  }, [incomingFormData, formData, setFormData]);
  useEffect(() => {
    return () => {
      setFormData(null);
    };
  }, []);
  useEffect(() => {
    if (!liquidacionId) return;
    if (formData || incomingFormData) return;
    navigate("/citytour", { replace: true });
  }, [formData, incomingFormData, liquidacionId, navigate]);

  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (packages.length === 0) {
      loadPackages(date);
    }
  }, [date, loadPackages]);
  useEffect(() => {
    setIsEditing(!liquidacionId);
  }, [liquidacionId, setIsEditing]);

  useEffect(() => {
    if (!packages.length) return;

    const selectedPackage = packages.find(
      (p) => String(p.idProducto) === String(idProduct),
    );

    if (!selectedPackage) return;

    setValue("disponibles", selectedPackage.disponibles, {
      shouldDirty: true,
    });
    setValue("destino", selectedPackage.destino, {
      shouldDirty: true,
    });
    setValue(
      "fechaViaje",
      watch("fechaViaje") !== "" ? watch("fechaViaje") : selectedPackage.fecha,
      {
        shouldDirty: true,
      },
    );
    setValue("region", selectedPackage.region, {
      shouldDirty: true,
    });
    if (!liquidacionId && watch("counter") === "") {
      setValue("counter", session.user.displayName, {
        shouldDirty: true,
      });
    }
  }, [packages, idProduct, setValue]);

  const destino = watch("destino");
  const fechaViaje = watch("fechaViaje");
  const fechaEmision = watch("fechaEmision");

  const fieldsetDisabled = isSubmitting || isSaving || !isEditing;
  const saveButtonLabel = isSaving ? "Guardando..." : "Guardar";

  const onSubmit = async (data) => {
    const validationError = validateViajeValues(data);
    if (validationError) {
      showToast({
        title: "Validación",
        description: validationError.message,
        type: "error",
      });
      if (validationError.focus) {
        setFocus(validationError.focus);
      }
      return;
    }

    setIsSaving(true);

    try {
      const fechaViajeValue = liquidacionId
        ? data.fechaViaje
        : parseFecha(data.fechaViaje);

      const payload = {
        ...data,
        _editMode: Boolean(liquidacionId),
        fechaViaje: fechaViajeValue,
        fechaEmision: fechaEmisionYMD(),
        precioExtra: data.precioExtra === "" ? 0 : data.precioExtra,
        totalGeneral: Number(data.totalGeneral ?? data.precioTotal),

        cantPax: Number(data.cantPax),
        usuarioId: Number(session.user.id),
        companiaId: 1,
        idProducto: Number(idProduct),
        canalVenta: data.canalDeVenta?.auxiliar ?? data.canalVenta,
      };

      const listaOrden = payload._editMode
        ? buildListaOrdenEdit(payload)
        : buildListaOrdenCreate(payload);

      const result = await agregarViaje(listaOrden, payload._editMode);
      if (result == "error") {
        showToast({
          title: "Error",
          description: "Error en el servidor",
          type: "error",
        });
      }
      if (result === "false") {
        showToast({
          title: "Error",
          description: "No se pudo procesar la solicitud",
          type: "error",
        });
      }

      if (result === "OPERACION") {
        showToast({
          title: "Error",
          description: "Error en la operación, verifique los datos",
          type: "error",
        });
      }

      if (payload._editMode && result !== true) {
        showToast({
          title: "Error",
          description: "Respuesta inválida del servidor en edición",
          type: "error",
        });
        return;
      }

      const pdfData = adaptViajeJsonToInvoice(
        { ...payload, visitas: watch("visitas") },
        result,
      );

      const backendPayload = payload._editMode
        ? `${liquidacionId}¬¬¬${formatDate(payload.fechaAdelanto) ?? ""}`
        : result;

      localStorage.setItem("invoiceData", JSON.stringify(pdfData));
      localStorage.setItem("invoiceBackend", result);
      navigate(`/cityTour/${idProduct}/passengers/preview`, {
        state: {
          invoiceData: pdfData,
          backendPayload,
          nserie: payload.nserie,
          ndocumento: payload.ndocumento,
        },
      });
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNew = () => {
    navigate(`/cityTour`);
  };

  const handlePrint = () => {
    try {
      const formValues = getValues();
      const invoiceData = adaptViajeJsonToInvoice(
        {
          ...formValues,
          fechaAdelanto: watch("fechaAdelanto"),
          visitas: watch("visitas"),
        },
        true,
      );
      const backendPayload = liquidacionId ?? formValues.nserie ?? "";
      navigate(`/cityTour/${idProduct}/passengers/preview`, {
        state: {
          invoiceData,
          backendPayload,
          nserie: formValues.nserie,
          ndocumento: formValues.ndocumento,
        },
      });
    } catch (error) {
      console.error("Error al preparar impresión:", error);
    }
  };

  const handleDelete = async () => {
    if (!liquidacionId) return;

    try {
      setIsSaving(true);
      const response = await axios.delete(
        `${API_BASE_URL}/Nota/${liquidacionId}`,
      );

      const deleted = response?.data === true || response?.data === "true";

      if (deleted) {
        showToast({
          title: "Eliminado",
          description: "La liquidación se eliminó correctamente.",
          type: "success",
        });
        navigate("/cityTour/programacion/liquidaciones", {
          state: { refresh: Date.now() },
        });
      } else {
        showToast({
          title: "Error",
          description: "No se pudo eliminar la liquidación.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      showToast({
        title: "Error",
        description: "Algo salió mal al intentar eliminar.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    closeDeleteDialog();
    await handleDelete();
  };

  const openDeleteDialog = () => {
    if (!liquidacionId) return;
    setDeleteDialogOpen(true);
  };

  const handleUnlockEditing = () => {
    setIsEditing(true);
  };

  const handleEnterFocus = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      const form = e.target.form;
      const index = Array.prototype.indexOf.call(form, e.target);
      const nextElement = form.elements[index + 1];
      if (nextElement) {
        nextElement.focus();
      }
    }
  };
  return (
    <>
      <Backdrop
        open={isSaving}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: "blur(2px)",
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <CircularProgress color="inherit" />
          <p className="text-sm text-white">Guardando...</p>
        </div>
      </Backdrop>

      <div className="max-w-8xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={handleEnterFocus}
            noValidate
          >
            <div
              className="
                  sticky top-2 z-30
                  flex flex-col gap-3
                  lg:flex-row lg:items-center lg:justify-between
                  rounded-xl border border-emerald-200
                  bg-emerald-50 px-4 py-3 shadow-sm
                "
            >
              {/* ================= INFO ================= */}
              <div
                className="
                  flex flex-wrap gap-x-4 gap-y-2
                  min-w-0
                "
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <ChevronLeft
                    className="cursor-pointer"
                    onClick={() => {
                      if (liquidacionId) {
                        navigate("/fullday/programacion/liquidaciones");
                      } else {
                        navigate("/cityTour");
                      }
                    }}
                  />
                </div>
                {/* DESTINO */}
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-slate-500 text-xs">Destino:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[360px] sm:max-w-[460px]">
                    {destino || "-"}
                  </span>
                </div>

                {/* FECHA VIAJE */}
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-slate-500 text-xs">Viaje:</span>
                  <span className="text-sm font-medium text-slate-700">
                    {fechaViaje || "-"}
                  </span>
                </div>

                {/* FECHA EMISIÓN */}
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-slate-500 text-xs">Emisión:</span>
                  <span className="text-sm font-medium text-slate-700">
                    {fechaEmision || "-"}
                  </span>
                </div>

                {/* DISPONIBLES */}
                <div className="flex items-center gap-1 rounded-md bg-white px-2 py-1 border border-emerald-200 whitespace-nowrap">
                  <span className="text-xs text-slate-500">Disp:</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {watch("disponibles")}
                  </span>
                </div>
              </div>

              {/* ================= ACCIONES ================= */}
              <div
                className="
                flex flex-wrap gap-2
                justify-end
                shrink-0
              "
              >
                {isEditing && (
                  <>
                    <button
                      type="submit"
                      title={saveButtonLabel}
                      disabled={fieldsetDisabled}
                      className="
                    inline-flex items-center gap-1
                    rounded-lg bg-emerald-600 px-3 py-2
                    text-white shadow-sm
                    ring-1 ring-emerald-600/30
                    hover:bg-emerald-700 transition
                    disabled:opacity-70 disabled:cursor-not-allowed
                  "
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      <span className="text-sm hidden sm:inline">
                        {saveButtonLabel}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNew}
                      disabled={fieldsetDisabled}
                      className="
                      inline-flex items-center gap-1
                      rounded-lg bg-slate-100 px-3 py-2
                      text-slate-700 ring-1 ring-slate-200
                      hover:bg-slate-200 transition
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    >
                      <Plus size={16} />
                      <span className="text-sm hidden sm:inline">Nuevo</span>
                    </button>
                  </>
                )}

                {isEditing && liquidacionId && (
                  <button
                    type="button"
                    onClick={openDeleteDialog}
                    disabled={isSaving}
                    className="
                    inline-flex items-center gap-1
                    rounded-lg bg-red-600 px-3 py-2
                    text-white ring-1 ring-red-600/30
                    hover:bg-red-500 transition
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  >
                    <Trash size={16} />
                    <span className="text-sm hidden sm:inline">Eliminar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (watch("estado") === "ANULADO") {
                      showToast({
                        title: "Imprimir",
                        description:
                          "Esta liquidación está anulada, por favor modificar y volver a imprimir.",
                        type: "error",
                      });
                      return;
                    }
                    handlePrint();
                  }}
                  disabled={isEditing && (fieldsetDisabled || !liquidacionId)}
                  className="
                    inline-flex items-center gap-1
                    rounded-lg bg-white px-3 py-2
                    text-slate-700 ring-1 ring-slate-200
                    hover:bg-slate-50 transition
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <Printer size={16} />
                  <span className="text-sm hidden sm:inline">Imprimir</span>
                </button>

                {liquidacionId && !isEditing && (
                  <button
                    type="button"
                    onClick={handleUnlockEditing}
                    title="Desbloquear edición"
                    className="
                              inline-flex items-center gap-1
                              rounded-lg bg-white px-3 py-2
                              text-slate-700 ring-1 ring-slate-200
                              hover:bg-slate-50 transition
                            "
                  >
                    <Lock size={16} />
                  </button>
                )}
              </div>
            </div>

            <fieldset disabled={fieldsetDisabled} className="contents">
              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                  <div className="lg:col-span-4 space-y-3">
                    <div className="space-y-3">
                      <CanalVentaComponent
                        control={control}
                        setValue={setValue}
                        watch={watch}
                      />
                      <Divider />
                      <PaxDetailComponent
                        control={control}
                        setValue={setValue}
                      />
                      <Divider />
                      <ViajeDetalleComponent
                        control={control}
                        setValue={setValue}
                        watch={watch}
                        getValues={getValues}
                        hydratedRef={hydratedRef}
                      />
                    </div>
                  </div>
                  <PaimentDetailComponent
                    control={control}
                    setValue={setValue}
                    watch={watch}
                  />
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-liquidacion-title"
        aria-describedby="delete-liquidacion-description"
      >
        <DialogTitle id="delete-liquidacion-title">
          ¿Eliminar liquidación?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-liquidacion-description">
            Esta acción no se puede deshacer. ¿Estás seguro de eliminar esta
            liquidación?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={isSaving}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ViajeForm;
