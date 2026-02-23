import dayjs from "dayjs";
import { useState, useCallback } from "react";
import type {
  HotelServicioRow,
  ItineraryDayRow,
  ItineraryEventRow,
  PassengerRow,
  SelectOption,
  TravelPackageFormState,
} from "../types/travelPackage.types";
import {
  INITIAL_FORM_STATE,
  createEmptyPassenger,
  createEmptyEvent,
  createEmptyItineraryDay,
  createEmptyHotelServicio,
} from "../constants/travelPackage.constants";

export const useTravelPackageForm = () => {
  const [form, setForm] = useState<TravelPackageFormState>(INITIAL_FORM_STATE);

  const updateField = <K extends keyof TravelPackageFormState>(
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
                            eventos: [],
                            hotel: "",
                            tipoHabitacion: "",
                            alimentacion: "",
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

      return newState;
    });
  };

  // ─── Agencia ─────────────────────────────────────────────────────────────────

  const updateAgencia = (option: SelectOption | null) => {
    updateField("agencia", option);
  };

  // ─── Pasajeros ───────────────────────────────────────────────────────────────

  const addPassenger = () => {
    setForm((prev) => ({
      ...prev,
      pasajeros: [...prev.pasajeros, createEmptyPassenger()],
    }));
  };

  const removePassenger = (id: number) => {
    setForm((prev) => ({
      ...prev,
      pasajeros: prev.pasajeros.filter((p) => p.id !== id),
    }));
  };

  const updatePassengerField = (
    id: number,
    field: keyof Omit<PassengerRow, "id">,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      pasajeros: prev.pasajeros.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }));
  };

  // ─── Servicios contratados (Hoteles) ───────────────────────────────────────

  const addHotelServicio = () => {
    setForm((prev) => ({
      ...prev,
      hotelesContratados: [...prev.hotelesContratados, createEmptyHotelServicio()],
    }));
  };

  const removeHotelServicio = (id: number) => {
    setForm((prev) => ({
      ...prev,
      hotelesContratados: prev.hotelesContratados.filter((h) => h.id !== id),
    }));
  };

  const updateHotelServicioField = <
    K extends keyof Omit<HotelServicioRow, "id">
  >(
    id: number,
    field: K,
    value: HotelServicioRow[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      hotelesContratados: prev.hotelesContratados.map((h) =>
        h.id === id ? { ...h, [field]: value } : h,
      ),
    }));
  };

  // ─── Itinerario ──────────────────────────────────────────────────────────────

  const addItineraryDay = () => {
    setForm((prev) => ({
      ...prev,
      itinerario: [...prev.itinerario, createEmptyItineraryDay()],
    }));
  };

  const removeItineraryDay = (id: number) => {
    setForm((prev) => ({
      ...prev,
      itinerario: prev.itinerario.filter((d) => d.id !== id),
    }));
  };

  const updateItineraryDayField = useCallback(
    <K extends keyof Omit<ItineraryDayRow, "id" | "eventos">>(
      id: number,
      field: K,
      value: ItineraryDayRow[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        itinerario: prev.itinerario.map((d) =>
          d.id === id ? { ...d, [field]: value } : d,
        ),
      }));
    },
    [],
  );

  // ─── Eventos del día ─────────────────────────────────────────────────────────

  const addDayEvent = (dayId: number) => {
    setForm((prev) => ({
      ...prev,
      itinerario: prev.itinerario.map((day) =>
        day.id === dayId
          ? { ...day, eventos: [...day.eventos, createEmptyEvent()] }
          : day,
      ),
    }));
  };

  const removeDayEvent = (dayId: number, eventId: number) => {
    setForm((prev) => ({
      ...prev,
      itinerario: prev.itinerario.map((day) =>
        day.id === dayId
          ? {
              ...day,
              eventos: day.eventos.filter((e) => e.id !== eventId),
            }
          : day,
      ),
    }));
  };

  const updateDayEventField = (
    dayId: number,
    eventId: number,
    field: keyof Omit<ItineraryEventRow, "id">,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      itinerario: prev.itinerario.map((day) =>
        day.id === dayId
          ? {
              ...day,
              eventos: day.eventos.map((e) =>
                e.id === eventId ? { ...e, [field]: value } : e,
              ),
            }
          : day,
      ),
    }));
  };

  // ─── Handlers bundle ─────────────────────────────────────────────────────────

  const handlers = {
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
