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
import { useEffect, useState } from "react";
import CanalVentaComponent from "./components/canalVentaComponent";
import PaxDetailComponent from "./components/paxDetailComponent";
import ViajeDetalleComponent from "./components/viajeDetalleComponent";
import PaimentDetailComponent from "./components/paimentDetailComponent";
import { useNavigate, useParams } from "react-router";
import { usePackageStore } from "../store/fulldayStore";
import axios from "axios";
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
  return v === null || v === undefined || v === "" ? "-" : String(v);
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

  if (!values.puntoPartida?.trim()) {
    return {
      message: "SELECCIONE EL PUNTO DE PARTIDA DE VIAJE",
      focus: "puntoPartida",
    };
  }

  if (!values.detalle?.tarifa?.servicio?.value) {
    return {
      message: "SELECCIONE SI INCLUYE ALMUERZO EL TOURS",
      focus: "detalle.tarifa.servicio",
    };
  }

  const puntoSelected = String(values.puntoPartida ?? "")
    .trim()
    .toUpperCase();
  const requiereTrasladoEdit =
    puntoSelected === "HOTEL" || puntoSelected === "OTROS";
  if (requiereTrasladoEdit) {
    const trasladoField = values.detalle?.traslado;
    const trasladoValue = trasladoField?.servicio?.value;
    if (!trasladoValue || trasladoValue === "-") {
      return {
        message: "SELECCIONE TRASLADO VALIDO CUANDO INCLUYE HOTEL U OTROS",
        focus: "detalle.traslado.servicio",
      };
    }
  }

  if (!values.detalle?.traslado?.servicio?.value) {
    return {
      message: "SELECCIONE SI INCLUYE TRASLADO",
      focus: "detalle.traslado.servicio",
    };
  }

  if (!values.medioPago) {
    console.log("values.medioPago", values.medioPago);
    return { message: "SELECCIONE EL MEDIO DE PAGO", focus: "medioPago" };
  }

  if (condicionValue !== "CREDITO" && values.medioPago === "-") {
    console.log("values.medioPago", values.medioPago, condicionValue);
    return { message: "SELECCIONE EL MEDIO DE PAGO", focus: "medioPago" };
  }

  const medioPagoValue = String(values.medioPago ?? "")
    .trim()
    .toUpperCase();
  if (
    (medioPagoValue === "DEPOSITO" || medioPagoValue === "YAPE") &&
    !values.nroOperacion?.trim()
  ) {
    return {
      message: "DEPOSITO o YAPE requieren numero de operacion",
      focus: "nroOperacion",
    };
  }

  if (!values.entidadBancaria) {
    return {
      message: "SELECCIONE LA ENTIDAD BANCARIA",
      focus: "entidadBancaria",
    };
  }

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

  if (!values.horaPartida?.trim()) {
    return {
      message: "INGRESE LA HORA DE PARTIDA DEL TOURS",
      focus: "horaPartida",
    };
  }

  const totalToPay = Number(values.precioTotal ?? 0);
  if (totalToPay <= 0) {
    return {
      message: "EL DOCUMENTO NO PUEDE SER CERO EN TOTAL A PAGAR...!!!",
    };
  }

  const saldo = Number(values.saldo ?? 0);
  if (saldo < 0) {
    return {
      message: "EL SALDO NO PUEDE SER NEGATIVO",
      focus: "saldo",
    };
  }

  const primeraActividad = getDetailField(values, "act1");
  const primeraActividadTieneDetalle =
    primeraActividad.detalleId !== undefined &&
    primeraActividad.detalleId !== null &&
    String(primeraActividad.detalleId).trim() !== "";
  if (
    primeraActividad.servicio?.value &&
    !primeraActividadTieneDetalle &&
    Number(primeraActividad.precio) <= 0 &&
    !isIslasBallestasActivity(primeraActividad.servicio)
  ) {
    return {
      message: "SI SELECCIONO UNA PRIMERA ACTIVIDAD INGRESE EL PRECIO",
      focus: "detalle.act1.precio",
    };
  }

  const segundaActividad = getDetailField(values, "act2");
  const segundaActividadTieneDetalle =
    segundaActividad.detalleId !== undefined &&
    segundaActividad.detalleId !== null &&
    String(segundaActividad.detalleId).trim() !== "";
  if (
    segundaActividad.servicio?.value &&
    !segundaActividadTieneDetalle &&
    Number(segundaActividad.precio) <= 0 &&
    !isIslasBallestasActivity(segundaActividad.servicio)
  ) {
    return {
      message: "SI SELECCIONO UNA SEGUNDA ACTIVIDAD INGRESE EL PRECIO",
      focus: "detalle.act2.precio",
    };
  }

  const traslado = getDetailField(values, "traslado");
  /*if (
    traslado.servicio?.value &&
    traslado.servicio?.value !== "-" &&
    Number(traslado.precio) <= 0
  ) {
    return {
      message: "SI SELECCIONO QUE INCLUYE TRASLADO...INGRESE EL PRECIO",
      focus: "detalle.traslado.precio",
    };
  }*/

  if (condicionValue.includes("ACUENTA")) {
    if (!values.acuenta && values.acuenta !== 0) {
      return {
        message:
          "SI SELECCIONO LA CONDICION ACUENTA, INGRESAR EL MONTO QUE LE DIO...!!!",
        focus: "acuenta",
      };
    }

    if (Number(values.acuenta) <= 0) {
      return {
        message:
          "SI SELECCIONO LA CONDICION ACUENTA, EL MONTO NO PUEDE SER CERO...!!!",
        focus: "acuenta",
      };
    }

    const totalBase = Number(values.precioTotal ?? totalToPay ?? 0);
    const sumaAcuenta = Number(values.acuenta ?? 0);
    const sumaEfectivo = Number(values.efectivo ?? 0);
    /* if (totalBase > 0 && sumaAcuenta + sumaEfectivo > totalBase) {
      return {
        message:
          "LA SUMA DEL ACUENTA CON EL EFECTIVO SUPERA AL MONTO TOTAL DE PAGO..!!!",
        focus: "acuenta",
      };
    }*/
  }

  /*if (values.horaPartida && !TIME_PATTERN.test(values.horaPartida)) {
    return {
      message: "INGRESE CORRECTAMENTE LA HORA",
      focus: "horaPartida",
    };
  }*/

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
      return [label, d(i?.precio), Number(i?.cant), d(i?.total)].join("|");
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
      return {
        servicioLabel: resolvedServicioLabel,
        cant: Number(i?.cant),
        precio: i?.precio,
        total: i?.total,
        detalleId,
      };
    })
    .filter(
      (item) =>
        item.detalleId !== undefined &&
        item.detalleId !== null &&
        item.servicioLabel &&
        (item.cant > 0 ||
          ["-", "N/A"].includes(item.servicioLabel.trim().toUpperCase())),
    )
    .map((item) =>
      [
        item.detalleId ?? "", // 👈 SOLO EN EDIT
        item.servicioLabel,
        d(item.precio),
        item.cant,
        d(item.total),
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
    n(data.documentoCobranza),
    n(data.nombreCompleto),
    n(data.documentoNumero),
    n(data.clienteId ?? 0),
    n(data.counter),
    n(data.medioPago),
    n(data.condicion?.value),
    n(data.celular),
    d(data.totalGeneral),
    d(data.precioTotal),
    d(data.acuenta),
    d(data.saldo),
    d(data.precioExtra),
    d(data.precioTotal),
    n(data.condicion?.value),
    data.companiaId,
    "NO",
    "-",
    "-",
    0,
    data.usuarioId,
    n(data.entidadBancaria),
    n(data.nroOperacion),
    d(data.efectivo),
    d(data.deposito),
    data.idProducto,
    n(data.canalVenta),
    n(data.canalDeVentaTelefono),
    data.cantPax,
    n(data.puntoPartida),
    n(data.horaPartida),
    n(data.otrosPartidas ?? ""),
    n(data.visitas),
    n(Number(data.precioExtraSoles ?? 0)),
    n(Number(data.precioExtraDolares ?? 0)),
    data.fechaAdelanto,
    n(data.mensajePasajero ?? ""),
    n(data.observaciones ?? ""),
    islas,
    tubulares,
    otros,
    data.fechaViaje,
    0,
    "NO",
    data.moneda,
    n(data.detalle.tarifa.servicio.label ?? ""),
    "-",
    n(data?.hotel?.label ?? ""),
    data.region,
  ].join("|");

  return `${orden}[${detalle}`;
}

