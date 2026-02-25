import { useCallback, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTravelPackageForm } from "../hooks/useTravelPackageForm";
import AgencySection from "../components/AgencySection";
import GeneralDataSection from "../components/GeneralDataSection";
import ItinerarySection from "../components/ItinerarySection";
import PassengersSection from "../components/PassengersSection";
import ServiciosContratadosSection from "../components/ServiciosContratadosSection";
import PaymentDetailFloating from "../components/PaymentDetailFloating";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { getFocusableElements } from "@/shared/helpers/formFocus";

const TravelPackageForm = () => {
  const { form, handlers } = useTravelPackageForm();
  const [isPaymentOpen, setIsPaymentOpen] = useState(true);
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
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
      }

      const owner = target.closest('[role="combobox"]') as HTMLElement | null;
      const isAutocompleteOpen = owner?.getAttribute("aria-expanded") === "true";
      if (isAutocompleteOpen && event.key !== "Enter") return;

      if (event.key === "Enter") {
        if (target instanceof HTMLTextAreaElement) return;
        event.preventDefault();
        focusSibling(target);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusSibling(target, { reverse: true });
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusSibling(target);
        return;
      }

      if (
        event.key === "ArrowRight" &&
        (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
      ) {
        const pos = target.selectionStart ?? 0;
        if (pos === target.value.length) {
          event.preventDefault();
          focusSibling(target);
        }
        return;
      }

      if (
        event.key === "ArrowLeft" &&
        (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
      ) {
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

  return (
    <form
      className="w-full space-y-6 pb-12"
      onSubmit={(event) => event.preventDefault()}
      onKeyDownCapture={handleFormKeyDownCapture}
      onChangeCapture={handleFormChangeCapture}
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
          <div
            className="
                  flex flex-wrap gap-x-4 gap-y-2
                  min-w-0
                "
          >
            <div className="flex flex-wrap items-end justify-between gap-4 w-[40px]">
              <ChevronLeft className="cursor-pointer" onClick={() => {}} />
            </div>

            {/* FECHA VIAJE */}
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-slate-500 text-xs">Fecha emision:</span>
              <span className="text-sm font-medium text-slate-700">
                19/02/2026
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
            <button
              type="button"
              onClick={() => setIsPaymentOpen((prev) => !prev)}
              className="h-full min-h-[42px] inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700"
            >
              <ReceiptText className="h-4 w-4" />
              {isPaymentOpen ? "Ocultar detalle pago" : "Mostrar detalle pago"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-start">
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
              cantPax={form.cantPax}
              moneda={form.moneda}
              onUpdateDayField={handlers.updateItineraryDayField}
              onAddDay={handlers.addItineraryDay}
              onRemoveDay={handlers.removeItineraryDay}
              onAddEvent={handlers.addDayEvent}
              onRemoveEvent={handlers.removeDayEvent}
              onUpdateEventField={handlers.updateDayEventField}
            />
          </div>
        </div>
      </div>
      <PaymentDetailFloating
        form={form}
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onUpdateField={handlers.updateField}
      />
    </form>
  );
};

export default TravelPackageForm;
