import dayjs from "dayjs";
import { useState, useCallback, useEffect } from "react";
import { roundCurrency } from "@/shared/helpers/formatCurrency";
import { useAuthStore } from "@/store/auth/auth.store";
import {
  calculateTravelPackageCharges,
  calculateTravelPackageLiquidationBase,
} from "../utils/liquidationCalculator";
import type {
  HotelServicioRow,
  ItineraryDayRow,
  ItineraryActivityRow,
  PassengerRow,
  SelectOption,
  TravelPackageFormState,
} from "../types/travelPackage.types";
import {
  CARD_ONLY_ENTIDAD_BANCARIA_VALUES,
  INITIAL_FORM_STATE,
  createEmptyPassenger,
  createEmptyActivity,
  createEmptyItineraryDay,
  createEmptyHotelServicio,
  createDefaultItineraryRows,
  getTravelCurrencySymbol,
} from "../constants/travelPackage.constants";

const isActiveItineraryRow = (row: ItineraryActivityRow) => {
  const detail = String(row?.detalle ?? "").trim();
  if (row?.tipo === "ENTRADA") {
    const normalized = detail.toUpperCase();
    return normalized !== "" && normalized !== "N/A";
  }
  return detail !== "" && detail !== "-";
};

const applyDerivedRules = (state: TravelPackageFormState): TravelPackageFormState => {
  const next = { ...state };

  next.paquetesViaje = (next.paquetesViaje ?? []).map((item) => ({
    ...item,
    cantPax: Math.max(0, Math.floor(Number(item.cantPax || 0) || 0)),
    cantidad: Math.max(0, Math.floor(Number(item.cantidad || 0) || 0)),
  }));

  const paxFromPackages = next.paquetesViaje.reduce((acc, item) => {
    const isSinHotel = String(item.paquete ?? "").toLowerCase().includes("sin hotel");
    if (isSinHotel) {
      return acc + Number(item.cantPax || 0);
    }
    return acc + Number(item.cantPax || 0) * Number(item.cantidad || 0);
  }, 0);
  const hasHotelPackage = next.paquetesViaje.some(
    (item) => !String(item.paquete ?? "").toLowerCase().includes("sin hotel"),
  );
  const onlySinHotelPackageSelected =
    next.paquetesViaje.length > 0 &&
    next.paquetesViaje.every((item) =>
      String(item.paquete ?? "").toLowerCase().includes("sin hotel"),
    );
  if (hasHotelPackage) {
    next.incluyeHotel = true;
    next.incluyeHotelSeleccion = "SI";
  }
  if (onlySinHotelPackageSelected) {
    next.incluyeHotel = false;
    next.incluyeHotelSeleccion = "NO";
    next.hotelesContratados = [];
  }
  if (next.incluyeHotelSeleccion === "SI") {
    next.incluyeHotel = true;
  } else if (next.incluyeHotelSeleccion === "NO") {
    next.incluyeHotel = false;
    next.hotelesContratados = [];
  }

  if (paxFromPackages > 0) {
    next.cantPax = String(paxFromPackages);
  }

  const pax = Math.max(0, Math.floor(Number(String(next.cantPax ?? "").trim()) || 0));
  next.cantPax = String(pax);

  const currentPassengers = next.pasajeros ?? [];
  if (pax > currentPassengers.length) {
    next.pasajeros = [
      ...currentPassengers,
      ...Array.from({ length: pax - currentPassengers.length }, () => createEmptyPassenger()),
    ];
  } else if (pax < currentPassengers.length) {
    next.pasajeros = currentPassengers.slice(0, pax);
  }

  next.itinerario = (next.itinerario ?? []).map((day) => ({
    ...day,
    comisionPorcentaje:
      day.comisionPorcentaje === undefined ||
      day.comisionPorcentaje === null ||
      String(day.comisionPorcentaje).trim() === ""
        ? undefined
        : roundCurrency(
            Math.max(
              0,
              Math.min(
                100,
                Number.isFinite(Number(day.comisionPorcentaje))
                  ? Number(day.comisionPorcentaje)
                  : 0,
              ),
            ),
          ),
    incentivoValor:
      day.incentivoValor === undefined ||
      day.incentivoValor === null ||
      String(day.incentivoValor).trim() === ""
        ? undefined
        : roundCurrency(
            Math.max(
              0,
              Number.isFinite(Number(day.incentivoValor))
                ? Number(day.incentivoValor)
                : 0,
            ),
          ),
    actividades: (day.actividades ?? []).map((row) => {
      if (!isActiveItineraryRow(row)) {
        if (
          Number(row.precio || 0) === 0 &&
          Number(row.cant || 0) === 0 &&
          Number(row.subtotal || 0) === 0
        ) {
          return row;
        }
        return { ...row, precio: 0, cant: 0, subtotal: 0 };
      }
      const precio = Number(row.precio || 0);
      const cant = pax;
      return { ...row, cant, subtotal: roundCurrency(precio * cant) };
    }),
  }));

  if (next.moneda === "SOLES") next.precioExtraDolares = 0;
  if (next.moneda === "DOLARES") next.precioExtraSoles = 0;

  if (next.condicionPago === "CREDITO") {
    next.acuenta = 0;
    next.deposito = 0;
    next.efectivo = 0;
    next.medioPago = "-";
    next.entidadBancaria = "-";
    next.nroOperacion = "";
  }

  if (
    next.medioPago !== "TARJETA" &&
    CARD_ONLY_ENTIDAD_BANCARIA_VALUES.has(
      String(next.entidadBancaria ?? "").toUpperCase(),
    )
  ) {
    next.entidadBancaria = "";
    next.nroOperacion = "";
  }

  const base = calculateTravelPackageLiquidationBase(next);
  const { igv, cargosExtra, totalGeneral } = calculateTravelPackageCharges({
    baseAmount: base,
    documentoCobranza: next.documentoCobranza,
    medioPago: next.medioPago,
  });

  next.igv = igv;
  next.cargosExtra = cargosExtra;
  next.totalGeneral = totalGeneral;

  const extraAplicado =
    next.moneda === "SOLES"
      ? Number(next.precioExtraSoles || 0)
      : Number(next.precioExtraDolares || 0);
  const totalConExtra = roundCurrency(totalGeneral + extraAplicado);

  if (next.condicionPago === "CANCELADO") {
    next.acuenta = totalGeneral;
  }

  if (next.condicionPago === "ACUENTA") {
    next.acuenta = Math.min(Number(next.acuenta || 0), totalGeneral);
    next.deposito = 0;
    next.efectivo = 0;
  }

  if (next.medioPago === "EFECTIVO") {
    next.entidadBancaria = "-";
    next.nroOperacion = "";
    next.efectivo = Number(next.acuenta || 0);
    next.deposito = 0;
  } else if (["DEPOSITO", "YAPE", "TARJETA"].includes(next.medioPago)) {
    if (next.entidadBancaria === "-") next.entidadBancaria = "";
    next.efectivo = 0;
    next.deposito = Number(next.acuenta || 0);
  } else if (next.medioPago === "" || next.medioPago === "-") {
    next.efectivo = 0;
    next.deposito = 0;
  }

  const saldo = roundCurrency(totalConExtra - Number(next.acuenta || 0));
  next.saldo = saldo;

  const symbol = getTravelCurrencySymbol(next.moneda);
  next.mensajePasajero =
    next.condicionPago === "CANCELADO"
      ? "EL PASAJERO NO TIENE DEUDA."
      : `EL PASAJERO SI TIENE DEUDA ${symbol} ${roundCurrency(
          next.condicionPago === "CREDITO" ? totalConExtra : saldo,
        ).toFixed(2)}`;

  return next;
};

