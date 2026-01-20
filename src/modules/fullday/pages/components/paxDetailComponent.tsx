import { TextControlled } from "@/components/ui/inputs";

const PaxDetailComponent = ({ control, setValue }) => {
  return (
    <div className="rounded-2xl border border-slate-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-800">
          Contacto y actividades del pax
        </h2>
        <span className="text-xs text-slate-500">
          Datos mínimos para reservar
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-2">
        <div className="col-span-4">
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

        <div className="col-span-3">
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

        <div className="col-span-3">
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

        <div>
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