function buildListaOrdenEdit(data) {
  const detalle = normalizarDetalleEdit(data.detalle);
  const { islas, tubulares, otros } = resolveActividadesEspeciales(
    data.detalle,
    data.idProducto,
  );
  const orden = [
    n(data.documentoCobranza), // 1
    Number(data.clienteId), // 2
    n(data.counter), // 3
    n(data.medioPago), // 4
    n(data.condicion?.value), // 5
    n(data.celular), // 6
    d(data.totalGeneral), // 7
    d(data.precioTotal), // 8
    d(data.acuenta), // 9
    d(data.saldo), // 10
    d(data.precioExtra), // 11
    d(data.precioTotal), // 12
    n(data.condicion?.value), // 13
    Number(data.companiaId), // 14
    "NO", // 15 IncluyeIGV
    n(data.nserie), // 16
    n(data.ndocumento), // 17
    0, // 18 NotaGanancia
    Number(data.usuarioId), // 19
    n(data.entidadBancaria), // 20
    n(data.nroOperacion), // 21
    d(data.efectivo), // 22
    d(data.deposito), // 23
    Number(data.idProducto), // 24
    n(data.canalVenta), // 25
    n(data.canalDeVentaTelefono), // 26
    Number(data.cantPax), // 27
    n(data.puntoPartida), // 28
    n(data.horaPartida), // 29
    n(data.otrosPartidas ?? ""), // 30 otrasPartidas
    n(data.visitas), // 31
    n(Number(data.precioExtraSoles ?? 0)), // 32
    n(Number(data.precioExtraDolares ?? 0)), // 33
    n(toISODate(data.fechaEmision)), // 34
    n(data.mensajePasajero ?? ""), // 35
    n(data.observaciones ?? ""), // 36
    islas, // 37
    tubulares, // 38
    otros, // 39
    n(toISODate(data.fechaViaje)), // 40
    0, // 41
    "NO", // 42
    Number(data.notaId), // 43 🔴 OBLIGATORIO
    0, // 44 Aviso
    n(data.moneda), // 45
    n(data.detalle.tarifa.servicio.label ?? ""), // 46
    "-", // 47
    n(data?.hotel?.label ?? ""), // 48
    n(data.region), // 49
  ].join("|");

  return `${orden}[${detalle}`;
}