export const useTravelPackageForm = () => {
  const [form, setForm] = useState<TravelPackageFormState>(INITIAL_FORM_STATE);
  const userDisplayName = useAuthStore((state) => state.user?.displayName ?? "");

  useEffect(() => {
    const normalizedDisplayName = String(userDisplayName ?? "").trim();
    if (!normalizedDisplayName) return;

    setForm((prev) => {
      if (String(prev.counter ?? "").trim()) return prev;
      return {
        ...prev,
        counter: normalizedDisplayName,
      };
    });
  }, [userDisplayName]);

  const updateField = useCallback(<K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => {
    setForm((prev) => {
      const newState = { ...prev, [key]: value };

      // Synchronization logic: Date Range -> Itinerary
      if (key === "fechaInicioViaje" || key === "fechaFinViaje") {
         const startStr = newState.fechaInicioViaje;
         const endStr = newState.fechaFinViaje;

         if (startStr && endStr) {
            const start = dayjs(startStr);
            const end = dayjs(endStr);
            
            if (start.isValid() && end.isValid() && !end.isBefore(start)) {
                const daysCount = end.diff(start, 'day') + 1;
                const newItinerary: ItineraryDayRow[] = [];

                for (let i = 0; i < daysCount; i++) {
                    const currentDate = start.add(i, 'day').format('YYYY-MM-DD');
                    const existingRow = prev.itinerario[i];
                    
                    if (existingRow) {
                        // Preserve existing data, update date
                        newItinerary.push({ 
                            ...existingRow, 
                            fecha: currentDate 
                        });
                    } else {
                        // Create new row
                        newItinerary.push({
                            id: Date.now() + i + Math.random(), 
                            fecha: currentDate,
                            titulo: "",
                            origen: "",
                            destino: "",
                            precioUnitario: 0,
                            comisionPorcentaje: undefined,
                            incentivoValor: 0,
                            observacion: "",
                            actividades: createDefaultItineraryRows(),
                        });
                    }
                }
                newState.itinerario = newItinerary;
            }
         }
      }

      if (key === "incluyeHotel" && !value) {
        newState.hotelesContratados = [];
      }
      return applyDerivedRules(newState);
    });
  }, []);

  // ─── Agencia ─────────────────────────────────────────────────────────────────

  const updateAgencia = useCallback((option: SelectOption | null) => {
    updateField("agencia", option);
  }, [updateField]);

  // ─── Pasajeros ───────────────────────────────────────────────────────────────

  const addPassenger = () => {
    setForm((prev) => {
      const base = applyDerivedRules(prev);
      return applyDerivedRules({
        ...base,
        pasajeros: [...base.pasajeros, createEmptyPassenger()],
      });
    });
  };

  const removePassenger = (id: number) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        pasajeros: prev.pasajeros.filter((p) => p.id !== id),
      }),
    );
  };

  const updatePassengerField = useCallback((
    id: number,
    field: keyof Omit<PassengerRow, "id">,
    value: string,
  ) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        pasajeros: prev.pasajeros.map((p) =>
          p.id === id ? { ...p, [field]: value } : p,
        ),
      }),
    );
  }, []);

  // ─── Servicios contratados (Hoteles) ───────────────────────────────────────

  const addHotelServicio = () => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        hotelesContratados: [...prev.hotelesContratados, createEmptyHotelServicio()],
      }),
    );
  };

  const removeHotelServicio = (id: number) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        hotelesContratados: prev.hotelesContratados.filter((h) => h.id !== id),
      }),
    );
  };

  const updateHotelServicioField = <
    K extends keyof Omit<HotelServicioRow, "id">
  >(
    id: number,
    field: K,
    value: HotelServicioRow[K],
  ) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        hotelesContratados: prev.hotelesContratados.map((h) =>
          h.id === id ? { ...h, [field]: value } : h,
        ),
      }),
    );
  };

  // ─── Itinerario ──────────────────────────────────────────────────────────────

  const addItineraryDay = () => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        itinerario: [...prev.itinerario, createEmptyItineraryDay()],
      }),
    );
  };

  const removeItineraryDay = (id: number) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        itinerario: prev.itinerario.filter((d) => d.id !== id),
      }),
    );
  };

  const updateItineraryDayField = useCallback(
    <K extends keyof Omit<ItineraryDayRow, "id" | "actividades">>(
      id: number,
      field: K,
      value: ItineraryDayRow[K],
    ) => {
      setForm((prev) =>
        applyDerivedRules({
          ...prev,
          itinerario: prev.itinerario.map((d) =>
            d.id === id ? { ...d, [field]: value } : d,
          ),
        }),
      );
    },
    [],
  );

  // ─── Eventos del día ─────────────────────────────────────────────────────────

  const addDayEvent = (dayId: number) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        itinerario: prev.itinerario.map((day) =>
          day.id === dayId
            ? { ...day, actividades: [...day.actividades, createEmptyActivity()] }
            : day,
        ),
      }),
    );
  };

  const removeDayEvent = (dayId: number, eventId: number) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        itinerario: prev.itinerario.map((day) =>
          day.id === dayId
            ? {
                ...day,
                actividades: day.actividades.filter((e) => e.id !== eventId),
              }
            : day,
        ),
      }),
    );
  };

  const updateDayEventField = useCallback((
    dayId: number,
    eventId: number,
    field: keyof Omit<ItineraryActivityRow, "id">,
    value: string | number,
  ) => {
    setForm((prev) =>
      applyDerivedRules({
        ...prev,
        itinerario: prev.itinerario.map((day) =>
          day.id === dayId
            ? {
                ...day,
                actividades: day.actividades.map((e) =>
                  e.id === eventId ? { ...e, [field]: value } : e,
                ),
              }
            : day,
        ),
      }),
    );
  }, []);

  const replaceForm = useCallback((nextState: TravelPackageFormState) => {
    setForm(nextState);
  }, []);

  // ─── Handlers bundle ─────────────────────────────────────────────────────────

  const handlers = {
    replaceForm,
    updateField,
    updateAgencia,
    addPassenger,
    removePassenger,
    updatePassengerField,
    addHotelServicio,
    removeHotelServicio,
    updateHotelServicioField,
    addItineraryDay,
    removeItineraryDay,
    updateItineraryDayField,
    addDayEvent,
    removeDayEvent,
    updateDayEventField,
  };

  return { form, handlers };
};
