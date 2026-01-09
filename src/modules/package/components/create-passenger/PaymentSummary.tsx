import {
  TextControlled,
  SelectControlled,
  DateInput,
} from "@/components/ui/inputs";
import type { Control, UseFormRegister } from "react-hook-form";

interface PaymentSummaryProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  documentoOptions: any[];
  totalPagar: number;
  saldo: number;
  medioPagoOptions: any[];
  bancoOptions: any[];
  isSubmitting?: boolean;
  documentoCobranzaOptions: any[];
}

export const PaymentSummary = ({
  control,
  register,
  documentoOptions,
  documentoCobranzaOptions,
  totalPagar,
  saldo,
  medioPagoOptions,
  bancoOptions,
  isSubmitting,
}: PaymentSummaryProps) => {
  return (
    <div className="lg:col-span-2 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <SelectControlled
            name="documentoCobranza"
            control={control}
            label="Documento de Cobranza"
            options={documentoCobranzaOptions}
            size="small"
          />
        </div>
        <div>
          <TextControlled
            name="documentoNumero"
            control={control}
            label="N° documento"
            size="small"
          />
        </div>
        <div>
          <SelectControlled
            name="documentoTipo"
            control={control}
            label="Documento cobranza"
            options={documentoOptions}
            size="small"
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-2">
          Precio De Liquidación
        </p>
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
              TOTAL A PAGAR S/ :
            </div>
            <div className="px-3 py-2 text-right font-semibold">
              {totalPagar.toFixed(2)}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
              ACUENTA:
            </div>
            <div className="px-3 py-2">
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register("acuenta", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
              SALDO S/ :
            </div>
            <div className="px-3 py-2 text-right font-semibold">
              {saldo.toFixed(2)}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-50 text-amber-900 font-semibold px-3 py-2 col-span-2">
              Cobro Extra Sol:
            </div>
            <div className="px-3 py-2">
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register("cobroExtraSol", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3">
            <div className="bg-amber-50 text-amber-900 font-semibold px-3 py-2 col-span-2">
              Cobro Extra Dol:
            </div>
            <div className="px-3 py-2">
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                {...register("cobroExtraDol", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Medio de pago</p>
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Cobranza
          </span>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DateInput
              name="fechaPago"
              control={control}
              label="Fecha de adelanto"
              size="small"
            />
            <TextControlled
              name="nroOperacion"
              control={control}
              label="Nro Operación"
              size="small"
            />
            <SelectControlled
              name="medioPago"
              control={control}
              label="Medio de pago"
              options={medioPagoOptions}
              size="small"
            />
            <SelectControlled
              name="entidadBancaria"
              control={control}
              label="Entidad bancaria"
              options={bancoOptions}
              size="small"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TextControlled
              name="deposito"
              control={control}
              label="Depósito S/"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              size="small"
            />
            <TextControlled
              name="cobroExtraSol"
              control={control}
              label="Efectivo S/"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              size="small"
            />
            <TextControlled
              name="cobroExtraDol"
              control={control}
              label="Efectivo $"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              size="small"
            />
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Guardando..." : "Guardar Paquete"}
      </button>
    </div>
  );
};
