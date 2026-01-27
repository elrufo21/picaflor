import { TextControlled } from "@/components/ui/inputs";

const PaxDetailComponent = ({ control, setValue }) => {
  return (
    <div className="rounded-2xl border border-slate-100 p-3">
      {/* HEADER */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Contacto y actividades del pax
        </h2>
        <span className="text-xs text-slate-500">
          Datos mínimos para reservar
        </span>
      </div>

      {/* FORM */}
      <div
        className="
      grid
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-12
      gap-2
    "
      >
        {/* NOMBRE */}
        <div className="lg:col-span-4">
          <TextControlled
            name="nombreCompleto"
            disableHistory
            control={control}
            label="Nombre completo"
            transform={(value) => value.toUpperCase()}
            required
            size="small"
          />
        </div>

        {/* DOCUMENTO */}
        <div className="lg:col-span-3">
          <TextControlled
            name="documentoNumero"
            disableHistory
            control={control}
            label="Número de documento"
            transform={(value) => value.toUpperCase()}
            required
            size="small"
          />
        </div>

        {/* CELULAR */}
        <div className="lg:col-span-3">
          <TextControlled
            name="celular"
            disableHistory
            control={control}
            label="Celular Pax"
            transform={(value) => value.toUpperCase()}
            required
            size="small"
          />
        </div>

        {/* CANTIDAD */}
        <div className="lg:col-span-2">
          <TextControlled
            name="cantPax"
            control={control}
            label="Cant"
            type="number"
            required
            size="small"
            displayZeroAsEmpty
            sx={{
              "& input": {
                textAlign: "center",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PaxDetailComponent;
