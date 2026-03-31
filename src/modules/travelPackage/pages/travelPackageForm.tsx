import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useDialogStore } from "@/app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { useModulePermissionsStore } from "@/store/permissions/modulePermissions.store";
import { useTravelPackageForm } from "../hooks/useTravelPackageForm";
import AgencySection from "../components/AgencySection";
import GeneralDataSection from "../components/GeneralDataSection";
import ItinerarySection from "../components/ItinerarySection";
import PassengersSection from "../components/PassengersSection";
import ServiciosContratadosSection from "../components/ServiciosContratadosSection";
import LiquidationSection from "../components/LiquidationSection";
import {
  CheckCircle,
  ChevronLeft,
  FileText,
  Loader2,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Trash,
} from "lucide-react";
import { getFocusableElements } from "@/shared/helpers/formFocus";
import { buildTravelPackageLegacyPayload } from "../utils/legacyPayloadBuilder";
import {
  agregarPaqueteViaje,
  actualizarPaqueteViaje,
  eliminarPaqueteViaje,
  actualizarVerificadoPaqueteViaje,
  obtenerPaqueteViaje,
} from "../api/travelPackageApi";
import { parseTravelPackageLegacyPayload } from "../utils/legacyPayloadParser";
import { showToast } from "@/components/ui/AppToast";
import {
  createEmptyPassenger,
  DOCUMENTO_COBRANZA_OPTIONS,
  getTodayIso,
  INITIAL_FORM_STATE,
} from "../constants/travelPackage.constants";
import type { PackageInvoiceData } from "@/components/invoice/PackageInvoice";
import type { TravelPackageFormState } from "../types/travelPackage.types";

const PACKAGE_INVOICE_STORAGE_KEY = "travel-package:invoice-preview:data:v1";
const LIQUIDACIONES_STALE_STORAGE_KEY =
  "fullday:programacion-liquidaciones:stale:v1";

const markLiquidacionesAsStale = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(LIQUIDACIONES_STALE_STORAGE_KEY, "1");
  } catch {
    // ignorar errores de almacenamiento para no afectar el flujo
  }
};

const parsePositiveId = (value: unknown): number | null => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
};

