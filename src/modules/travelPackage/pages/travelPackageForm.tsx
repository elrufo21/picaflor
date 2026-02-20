import { useTravelPackageForm } from "../hooks/useTravelPackageForm";
import AgencySection from "../components/AgencySection";
import ConditionsSection from "../components/ConditionsSection";
import GeneralDataSection from "../components/GeneralDataSection";
import ItinerarySection from "../components/ItinerarySection";
import PassengersSection from "../components/PassengersSection";

const TravelPackageForm = () => {
  const { form, handlers } = useTravelPackageForm();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Nuevo Paquete de Viaje
          </h1>
          <p className="text-sm text-slate-500">
            Complete la información para generar el itinerario.
          </p>
        </div>
        {/* Actions or Status could go here */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Row 1: General Data - Full Width */}
        <div className="md:col-span-2">
          <GeneralDataSection
            form={form}
            onUpdateField={handlers.updateField}
          />
        </div>

        {/* Row 2: Agency & Passengers */}
        <div className="grid grid-cols-1 gap-6 h-full">
          <AgencySection
            form={form}
            onUpdateField={handlers.updateField}
            onUpdateAgencia={handlers.updateAgencia}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 h-full">
          <PassengersSection
            pasajeros={form.pasajeros}
            onUpdateField={handlers.updatePassengerField}
            onAdd={handlers.addPassenger}
            onRemove={handlers.removePassenger}
          />
        </div>

        {/* Row 3: Conditions - Full Width */}


        {/* Row 4: Itinerary - Full Width */}
        <div className="md:col-span-2">
          <ItinerarySection
            itinerario={form.itinerario}
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
  );
};

export default TravelPackageForm;
