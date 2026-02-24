import { useState } from "react";
import { useTravelPackageForm } from "../hooks/useTravelPackageForm";
import AgencySection from "../components/AgencySection";
import GeneralDataSection from "../components/GeneralDataSection";
import ItinerarySection from "../components/ItinerarySection";
import PassengersSection from "../components/PassengersSection";
import ServiciosContratadosSection from "../components/ServiciosContratadosSection";
import PaymentDetailFloating from "../components/PaymentDetailFloating";
import { ChevronLeft, ReceiptText } from "lucide-react";

const TravelPackageForm = () => {
  const { form, handlers } = useTravelPackageForm();
  const [isPaymentOpen, setIsPaymentOpen] = useState(true);

  return (
    <div className="w-full space-y-6 pb-12">
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
    </div>
  );
};

export default TravelPackageForm;
