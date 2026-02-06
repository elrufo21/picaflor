import {
  TextControlled,
  SelectControlled,
  DateInput,
} from "@/components/ui/inputs";
import { useEffect, type KeyboardEvent } from "react";
import {
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

interface PaymentSummaryProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  documentoOptions: any[];
  totalPagar: number;
  saldo: number;
  medioPagoOptions: any[];
  bancoOptions: any[];
  isSubmitting?: boolean;
  documentoCobranzaOptions: any[];
  watch: any;
}

export const PaymentSummary = ({
  control,
  register,
  setValue,
  documentoOptions,
  documentoCobranzaOptions,
  totalPagar,
  saldo,
  medioPagoOptions,
  bancoOptions,
  isSubmitting,
  watch,
}: PaymentSummaryProps) => {
  const condicionSelected = useWatch({ control, name: "condicion" });
  const medioPagoValue = useWatch({ control, name: "medioPago" });
  const acuentaValue = useWatch({ control, name: "acuenta" });
  const saldoAmount = Number(saldo) || 0;
  const deudaAmount = Math.max(saldoAmount, 0);
  const hasDebt = deudaAmount > 0;

  const condicionLabel =
    typeof condicionSelected === "string"
      ? condicionSelected
      : String(
          condicionSelected?.label ?? condicionSelected?.value ?? "",
        ).trim();
  const condicionKey = condicionLabel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isCancelado = condicionKey.includes("cancel");
  const isACuenta = condicionKey.includes("cuenta");
  const isCredito = condicionKey.includes("credit");
  const normalizedMedioPago = String(medioPagoValue ?? "")
    .trim()
    .toUpperCase();
  const isDeposito = normalizedMedioPago === "DEPOSITO";
  const isEfectivo = normalizedMedioPago === "EFECTIVO";

  useEffect(() => {
    if (isCancelado) {
      setValue("acuenta", Number(totalPagar) || 0, {
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }
    setValue("acuenta", 0, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [isCancelado, setValue, totalPagar]);

  useEffect(() => {
    const acuentaAmount = Number(acuentaValue) || 0;
    if (isDeposito) {
      setValue("deposito", acuentaAmount, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue("efectivo", 0, {
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }
    setValue("deposito", 0, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue("efectivo", acuentaAmount, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [acuentaValue, isDeposito, setValue]);

  useEffect(() => {
    if (isDeposito) {
      setValue("entidadBancaria", "", {
        shouldDirty: false,
        shouldTouch: false,
      });
      return;
    }
    setValue("entidadBancaria", isEfectivo ? "-" : "", {
      shouldDirty: false,
      shouldTouch: false,
    });
    setValue("nroOperacion", "", {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [isDeposito, isEfectivo, setValue]);

  const panelText = (() => {
    if (isCancelado) {
      return "El Pasajero No Tiene Deuda";
    }
    if (condicionKey.includes("cuenta")) {
      return hasDebt
        ? `El Pasajero Si Tiene Deuda S/ -${deudaAmount.toFixed(2)}`
        : "El Pasajero No Tiene Deuda";
    }
    if (condicionKey.includes("credit")) {
      return hasDebt
        ? `El Pasajero Si Tiene Deuda S/ ${deudaAmount.toFixed(2)}`
        : "El Pasajero No Tiene Deuda";
    }
    return hasDebt
      ? `El Pasajero Si Tiene Deuda S/ ${deudaAmount.toFixed(2)}`
      : "El Pasajero No Tiene Deuda";
  })();

  useEffect(() => {
    setValue("mensajePasajero", panelText.toUpperCase(), {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [panelText, setValue]);

  const toneClass = (() => {
    if (condicionKey.includes("cancel") || !hasDebt) {
      return "border-blue-800 bg-blue-700 text-white";
    }
    return "border-red-700 bg-red-600 text-white";
  })();

  const handleArrowNavigate = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();

    const current = event.currentTarget;
    const group =
      current.closest('[data-arrow-group="liquidacion"]') ??
      current.closest("form") ??
      current.ownerDocument;
    if (!group) return;

    const inputs = Array.from(
      group.querySelectorAll<HTMLInputElement>(
        '[data-arrow-input="liquidacion"]',
      ),
    ).filter((input) => !input.disabled);

    const index = inputs.indexOf(current);
    if (index === -1) return;
    const nextIndex = event.key === "ArrowDown" ? index + 1 : index - 1;
    inputs[nextIndex]?.focus();
  };

  return (
    <div className="lg:col-span-2 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
        <div className="col-span-3">
          <SelectControlled
            name="documentoCobranza"
            control={control}
            label="Tipo de Documento"
            options={documentoCobranzaOptions}
            size="small"
          />
        </div>
        <div className="col-span-1">
          <TextControlled
            name="nserie"
            disabled={watch("documentoCobranza") === "DOCUMENTO DE COBRANZA"}
            control={control}
            size="small"
          />
        </div>
        <div className="col-span-2">
          <TextControlled
            name="ndocumento"
            control={control}
            size="small"
            disabled={watch("documentoCobranza") === "DOCUMENTO DE COBRANZA"}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-2">
          Precio De Liquidación
        </p>
        <div
          className="border border-slate-300 rounded-lg overflow-hidden"
          data-arrow-group="liquidacion"
        >
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
                disabled={!isACuenta}
                className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                data-arrow-input="liquidacion"
                onKeyDown={handleArrowNavigate}
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
                data-arrow-input="liquidacion"
                onKeyDown={handleArrowNavigate}
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
                data-arrow-input="liquidacion"
                onKeyDown={handleArrowNavigate}
                {...register("cobroExtraDol", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-900">Medio Pago</p>
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Cobranza
          </span>
        </div>
        <div className="p-3">
          <div
            className={`grid grid-cols-1 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden ${
              isCredito ? "opacity-70" : ""
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
              <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                Fecha de adelanto
              </div>
              <div className="bg-white px-2 py-1">
                <DateInput
                  name="fechaPago"
                  control={control}
                  size="small"
                  disabled={isCredito}
                  InputLabelProps={{ shrink: false }}
                  inputProps={{ "aria-label": "Fecha de adelanto" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
              <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                Medio de pago
              </div>
              <div className="bg-white px-2 py-1">
                <SelectControlled
                  name="medioPago"
                  control={control}
                  options={medioPagoOptions}
                  size="small"
                  disabled={isCredito}
                  SelectProps={{ displayEmpty: true }}
                  inputProps={{ "aria-label": "Medio de pago" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
              <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                Entidad bancaria
              </div>
              <div className="bg-white px-2 py-1">
                <SelectControlled
                  name="entidadBancaria"
                  control={control}
                  options={
                    isDeposito
                      ? bancoOptions.filter((option) => option.value !== "-")
                      : bancoOptions
                  }
                  size="small"
                  disabled={isCredito || !isDeposito}
                  SelectProps={{ displayEmpty: true }}
                  inputProps={{ "aria-label": "Entidad bancaria" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
              <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                Nro Operacion
              </div>
              <div className="bg-white px-2 py-1">
                <TextControlled
                  name="nroOperacion"
                  control={control}
                  size="small"
                  disabled={isCredito || !isDeposito}
                  inputProps={{ "aria-label": "Nro Operacion" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
              <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                Deposito S/
              </div>
              <div className="bg-white px-2 py-1">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                  <TextControlled
                    name="deposito"
                    control={control}
                    type="number"
                    disabled
                    inputProps={{
                      min: 0,
                      step: "0.01",
                      "aria-label": "Deposito",
                    }}
                    size="small"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Efecti.
                  </span>
                  <TextControlled
                    name="efectivo"
                    control={control}
                    type="number"
                    disabled
                    inputProps={{
                      min: 0,
                      step: "0.01",
                      "aria-label": "Efectivo soles",
                    }}
                    size="small"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.6fr] gap-3">
        <div
          className={`rounded-lg border px-4 py-3 shadow-sm min-h-[88px] ${toneClass}`}
        >
          <p className="text-sm font-semibold italic leading-snug">
            {panelText}
          </p>
        </div>
        <textarea
          rows={3}
          className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Observaciones"
          {...register("notas")}
        />
      </div>
    </div>
  );
};