const resolveSavedPackageId = (response: unknown): number | null => {
  if (response === null || response === undefined) return null;

  if (typeof response === "number") return parsePositiveId(response);

  if (typeof response === "string") {
    const trimmed = response.trim();
    if (!trimmed) return null;
    const directNumber = parsePositiveId(trimmed);
    if (directNumber) return directNumber;
    const firstToken = trimmed.split("¬")[0]?.split("|")[0]?.trim() ?? "";
    const tokenNumber = parsePositiveId(firstToken);
    if (tokenNumber) return tokenNumber;
    try {
      return resolveSavedPackageId(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (Array.isArray(response)) {
    for (const item of response) {
      const candidate = resolveSavedPackageId(item);
      if (candidate) return candidate;
    }
    return null;
  }

  if (typeof response === "object") {
    const record = response as Record<string, unknown>;
    return (
      parsePositiveId(record.IdPaqueteViaje) ??
      parsePositiveId(record.idPaqueteViaje) ??
      parsePositiveId(record.Id) ??
      parsePositiveId(record.id)
    );
  }

  return null;
};

type SavedPackageResponseMeta = {
  id: number | null;
  nserie?: string;
  ndocumento?: string;
};

const resolveSavedPackageResponseMeta = (
  response: unknown,
): SavedPackageResponseMeta => {
  const clean = (value: unknown) => String(value ?? "").trim();

  if (response === null || response === undefined) {
    return { id: null };
  }

  if (typeof response === "number") {
    return { id: parsePositiveId(response) };
  }

  if (typeof response === "string") {
    const trimmed = clean(response);
    if (!trimmed) return { id: null };

    const [idToken = "", serieToken = "", documentoToken = ""] = trimmed
      .split("¬")
      .map((item) => clean(item));
    const idFromToken = parsePositiveId(idToken);
    if (idFromToken || serieToken || documentoToken) {
      return {
        id: idFromToken,
        nserie: serieToken || undefined,
        ndocumento: documentoToken || undefined,
      };
    }

    try {
      return resolveSavedPackageResponseMeta(JSON.parse(trimmed));
    } catch {
      return { id: null };
    }
  }

  if (Array.isArray(response)) {
    for (const item of response) {
      const candidate = resolveSavedPackageResponseMeta(item);
      if (candidate.id || candidate.nserie || candidate.ndocumento) {
        return candidate;
      }
    }
    return { id: null };
  }

  if (typeof response === "object") {
    const record = response as Record<string, unknown>;
    const nested = resolveSavedPackageResponseMeta(
      record.Resultado ?? record.resultado ?? record.Mensaje ?? record.mensaje,
    );
    return {
      id:
        parsePositiveId(record.IdPaqueteViaje) ??
        parsePositiveId(record.idPaqueteViaje) ??
        parsePositiveId(record.Id) ??
        parsePositiveId(record.id) ??
        nested.id,
      nserie:
        clean(record.NSerie ?? record.nserie) || nested.nserie || undefined,
      ndocumento:
        clean(record.NDocumento ?? record.ndocumento) ||
        nested.ndocumento ||
        undefined,
    };
  }

  return { id: null };
};

type TravelPackageValidationError = {
  message: string;
  focusSelector?: string;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SERIE_PATTERN = /^[A-Z0-9]{4}$/;
const CONDICION_PAGO_ALLOWED = new Set(["CANCELADO", "ACUENTA", "CREDITO"]);
const MONEDA_ALLOWED = new Set(["SOLES", "DOLARES"]);
const MEDIOS_PAGO_BANCARIOS = new Set(["DEPOSITO", "YAPE", "TARJETA"]);

const normalizeText = (value: unknown) => String(value ?? "").trim();
const normalizeLegacyToken = (value: unknown) =>
  normalizeText(value)
    .replace(/\r?\n/g, " ")
    .replace(/[|;[\]]/g, " ");
const normalizeUpperText = (value: unknown) =>
  normalizeText(value).toUpperCase();
const normalizeComparableText = (value: unknown) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
const parseSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const toNonNegativeInt = (value: unknown) =>
  Math.max(0, Math.floor(parseSafeNumber(value)));
const normalizePassengersForSubmit = (
  form: TravelPackageFormState,
): TravelPackageFormState => {
  const cantPax = toNonNegativeInt(form.cantPax);
  const pasajeros = Array.isArray(form.pasajeros) ? form.pasajeros : [];

  return {
    ...form,
    cantPax: String(cantPax),
    pasajeros: pasajeros.slice(0, cantPax),
  };
};
const isValidIsoDate = (value: string) => {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
};
const pad2 = (value: number) => String(value).padStart(2, "0");
const buildFechaRegistroDateTime = (fechaBase: string) => {
  const now = new Date();
  const fecha = isValidIsoDate(fechaBase) ? fechaBase : getTodayIso();
  return `${fecha} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
};
const isActiveItineraryActivity = (
  row: TravelPackageFormState["itinerario"][number]["actividades"][number],
) => {
  const detail = normalizeUpperText(row?.detalle);
  if (row?.tipo === "ENTRADA") {
    return detail !== "" && detail !== "N/A";
  }
  return detail !== "" && detail !== "-";
};
const getItineraryRowLabel = (
  tipo: TravelPackageFormState["itinerario"][number]["actividades"][number]["tipo"],
) => {
  if (tipo === "ACT1") return "ACTIVIDAD 1";
  if (tipo === "ACT2") return "ACTIVIDAD 2";
  if (tipo === "ACT3") return "ACTIVIDAD 3";
  if (tipo === "TRASLADO") return "TRASLADO";
  return "ENTRADA";
};

const focusBySelector = (selector?: string) => {
  if (!selector || typeof document === "undefined") return;
  setTimeout(() => {
    const target = document.querySelector<HTMLElement>(selector);
    target?.focus();
  }, 0);
};

const validateTravelPackageForm = (
  form: TravelPackageFormState,
): TravelPackageValidationError | null => {
  const destinos = (form.destinos ?? []).map(normalizeText).filter(Boolean);
  if (!destinos.length) {
    return {
      message: "SELECCIONE AL MENOS UN DESTINO.",
      focusSelector: 'input[name^="nh-destinos-"]',
    };
  }

  const fechaInicio = normalizeText(form.fechaInicioViaje);
  const fechaFin = normalizeText(form.fechaFinViaje);
  if (!fechaInicio || !fechaFin) {
    return { message: "SELECCIONE FECHA DE INICIO Y FECHA DE FIN DEL VIAJE." };
  }

  if (!isValidIsoDate(fechaInicio) || !isValidIsoDate(fechaFin)) {
    return { message: "LAS FECHAS DEL VIAJE NO TIENEN FORMATO VÁLIDO." };
  }

  if (fechaInicio > fechaFin) {
    return {
      message: "LA FECHA DE INICIO NO PUEDE SER MAYOR QUE LA FECHA DE FIN.",
    };
  }

  if (!normalizeText(form.programa)) {
    return {
      message: "INGRESE EL PROGRAMA DEL PAQUETE.",
      focusSelector: 'input[name^="nh-programa-"]',
    };
  }

  const cantPax = toNonNegativeInt(form.cantPax);
  if (!cantPax) {
    return {
      message: "INGRESE LA CANTIDAD DE PASAJEROS.",
      focusSelector: 'input[name^="nh-cantpax-"]',
    };
  }

  const condicionPago = normalizeUpperText(form.condicionPago);
  if (!CONDICION_PAGO_ALLOWED.has(condicionPago)) {
    return {
      message: "SELECCIONE UNA CONDICIÓN DE PAGO VÁLIDA.",
      focusSelector: '[name="condicionPago"]',
    };
  }

  const moneda = normalizeUpperText(form.moneda);
  if (!MONEDA_ALLOWED.has(moneda)) {
    return { message: "SELECCIONE UNA MONEDA VÁLIDA." };
  }

  const agenciaValue = normalizeText(form.agencia?.value);
  const agenciaLabel = normalizeText(form.agencia?.label);
  if (!agenciaValue && !agenciaLabel) {
    return {
      message: "SELECCIONE EL CANAL / AGENCIA.",
      focusSelector: 'input[name^="nh-canaldeventa-"]',
    };
  }

  if (!normalizeText(form.contacto)) {
    return {
      message: "INGRESE EL CONTACTO DE LA AGENCIA.",
      focusSelector: 'input[name^="nh-contacto-"]',
    };
  }

  if (!normalizeText(form.telefono)) {
    return {
      message: "INGRESE EL TELÉFONO DE CONTACTO.",
      focusSelector: 'input[name^="nh-telefono-"]',
    };
  }

  const email = normalizeText(form.email);
  const shouldValidateEmail = email !== "" && email !== "-";
  if (shouldValidateEmail && !EMAIL_PATTERN.test(email)) {
    return {
      message: "INGRESE UN EMAIL VÁLIDO.",
      focusSelector: 'input[name^="nh-email-"]',
    };
  }

  if (!normalizeText(form.counter)) {
    return { message: "NO SE PUDO RESOLVER EL COUNTER DE LA SESIÓN." };
  }

  const documentoCobranza = normalizeUpperText(form.documentoCobranza);
  const nserie = normalizeUpperText(form.nserie).replace(/[^A-Z0-9]/g, "");
  const ndocumento = normalizeText(form.ndocumento).replace(/\D/g, "");
  if (documentoCobranza !== "DOCUMENTO COBRANZA") {
    if (!SERIE_PATTERN.test(nserie)) {
      return {
        message: "LA SERIE DEBE TENER 4 CARACTERES ALFANUMÉRICOS (EJ: B001).",
        focusSelector: 'input[name="nserie"]',
      };
    }
    if (!ndocumento) {
      return {
        message: "INGRESE EL NÚMERO DE DOCUMENTO.",
        focusSelector: 'input[name="ndocumento"]',
      };
    }
  }

  const movilidadTipo = normalizeUpperText(form.movilidadTipo);
  const movilidadEmpresa = normalizeText(form.movilidadEmpresa);
  const movilidadPrecio = parseSafeNumber(form.movilidadPrecio);
  const isMovilidadPrivada = movilidadTipo === "MOVILIDAD PRIVADA";
  if (!movilidadTipo) {
    return {
      message: "SELECCIONE EL TIPO DE MOVILIDAD.",
      focusSelector: '[name="movilidadTipo"]',
    };
  }
  if (movilidadTipo !== "NO INCLUYE") {
    if (isMovilidadPrivada) {
      if (movilidadEmpresa !== "-") {
        return {
          message:
            "SI SELECCIONA MOVILIDAD PRIVADA, LA EMPRESA DEBE SER '-'.",
          focusSelector: '[name="movilidadEmpresa"]',
        };
      }
    } else if (!movilidadEmpresa || movilidadEmpresa === "-") {
      return {
        message:
          movilidadTipo === "BUS"
            ? "SI SELECCIONA MOVILIDAD COMPARTIDO, DEBE ELEGIR UNA EMPRESA."
            : "DEBE SELECCIONAR LA EMPRESA DE MOVILIDAD.",
        focusSelector: '[name="movilidadEmpresa"]',
      };
    }

    if (movilidadPrecio < 0) {
      return {
        message:
          movilidadTipo === "BUS"
            ? "SI SELECCIONA MOVILIDAD COMPARTIDO, EL PRECIO NO PUEDE SER NEGATIVO."
            : "EL PRECIO DE MOVILIDAD NO PUEDE SER NEGATIVO.",
        focusSelector: 'input[name^="nh-movilidadprecio-"]',
      };
    }
  }

  const paquetesViaje = Array.isArray(form.paquetesViaje)
    ? form.paquetesViaje
    : [];
  const hasHotelPackage = paquetesViaje.some(
    (item) => !normalizeComparableText(item.paquete).includes("SIN HOTEL"),
  );
  const onlySinHotelPackageSelected =
    paquetesViaje.length > 0 &&
    paquetesViaje.every((item) =>
      normalizeComparableText(item.paquete).includes("SIN HOTEL"),
    );
  const incluyeHotelSeleccion = normalizeUpperText(form.incluyeHotelSeleccion);
  const incluyeAlimentacionEstadoSeleccion = normalizeUpperText(
    form.incluyeAlimentacionEstadoSeleccion,
  );

  if (
    !hasHotelPackage &&
    !onlySinHotelPackageSelected &&
    incluyeHotelSeleccion !== "SI" &&
    incluyeHotelSeleccion !== "NO"
  ) {
    return {
      message: "SELECCIONE SI EL PAQUETE INCLUYE HOTEL.",
      focusSelector: '[name="incluyeHotel"]',
    };
  }

  if (
    incluyeAlimentacionEstadoSeleccion !== "SI" &&
    incluyeAlimentacionEstadoSeleccion !== "NO"
  ) {
    return {
      message: "SELECCIONE SI INCLUYE ALIMENTACIÓN.",
      focusSelector: '[name="incluyeAlimentacionEstado"]',
    };
  }

  const pasajeros = Array.isArray(form.pasajeros) ? form.pasajeros : [];
  if (!pasajeros.length) {
    return { message: "DEBE REGISTRAR AL MENOS UN PASAJERO." };
  }

  const missingNombreIndex = pasajeros.findIndex(
    (passenger) => !normalizeText(passenger.nombres),
  );
  if (missingNombreIndex >= 0) {
    return {
      message: `INGRESE LOS NOMBRES DEL PASAJERO #${missingNombreIndex + 1}.`,
      focusSelector: `input[data-nav-col="nombres"][data-nav-row="${String(missingNombreIndex)}"]`,
    };
  }

  const missingNacionalidadIndex = pasajeros.findIndex(
    (passenger) => !normalizeText(passenger.nacionalidad),
  );
  if (missingNacionalidadIndex >= 0) {
    const passenger = pasajeros[missingNacionalidadIndex];
    return {
      message: `INGRESE LA NACIONALIDAD DEL PASAJERO #${missingNacionalidadIndex + 1}.`,
      focusSelector: passenger?.id
        ? `#nacionalidad-${String(passenger.id)}`
        : undefined,
    };
  }

  const invalidPassengerPriceIndex = pasajeros.findIndex((passenger) => {
    const passengerType = normalizeUpperText(passenger.tipoPasajero);
    if (passengerType === "LIBERADO") return false;
    const totalTipo = parseSafeNumber(passenger.totalTipoPasajero);
    return totalTipo <= 0;
  });
  if (invalidPassengerPriceIndex >= 0) {
    const passenger = pasajeros[invalidPassengerPriceIndex];
    return {
      message: `EL TOTAL TIPO DEL PASAJERO #${invalidPassengerPriceIndex + 1} DEBE SER MAYOR A 0 (EXCEPTO LIBERADO).`,
      focusSelector: passenger?.id
        ? `#total-tipo-${String(passenger.id)}`
        : undefined,
    };
  }

  if (form.incluyeHotel) {
    const hoteles = Array.isArray(form.hotelesContratados)
      ? form.hotelesContratados
      : [];
    if (!hoteles.length) {
      return { message: "DEBE REGISTRAR LOS HOTELES DEL PAQUETE." };
    }

    const missingRegionIndex = hoteles.findIndex(
      (hotel) => !normalizeText(hotel.region),
    );
    if (missingRegionIndex >= 0) {
      return {
        message: `SELECCIONE LA REGIÓN DEL HOTEL #${missingRegionIndex + 1}.`,
      };
    }

    const missingHotelIndex = hoteles.findIndex(
      (hotel) => !normalizeText(hotel.hotel),
    );
    if (missingHotelIndex >= 0) {
      return {
        message: `SELECCIONE EL NOMBRE DEL HOTEL #${missingHotelIndex + 1}.`,
      };
    }

    const missingRoomIndex = hoteles.findIndex((hotel) =>
      (hotel.habitaciones ?? []).every(
        (room) =>
          !normalizeText(room.tipo) ||
          Math.max(0, parseSafeNumber(room.cantidad)) <= 0,
      ),
    );
    if (missingRoomIndex >= 0) {
      return {
        message: `INGRESE AL MENOS UNA HABITACIÓN CON CANTIDAD MAYOR A 0 EN EL HOTEL #${missingRoomIndex + 1}.`,
      };
    }

    const missingAlimentacionTipoIndex = hoteles.findIndex(
      (hotel) =>
        hotel.incluyeAlimentacion &&
        (!normalizeText(hotel.alimentacionTipo) ||
          normalizeUpperText(hotel.alimentacionTipo) === "-"),
    );
    if (missingAlimentacionTipoIndex >= 0) {
      return {
        message: `SELECCIONE EL TIPO DE ALIMENTACIÓN DEL HOTEL #${missingAlimentacionTipoIndex + 1}.`,
      };
    }
  }

  const itinerario = Array.isArray(form.itinerario) ? form.itinerario : [];
  if (!itinerario.length) {
    return { message: "DEBE REGISTRAR EL ITINERARIO DEL PAQUETE." };
  }

  const missingDayDateIndex = itinerario.findIndex(
    (day) => !normalizeText(day.fecha),
  );
  if (missingDayDateIndex >= 0) {
    return {
      message: `INGRESE LA FECHA DEL DÍA #${missingDayDateIndex + 1} EN EL ITINERARIO.`,
    };
  }

  const invalidDayDateIndex = itinerario.findIndex(
    (day) => !isValidIsoDate(normalizeText(day.fecha)),
  );
  if (invalidDayDateIndex >= 0) {
    return {
      message: `LA FECHA DEL DÍA #${invalidDayDateIndex + 1} DEL ITINERARIO NO ES VÁLIDA.`,
    };
  }

  const outOfRangeDayIndex = itinerario.findIndex((day) => {
    const dayDate = normalizeText(day.fecha);
    return dayDate < fechaInicio || dayDate > fechaFin;
  });
  if (outOfRangeDayIndex >= 0) {
    return {
      message: `LA FECHA DEL DÍA #${outOfRangeDayIndex + 1} DEBE ESTAR ENTRE LA FECHA INICIO Y FECHA FIN DEL VIAJE.`,
    };
  }

  const missingDayTitleIndex = itinerario.findIndex(
    (day) => !normalizeText(day.titulo),
  );
  if (missingDayTitleIndex >= 0) {
    return {
      message: `INGRESE EL PRODUCTO / ACTIVIDAD PRINCIPAL DEL DÍA #${missingDayTitleIndex + 1}.`,
    };
  }

  const missingObservationForSinActividadIndex = itinerario.findIndex((day) => {
    const title = normalizeUpperText(day.titulo);
    if (title !== "SIN ACTIVIDAD") return false;
    return !normalizeText(day.observacion);
  });
  if (missingObservationForSinActividadIndex >= 0) {
    const invalidDay = itinerario[missingObservationForSinActividadIndex];
    return {
      message: `SI EL DÍA #${missingObservationForSinActividadIndex + 1} ES "SIN ACTIVIDAD", LA OBSERVACIÓN ES OBLIGATORIA.`,
      focusSelector: invalidDay?.id
        ? `textarea[data-observation-day="${String(invalidDay.id)}"], input[data-observation-day="${String(invalidDay.id)}"]`
        : undefined,
    };
  }

  for (let dayIndex = 0; dayIndex < itinerario.length; dayIndex += 1) {
    const day = itinerario[dayIndex];
    const rows = Array.isArray(day?.actividades) ? day.actividades : [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const isActivityRow =
        row.tipo === "ACT1" || row.tipo === "ACT2" || row.tipo === "ACT3";
      if (!isActivityRow) continue;
      if (!isActiveItineraryActivity(row)) continue;

      const isBallestasActivity =
        normalizeComparableText(row.detalle) === "EXCURSION ISLAS BALLESTAS";
      if (isBallestasActivity) continue;

      if (parseSafeNumber(row.precio) < 0) {
        return {
          message: `EL ${getItineraryRowLabel(row.tipo)} DEL DÍA #${dayIndex + 1} NO PUEDE TENER PRECIO NEGATIVO.`,
          focusSelector:
            day?.id && row?.id
              ? `input[data-row-price-day="${String(day.id)}"][data-row-price-row="${String(row.id)}"]`
              : undefined,
        };
      }
    }
  }

  const medioPago = normalizeUpperText(form.medioPago);
  if (condicionPago !== "CREDITO") {
    if (!medioPago || medioPago === "-") {
      return {
        message: "SELECCIONE EL MEDIO DE PAGO.",
        focusSelector: '[name="medioPago"]',
      };
    }
  }

  if (MEDIOS_PAGO_BANCARIOS.has(medioPago)) {
    const entidadBancaria = normalizeUpperText(form.entidadBancaria);
    if (!entidadBancaria || entidadBancaria === "-") {
      return {
        message: "SELECCIONE LA ENTIDAD BANCARIA.",
        focusSelector: '[name="entidadBancaria"]',
      };
    }

    if (!normalizeText(form.nroOperacion)) {
      return {
        message:
          "SI EL MEDIO DE PAGO ES DEPÓSITO, YAPE O TARJETA, EL NRO DE OPERACIÓN ES OBLIGATORIO.",
        focusSelector: '[name="nroOperacion"]',
      };
    }
  }

  const totalGeneral = parseSafeNumber(form.totalGeneral);
  if (totalGeneral <= 0) {
    return {
      message: "EL TOTAL GENERAL NO PUEDE SER CERO.",
    };
  }

  const acuenta = parseSafeNumber(form.acuenta);
  if (condicionPago === "ACUENTA" && acuenta <= 0) {
    return {
      message:
        "SI LA CONDICIÓN ES ACUENTA, DEBE INGRESAR UN MONTO ACUENTA MAYOR A 0.",
      focusSelector: '[name="acuenta"]',
    };
  }

  if (acuenta > totalGeneral) {
    return {
      message: "EL MONTO ACUENTA NO PUEDE SER MAYOR AL TOTAL GENERAL.",
      focusSelector: '[name="acuenta"]',
    };
  }

  const saldo = parseSafeNumber(form.saldo);
  if (saldo < 0) {
    return {
      message: "EL SALDO NO PUEDE SER NEGATIVO.",
      focusSelector: '[name="saldo"]',
    };
  }

  return null;
};

const buildPackageInvoiceData = (
  form: TravelPackageFormState,
  packageId?: number | null,
): PackageInvoiceData => ({
  ...form,
  agencia: form.agencia ?? undefined,
  liquidacionNumero: packageId ? String(packageId) : undefined,
  notaId: form.notaId,
});

const buildTravelPackageBoletaData = (
  form: TravelPackageFormState,
  packageId?: number | null,
) => ({
  programa: normalizeText(form.programa),
  destino: normalizeText(form.destinos?.[0] ?? ""),
  fechaViaje: normalizeText(form.fechaInicioViaje),
  notaId: normalizeText(form.notaId) || (packageId ? String(packageId) : ""),
  documentoCobranza: normalizeText(form.documentoCobranza),
  nserie: normalizeText(form.nserie),
  ndocumento: normalizeText(form.ndocumento),
  nombreCompleto: normalizeText(form.contacto),
  direccion: normalizeText(form.agencia?.label ?? form.agencia?.value ?? "-"),
  celular: normalizeText(form.telefono),
  counter: normalizeText(form.counter),
  auxiliar: normalizeText(form.agencia?.label ?? form.agencia?.value ?? ""),
  moneda: normalizeText(form.moneda),
  cantPax: Number(form.cantPax || 0),
  precioTotal: Number(form.totalGeneral || 0),
  totalGeneral: Number(form.totalGeneral || 0),
  acuenta: Number(form.acuenta || 0),
  saldo: Number(form.saldo || 0),
  fechaEmision: normalizeText(form.fechaEmision),
  medioPago: normalizeText(form.medioPago),
});

type TravelPackageRouteState = {
  fromLiquidaciones?: unknown;
  notaId?: unknown;
  listItem?: unknown;
};

const resolveRouteNotaId = (routeState: TravelPackageRouteState | null) => {
  const fromState = parsePositiveId(routeState?.notaId);
  if (fromState) return String(fromState);

  if (routeState?.listItem && typeof routeState.listItem === "object") {
    const listItem = routeState.listItem as Record<string, unknown>;
    const fromListItem =
      parsePositiveId(listItem.notaId) ??
      parsePositiveId(listItem.NotaId) ??
      parsePositiveId(listItem.notaID);
    if (fromListItem) return String(fromListItem);
  }

  return "";
};

const TravelPackageForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const routeState =
    location.state && typeof location.state === "object"
      ? (location.state as TravelPackageRouteState)
      : null;
  const fromLiquidaciones = routeState?.fromLiquidaciones === true;
  const routeNotaId = resolveRouteNotaId(routeState);
  const isEditMode = Boolean(id);
  const openDialog = useDialogStore((state) => state.openDialog);
  const authUser = useAuthStore((state) => state.user);
  const canDeleteTravelPackage = useModulePermissionsStore((state) =>
    state.canAccessAction("paquete_viaje", "delete"),
  );
  const { form, handlers } = useTravelPackageForm();
  const { replaceForm } = handlers;
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isUpdatingVerificado, setIsUpdatingVerificado] = useState(false);
  const [isEditing, setIsEditing] = useState(!isEditMode);
  const isVerificado = form.flagVerificado === "1";
  const canToggleVerificado =
    String(authUser?.areaId ?? authUser?.area ?? "") === "6";
  const isFormLocked = isEditMode && !isEditing;
  const fieldsetDisabled =
    isSaving || isLoadingDetail || isUpdatingVerificado || isFormLocked;
  const fechaEmisionLabel = form.fechaEmision
    ? form.fechaEmision.split("-").reverse().join("/")
    : "-";

  useEffect(() => {
    setIsEditing(!isEditMode);
  }, [isEditMode, id]);

  useEffect(() => {
    if (!routeState?.listItem) return;
  }, [routeState?.listItem]);

  useEffect(() => {
    if (!isEditMode || !id) return;

    let isCancelled = false;

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await obtenerPaqueteViaje(String(id));
        const parsedForm = parseTravelPackageLegacyPayload(response);
        if (!parsedForm) {
          throw new Error(
            "No se encontro informacion para el paquete solicitado.",
          );
        }

        if (isCancelled) return;
        const parsedNotaId = parsePositiveId(parsedForm.notaId);
        replaceForm({
          ...parsedForm,
          notaId: parsedNotaId ? String(parsedNotaId) : routeNotaId,
        });
      } catch (error) {
        if (isCancelled) return;
        showToast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo obtener el detalle del paquete de viaje.",
          type: "error",
        });
        if (fromLiquidaciones) {
          navigate("/fullday/programacion/liquidaciones");
        } else {
          navigate("/paquete-viaje");
        }
      } finally {
        if (!isCancelled) setIsLoadingDetail(false);
      }
    };

    void loadDetail();

    return () => {
      isCancelled = true;
    };
  }, [fromLiquidaciones, id, isEditMode, navigate, replaceForm, routeNotaId]);

  const handleBackNavigation = useCallback(() => {
    if (fromLiquidaciones) {
      navigate("/fullday/programacion/liquidaciones");
      return;
    }
    navigate("/paquete-viaje");
  }, [fromLiquidaciones, navigate]);

  const focusSibling = useCallback(
    (target: HTMLElement, options?: { reverse?: boolean }) => {
      const scope = target.closest("form") ?? document;
      const focusables = getFocusableElements(scope);
      if (!focusables.length) return;
      const index = focusables.indexOf(target);
      if (index === -1) return;
      const nextIndex = options?.reverse ? index - 1 : index + 1;
      focusables[nextIndex]?.focus();
    },
    [],
  );

  const handleFormKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const owner = target.closest('[role="combobox"]') as HTMLElement | null;
      const isAutocompleteOpen =
        owner?.getAttribute("aria-expanded") === "true";

      if (event.key === "Enter") {
        if (isAutocompleteOpen) return;
        if (target instanceof HTMLTextAreaElement) return;
        // Prevent implicit form submit by Enter; save is explicit via button click.
        event.preventDefault();
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement
        ) {
          focusSibling(target);
        }
        return;
      }

      if (
        !(
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement
        )
      ) {
        return;
      }
      const disableFormArrowNavigation =
        target.getAttribute("data-disable-form-arrow-nav") === "true";

      if (isAutocompleteOpen) {
        // Let MUI Autocomplete handle keyboard interaction (including Enter selection)
        return;
      }

      if (event.key === "ArrowUp") {
        if (disableFormArrowNavigation) return;
        event.preventDefault();
        focusSibling(target, { reverse: true });
        return;
      }

      if (event.key === "ArrowDown") {
        if (disableFormArrowNavigation) return;
        event.preventDefault();
        focusSibling(target);
        return;
      }

      if (
        event.key === "ArrowRight" &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement)
      ) {
        if (disableFormArrowNavigation) return;
        const pos = target.selectionStart ?? 0;
        if (pos === target.value.length) {
          event.preventDefault();
          focusSibling(target);
        }
        return;
      }

      if (
        event.key === "ArrowLeft" &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement)
      ) {
        if (disableFormArrowNavigation) return;
        const pos = target.selectionStart ?? 0;
        if (pos === 0) {
          event.preventDefault();
          focusSibling(target, { reverse: true });
        }
      }
    },
    [focusSibling],
  );

  const handleFormChangeCapture = useCallback(
    (event: FormEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      if (!(target instanceof HTMLSelectElement)) return;
      setTimeout(() => {
        focusSibling(target);
      }, 0);
    },
    [focusSibling],
  );

  const saveTravelPackage = useCallback(async () => {
    if (isFormLocked) return;
    if (isSaving || isLoadingDetail) return;

    if (isEditMode && !id) {
      showToast({
        title: "Error",
        description: "No se pudo resolver el Id del paquete para actualizar.",
        type: "error",
      });
      return;
    }

    const usuarioId = Number(authUser?.id ?? 0);
    if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
      showToast({
        title: "Error",
        description: "No se pudo resolver el usuario de la sesión.",
        type: "error",
      });
      return;
    }

    const formForSave = normalizePassengersForSubmit(form);
    const validationError = validateTravelPackageForm(formForSave);
    if (validationError) {
      showToast({
        title: "Validación",
        description: validationError.message,
        type: "error",
      });
      focusBySelector(validationError.focusSelector);
      return;
    }

    setIsSaving(true);

    try {
      const payload = buildTravelPackageLegacyPayload({
        ...formForSave,
        fechaEmision: buildFechaRegistroDateTime(
          normalizeText(formForSave.fechaEmision),
        ),
      });
      const splitIndex = payload.indexOf("[");
      const telPaxToken = normalizeLegacyToken(formForSave.telPax);
      const payloadWithUsuario =
        splitIndex >= 0
          ? `${payload.slice(0, splitIndex)}|${usuarioId}|${telPaxToken}${payload.slice(splitIndex)}`
          : `${payload}|${usuarioId}|${telPaxToken}`;
      const valoresFinal = isEditMode
        ? `${String(id)}|${payloadWithUsuario}`
        : payloadWithUsuario;
      const response = isEditMode
        ? await actualizarPaqueteViaje(valoresFinal)
        : await agregarPaqueteViaje(valoresFinal);
      const normalized = String(response ?? "")
        .trim()
        .toUpperCase();

      if (
        normalized === "FALSE" ||
        normalized === "ERROR" ||
        normalized === "OPERACION" ||
        normalized === "FORMATO_INVALIDO" ||
        normalized === "~"
      ) {
        showToast({
          title: "Error",
          description:
            String(response ?? "").trim() ||
            (isEditMode
              ? "No se pudo actualizar el paquete de viaje."
              : "No se pudo guardar el paquete de viaje."),
          type: "error",
        });
        return;
      }

      showToast({
        title: isEditMode ? "Actualizado" : "Guardado",
        description: isEditMode
          ? "El paquete de viaje se actualizo correctamente."
          : "El paquete de viaje se registró correctamente.",
        type: "success",
      });

      const responseMeta = resolveSavedPackageResponseMeta(response);
      const responseId = responseMeta.id ?? resolveSavedPackageId(response);
      const editId = parsePositiveId(id);
      const packageId = responseId ?? (isEditMode ? editId : null);
      const resolvedNotaId = normalizeText(formForSave.notaId) || routeNotaId;
      const formForInvoice: TravelPackageFormState = {
        ...formForSave,
        notaId: resolvedNotaId,
        nserie: responseMeta.nserie ?? formForSave.nserie,
        ndocumento: responseMeta.ndocumento ?? formForSave.ndocumento,
      };
      const invoiceData = buildPackageInvoiceData(formForInvoice, packageId);

      try {
        localStorage.setItem(
          PACKAGE_INVOICE_STORAGE_KEY,
          JSON.stringify(invoiceData),
        );
      } catch {
        // no bloquear navegación por errores de storage
      }

      const previewPath = packageId
        ? `/paquete-viaje/${packageId}/preview`
        : "/paquete-viaje/preview";

      navigate(previewPath, {
        state: {
          invoiceData,
          packageId: packageId ?? undefined,
          notaId: resolvedNotaId || undefined,
          fromNewTravelPackage: !isEditMode,
        },
      });
    } catch (error) {
      showToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : isEditMode
              ? "No se pudo actualizar el paquete de viaje."
              : "No se pudo guardar el paquete de viaje.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    authUser?.id,
    form,
    id,
    isEditMode,
    isFormLocked,
    isLoadingDetail,
    isSaving,
    navigate,
    routeNotaId,
  ]);

  const handleFormSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    // Guardar se ejecuta solo con click explícito en el botón Guardar.
    event.preventDefault();
  }, []);

  const handleToggleVerificado = useCallback(async () => {
    if (!canToggleVerificado || !isEditMode || !id) return;

    const idPaqueteViaje = Number(id);
    if (!Number.isFinite(idPaqueteViaje) || idPaqueteViaje <= 0) {
      showToast({
        title: "Verificación",
        description: "No se pudo resolver el identificador del paquete.",
        type: "error",
      });
      return;
    }

    const nextEstado = !isVerificado;

    try {
      setIsUpdatingVerificado(true);
      const response = await actualizarVerificadoPaqueteViaje({
        idPaqueteViaje,
        estado: nextEstado,
      });
      const backendRejected =
        response === false || response === "false" || response === "FALSE";
      if (backendRejected) {
        showToast({
          title: "Verificación",
          description: "No se pudo actualizar el estado de verificación.",
          type: "error",
        });
        return;
      }

      handlers.updateField("flagVerificado", nextEstado ? "1" : "0");
      showToast({
        title: nextEstado ? "Confirmado" : "Revertido",
        description: nextEstado
          ? "El paquete fue marcado como verificado."
          : "El paquete fue marcado como no verificado.",
        type: "success",
      });
      navigate("/paquete-viaje", { state: { refresh: true } });
    } catch (error) {
      showToast({
        title: "Verificación",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al actualizar el estado.",
        type: "error",
      });
    } finally {
      setIsUpdatingVerificado(false);
    }
  }, [canToggleVerificado, handlers, id, isEditMode, isVerificado, navigate]);

  const handleConfirmToggleVerificado = useCallback(() => {
    if (!canToggleVerificado || !isEditMode || !id) return;

    const nextEstado = !isVerificado;
    openDialog({
      title: nextEstado ? "Confirmar verificación" : "Revertir verificación",
      size: "sm",
      confirmLabel: nextEstado ? "Confirmar" : "Revertir",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        await handleToggleVerificado();
      },
      content: () => (
        <p className="text-sm text-slate-700">
          {nextEstado
            ? "¿Deseas marcar este paquete como verificado?"
            : "¿Deseas marcar este paquete como no verificado?"}
        </p>
      ),
    });
  }, [
    canToggleVerificado,
    handleToggleVerificado,
    id,
    isEditMode,
    isVerificado,
    openDialog,
  ]);

  const handleUnlockEditing = useCallback(() => {
    if (!isEditMode) return;
    setIsEditing(true);
  }, [isEditMode]);
  const handlePrint = useCallback(() => {
    const editId = parsePositiveId(id);
    const packageId = isEditMode ? editId : null;
    const resolvedNotaId = normalizeText(form.notaId) || routeNotaId;
    const formForInvoice: TravelPackageFormState = {
      ...form,
      notaId: resolvedNotaId,
    };
    const invoiceData = buildPackageInvoiceData(formForInvoice, packageId);

    try {
      localStorage.setItem(
        PACKAGE_INVOICE_STORAGE_KEY,
        JSON.stringify(invoiceData),
      );
    } catch {
      // no bloquear navegación por errores de storage
    }

    const previewPath = packageId
      ? `/paquete-viaje/${packageId}/preview`
      : "/paquete-viaje/preview";

    navigate(previewPath, {
      state: {
        invoiceData,
        packageId: packageId ?? undefined,
        notaId: resolvedNotaId || undefined,
        fromNewTravelPackage: false,
      },
    });
  }, [form, id, isEditMode, navigate, routeNotaId]);

  const handleOpenBoleta = useCallback(() => {
    if (!isEditMode) return;

    const packageId = parsePositiveId(id);
    if (!packageId) {
      showToast({
        title: "Error",
        description: "No se pudo resolver el identificador del paquete.",
        type: "error",
      });
      return;
    }

    const boletaData = buildTravelPackageBoletaData(form, packageId);
    navigate(`/paquete-viaje/${packageId}/boleta`, {
      state: { boletaData },
    });
  }, [form, id, isEditMode, navigate]);

  const handleDeleteTravelPackage = useCallback(async () => {
    if (!isEditMode || !id) return;
    if (!canDeleteTravelPackage) {
      showToast({
        title: "Sin permiso",
        description: "No tienes permiso para eliminar en este módulo.",
        type: "error",
      });
      return;
    }

    const packageId = parsePositiveId(id);
    if (!packageId) {
      showToast({
        title: "Error",
        description: "No se pudo resolver el identificador del paquete.",
        type: "error",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await eliminarPaqueteViaje(packageId);
      const responseText =
        typeof response === "string"
          ? response.trim()
          : response && typeof response === "object"
            ? String(
                (response as Record<string, unknown>).Resultado ??
                  (response as Record<string, unknown>).resultado ??
                  (response as Record<string, unknown>).Mensaje ??
                  (response as Record<string, unknown>).mensaje ??
                  "",
              ).trim()
            : String(response ?? "").trim();
      const normalized = responseText.toUpperCase();
      const deleted =
        response === true ||
        normalized === "TRUE" ||
        normalized === "OK" ||
        normalized === "1";

      if (!deleted) {
        showToast({
          title: "Error",
          description:
            responseText ||
            "No se pudo eliminar el paquete de viaje seleccionado.",
          type: "error",
        });
        return;
      }

      showToast({
        title: "Eliminado",
        description: "El paquete de viaje se eliminó correctamente.",
        type: "success",
      });
      markLiquidacionesAsStale();
      if (fromLiquidaciones) {
        navigate("/fullday/programacion/liquidaciones", {
          state: { refresh: Date.now() },
        });
        return;
      }
      navigate("/paquete-viaje/new");
    } catch (error) {
      showToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Algo salió mal al intentar eliminar.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [canDeleteTravelPackage, fromLiquidaciones, id, isEditMode, navigate]);

  const handleConfirmDeleteTravelPackage = useCallback(() => {
    if (!isEditMode || !id) return;
    if (!canDeleteTravelPackage) {
      showToast({
        title: "Sin permiso",
        description: "No tienes permiso para eliminar en este módulo.",
        type: "error",
      });
      return;
    }

    openDialog({
      title: "¿Eliminar paquete de viaje?",
      size: "sm",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        await handleDeleteTravelPackage();
      },
      content: () => (
        <p className="text-sm text-slate-700">
          Esta acción no se puede deshacer. ¿Estás seguro de eliminar este
          paquete de viaje?
        </p>
      ),
    });
  }, [
    canDeleteTravelPackage,
    handleDeleteTravelPackage,
    id,
    isEditMode,
    openDialog,
  ]);

  const handleNew = useCallback(() => {
    if (isSaving || isLoadingDetail || isUpdatingVerificado) return;

    const displayName = String(authUser?.displayName ?? "").trim();
    replaceForm({
      ...INITIAL_FORM_STATE,
      fechaEmision: getTodayIso(),
      counter: displayName || INITIAL_FORM_STATE.counter,
      agencia: null,
      paquetesViaje: [],
      destinos: [],
      hotelesContratados: [],
      itinerario: [],
      pasajeros: [createEmptyPassenger()],
    });

    if (isEditMode) {
      setIsEditing(true);
      navigate("/paquete-viaje/new");
    }
  }, [
    authUser?.displayName,
    isEditMode,
    isLoadingDetail,
    isSaving,
    isUpdatingVerificado,
    navigate,
    replaceForm,
    setIsEditing,
  ]);
  return (
    <form
      className="w-full space-y-6 pb-12"
      onSubmit={handleFormSubmit}
      onKeyDownCapture={handleFormKeyDownCapture}
      onChangeCapture={handleFormChangeCapture}
      noValidate
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 lg:p-5">
        {/* Header */}
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
          <div className="flex flex-wrap items-end gap-3 min-w-0">
            <div className="flex items-end justify-between w-[40px]">
              <ChevronLeft
                className="cursor-pointer"
                onClick={handleBackNavigation}
              />
            </div>

            {/* FECHA VIAJE */}
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-slate-500 text-xs">Fecha emision:</span>
              <span className="text-sm font-medium text-slate-700">
                {fechaEmisionLabel}
              </span>
            </div>

            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-slate-500 text-xs">Nota ID:</span>
              <span className="text-sm font-medium text-slate-700">
                {normalizeText(form.notaId) || "-"}
              </span>
            </div>
          </div>

          {/* ================= ACCIONES ================= */}
          <div
            className="
                flex flex-wrap items-end gap-2 lg:gap-3
                justify-end
                shrink-0
              "
          >
            <div className="w-[220px] max-w-full">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Documento cobranza
              </label>
              <select
                value={form.documentoCobranza}
                disabled={fieldsetDisabled}
                onChange={(event) =>
                  handlers.updateField("documentoCobranza", event.target.value)
                }
                className="h-[36px] w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {DOCUMENTO_COBRANZA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[90px] max-w-full">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Serie
              </label>
              <input
                name="nserie"
                value={form.nserie}
                maxLength={4}
                disabled={
                  fieldsetDisabled ||
                  form.documentoCobranza === "DOCUMENTO COBRANZA"
                }
                onChange={(event) =>
                  handlers.updateField(
                    "nserie",
                    event.target.value.toUpperCase(),
                  )
                }
                className="h-[36px] w-[80px] rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div className="w-[100px] max-w-full">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Nro documento
              </label>
              <input
                name="ndocumento"
                value={form.ndocumento}
                disabled={
                  fieldsetDisabled ||
                  form.documentoCobranza === "DOCUMENTO COBRANZA"
                }
                onChange={(event) =>
                  handlers.updateField("ndocumento", event.target.value)
                }
                className="h-[36px] w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => void saveTravelPackage()}
                  disabled={isSaving || isLoadingDetail || isUpdatingVerificado}
                  className="inline-flex items-center gap-1
                    rounded-lg bg-emerald-600 px-3 py-2
                    text-white shadow-sm
                    ring-1 ring-emerald-600/30
                    hover:bg-emerald-700 transition
                    disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {isLoadingDetail
                    ? "Cargando..."
                    : isSaving
                      ? "Guardando..."
                      : "Guardar"}
                </button>

                <button
                  type="button"
                  onClick={handleNew}
                  disabled={isSaving || isLoadingDetail || isUpdatingVerificado}
                  className="h-full min-h-[42px] inline-flex items-center gap-2 rounded-lg bg-white px-4 text-slate-700 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo
                </button>
              </>
            ) : null}

            {isEditing && isEditMode && (
              <button
                type="button"
                onClick={handleConfirmDeleteTravelPackage}
                disabled={
                  isSaving ||
                  isLoadingDetail ||
                  isUpdatingVerificado ||
                  !canDeleteTravelPackage
                }
                className="h-full min-h-[42px] inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 text-white text-sm font-semibold shadow-sm ring-1 ring-red-600/30 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash className="h-4 w-4" />
                Eliminar
              </button>
            )}

            {isEditMode && !isEditing && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={isLoadingDetail || isSaving}
                className="h-full min-h-[42px] inline-flex items-center gap-2 rounded-lg bg-white px-4 text-slate-700 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer className="h-4 w-4" />
              </button>
            )}

            {canToggleVerificado && isEditMode && !isEditing && (
              <button
                type="button"
                disabled={isLoadingDetail || isUpdatingVerificado}
                onClick={handleConfirmToggleVerificado}
                className={`h-full min-h-[42px] inline-flex items-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  isVerificado
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                    : "bg-emerald-600 text-white ring-1 ring-emerald-600/30 hover:bg-emerald-700"
                }`}
              >
                {isUpdatingVerificado ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isVerificado ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {isUpdatingVerificado
                  ? "Procesando..."
                  : isVerificado
                    ? "Revertir"
                    : "Confirmar"}
              </button>
            )}

            {isEditMode && !isEditing && (
              <button
                type="button"
                onClick={handleOpenBoleta}
                disabled={isLoadingDetail || isSaving}
                className="h-full min-h-[42px] inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 text-white text-sm font-semibold shadow-sm ring-1 ring-rose-600/30 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText className="h-4 w-4" />
              </button>
            )}

            {!isEditing && isEditMode && (
              <button
                type="button"
                onClick={handleUnlockEditing}
                disabled={isLoadingDetail || isSaving || isUpdatingVerificado}
                title="Desbloquear edición"
                className="h-full min-h-[42px] inline-flex items-center gap-2 rounded-lg bg-white px-4 text-slate-700 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <fieldset disabled={fieldsetDisabled} className="contents">
          <div
            className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-start ${
              fieldsetDisabled ? "pointer-events-none" : ""
            }`}
          >
            {/* Row 1: General Data - Full Width */}
            <div className="md:col-span-2">
              <GeneralDataSection
                form={form}
                onUpdateField={handlers.updateField}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 h-full md:col-span-2">
              <AgencySection
                form={form}
                onUpdateField={handlers.updateField}
                onUpdateAgencia={handlers.updateAgencia}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 h-full md:col-span-2">
              <PassengersSection
                pasajeros={form.pasajeros}
                precioPaxGeneral={form.precioPaxGeneral}
                onUpdateField={handlers.updatePassengerField}
                onAdd={handlers.addPassenger}
                onRemove={handlers.removePassenger}
              />
            </div>

            <div className="md:col-span-2">
              <ServiciosContratadosSection
                form={form}
                onUpdateField={handlers.updateField}
                onAddHotelServicio={handlers.addHotelServicio}
                onRemoveHotelServicio={handlers.removeHotelServicio}
                onUpdateHotelServicioField={handlers.updateHotelServicioField}
              />
            </div>

            {/* Row 4: Itinerary - Full Width */}
            <div className="md:col-span-2">
              <ItinerarySection
                itinerario={form.itinerario}
                destinos={form.destinos}
                cantPax={form.cantPax}
                pasajeros={form.pasajeros}
                moneda={form.moneda}
                onUpdateDayField={handlers.updateItineraryDayField}
                onAddDay={handlers.addItineraryDay}
                onRemoveDay={handlers.removeItineraryDay}
                onAddEvent={handlers.addDayEvent}
                onRemoveEvent={handlers.removeDayEvent}
                onUpdateEventField={handlers.updateDayEventField}
              />
            </div>

            <div className="md:col-span-2">
              <LiquidationSection
                form={form}
                onUpdateField={handlers.updateField}
              />
            </div>
          </div>
        </fieldset>
      </div>
    </form>
  );
};

export default TravelPackageForm;