async function agregarViaje(valores, edit) {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/v1/Programacion/${!edit ? "agregar-viaje" : "editar-viaje"}`,
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

  const actividadesKeys = ["act1", "act2", "act3"];

  const actividades = actividadesKeys.map((key, idx) => {
    const act = viajeJson.detalle?.[key];

    const servicioLabel =
      act?.servicio && typeof act.servicio === "object" && act.servicio.label
        ? act.servicio.label
        : "";

    return {
      label: `Actividad ${idx + 1}`,
      actividad: servicioLabel,
      cantidad: act && Number(act.cant) > 0 ? Number(act.cant) : null,
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
    mensajePasajero: viajeJson.mensajePasajero ?? "",
    precioTotal: viajeJson.precioTotal,
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
  //Precargar los valores en modo edicion

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
      fechaEmision: "",
      cantPax: 0,
      canalVenta: null,
      documentoCobranza: "DOCUMENTO COBRANZA",
      disponibles: 0,
      region: "",
      counter: "",
      moneda: "SOLES",
      canalDeVentaTelefono: "",
      fechaAdelanto: parseDateForInput(Date()),
      saldo: "0",
      medioPago: "",
      detalle: {
        tarifa: { servicio: null, precio: 0, cant: 1, total: 0 },
        act1: { servicio: null, precio: 0, cant: 0, total: 0 },
        act2: { servicio: null, precio: 0, cant: 0, total: 0 },
        act3: { servicio: null, precio: 0, cant: 0, total: 0 },
        traslado: { servicio: null, precio: 0, cant: 0, total: 0 },
        entrada: { servicio: null, precio: 0, cant: 0, total: 0 },
      },
      totalGeneral: 0,
    },
  });
  console.log("watch", watch());
  useEffect(() => {
    return () => {
      setFormData(null);
    };
  }, []);
  useEffect(() => {
    if (!formData) return;

    reset({
      ...formData,

      // 🛡️ defaults defensivos
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
  }, [formData, reset]);
  const navigate = useNavigate();
  //sesion
  const sessionRaw = localStorage.getItem("picaflor.auth.session");

  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const { idProduct, liquidacionId } = useParams();
  const { packages, date, loadPackages } = usePackageStore();

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
    setValue("fechaViaje", selectedPackage.fecha, {
      shouldDirty: true,
    });
    setValue("region", selectedPackage.region, {
      shouldDirty: true,
    });
    setValue("counter", session.user.displayName);
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
        _editMode: data._editMode === true,
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

      const pdfData = adaptViajeJsonToInvoice(payload, result);
      const backendPayload = payload._editMode
        ? `${liquidacionId}¬¬¬${formatDate(payload.fechaAdelanto) ?? ""}`
        : result;

      localStorage.setItem("invoiceData", JSON.stringify(pdfData));
      localStorage.setItem("invoiceBackend", result);
      navigate(`/fullday/${idProduct}/passengers/preview`, {
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
    navigate(`/fullday`);
  };

  const handlePrint = () => {
    try {
      const formValues = getValues();
      const invoiceData = adaptViajeJsonToInvoice(
        { ...formValues, fechaAdelanto: watch("fechaAdelanto") },
        true,
      );
      const backendPayload = liquidacionId ?? formValues.nserie ?? "";
      console.log("invoiceData", invoiceData, backendPayload);
      navigate(`/fullday/${idProduct}/passengers/preview`, {
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
        `http://localhost:5000/api/v1/Nota/${liquidacionId}`,
      );

      const deleted = response?.data === true || response?.data === "true";

      if (deleted) {
        showToast({
          title: "Eliminado",
          description: "La liquidación se eliminó correctamente.",
          type: "success",
        });
        navigate("/fullday/programacion/liquidaciones", {
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ChevronLeft
            className="cursor-pointer"
            onClick={() => {
              navigate("/fullday");
            }}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <form
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={handleEnterFocus}
            noValidate
          >
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 shadow-sm">
              {/* ================= INFO ================= */}
              <div className="flex items-center gap-4 min-w-0">
                {/* DESTINO */}
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-slate-500 text-xs">Destino:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[460px]">
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
              <div className="flex items-center gap-2 shrink-0">
                {isEditing && (
                  <>
                    <button
                      type="submit"
                      title={saveButtonLabel}
                      disabled={fieldsetDisabled}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-white shadow-sm ring-1 ring-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
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
                      title="Nuevo"
                      disabled={fieldsetDisabled}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 text-white px-3 py-2 ring-1 ring-slate-200 hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash size={16} />
                    <span className="text-sm hidden sm:inline">Eliminar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrint}
                  title="Imprimir"
                  disabled={isEditing && (fieldsetDisabled || !liquidacionId)}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer size={16} />
                  <span className="text-sm hidden sm:inline">Imprimir</span>
                </button>
                {liquidacionId && !isEditing && (
                  <div>
                    <button
                      type="button"
                      onClick={handleUnlockEditing}
                      title="Desbloquear edición"
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock size={16} />
                    </button>
                  </div>
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
