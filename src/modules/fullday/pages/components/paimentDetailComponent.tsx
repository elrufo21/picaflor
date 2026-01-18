import {
  DateInput,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { useEffect } from "react";

const PaimentDetailComponent = ({ control, setValue, watch }) => {
  const documentoCobranzaOptions = [
    {
      label: "Documento de Cobranza",
      value: "DOCUMENTO COBRANZA",
    },
    { label: "Boleta", value: "BOLETA" },
    { label: "Factura", value: "FACTURA" },
  ];
  const medioPagoOptions = [
    { value: "", label: "(SELECCIONE)" },
    { value: "EFECTIVO", label: "Efectivo" },
    { value: "DEPOSITO", label: "Deposito" },
    { value: "YAPE", label: "Yape" },
  ];
  const bancoOptions = [
    { value: "", label: "(SELECCIONE)" },
    { value: `-`, label: "-" },
    { value: "BCP", label: "BCP" },
    { value: "BBVA", label: "BBVA" },
    { value: "INTERBANK", label: "Interbank" },
  ];

  const medioPago = watch("medioPago");
  const condicion = watch("condicion.value");
  const total = watch("precioTotal");
  const acuenta = watch("acuenta");

  useEffect(() => {
    if (condicion === "CANCELADO") {
      setValue("acuenta", total);
    }
    if (condicion === "ACUENTA" || condicion == "CREDITO") {
      //  setValue("acuenta", 0);
      //setValue("deposito", 0);
      //setValue("efectivo", 0);
    }
    if (medioPago === "EFECTIVO" && condicion === "CANCELADO") {
      setValue("efectivo", total || 0);

      setValue("deposito", 0);

      setValue("entidadBancaria", "-");
      setValue("nroOperacion", "-");
    }

    if (medioPago === "DEPOSITO" && condicion == "CANCELADO") {
      setValue("efectivo", 0);
      setValue("entidadBancaria", null);
      setValue("deposito", total);
    }
  }, [medioPago, condicion, total, setValue]);
  useEffect(() => {
    setValue("saldo", Number(watch("precioTotal")) - Number(acuenta));
  }, [acuenta]);

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
            disabled={watch("documentoCobranza" === "DOCUMENTO COBRANZA")}
            control={control}
            size="small"
          />
        </div>
        <div className="col-span-2">
          <TextControlled
            name="ndocumento"
            disabled={watch("documentoCobranza" === "DOCUMENTO COBRANZA")}
            control={control}
            size="small"
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
              {watch("precioTotal")}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
              ACUENTA:
            </div>
            <div className="px-3 py-2">
              <TextControlled
                name="acuenta"
                control={control}
                onChange={(e) => {
                  if (
                    watch("medioPago") === "DEPOSITO" &&
                    condicion == "ACUENTA"
                  ) {
                    setValue("efectivo", 0);
                    setValue("entidadBancaria", null);
                    setValue("deposito", e.target.value);
                    if (
                      watch("medioPago") === "EFECTIVO" &&
                      condicion == "ACUENTA"
                    ) {
                      setValue("deposito", 0);
                      setValue("entidadBancaria", null);
                      setValue("efectivo", e.target.value);
                    }
                  }
                }}
                size="small"
                className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
              SALDO S/ :
            </div>
            <div className="px-3 py-2 text-right font-semibold">
              {/*saldo.toFixed(2)*/}
              {watch("saldo")}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-50 text-amber-900 font-semibold px-3 py-2 col-span-2">
              Cobro Extra Sol:
            </div>
            <div className="px-3 py-2">
              <TextControlled
                name="precioExtra"
                control={control}
                size="small"
                className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                // onKeyDown={handleArrowNavigate}
                /*{...register("cobroExtraDol", {
                                    valueAsNumber: true,
                                  })}*/
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
            className={`grid grid-cols-1 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden`}
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
                  //disabled={isCredito}
                  InputLabelProps={{ shrink: false }}
                  inputProps={{
                    "aria-label": "Fecha de adelanto",
                  }}
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
                  /* onChange={(e) => {
                    console.log("eeeeeee", e.target.value);
                    if (e.target.value === "") {
                      setValue("deposito", 0);
                      setValue("efectivo", 0);
                    }
                    if (e.target.value === "DEPOSITO") {
                      setValue("deposito", acuenta);
                      setValue("efectivo", 0);
                    }
                    if (e.target.value === "EFECTIVO") {
                      setValue("efectivo", acuenta);
                      setValue("deposito", 0);
                    }
                  }}*/
                  size="small"
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
                  options={bancoOptions}
                  size="small"
                  //disabled={isCredito || !isDeposito}
                  SelectProps={{ displayEmpty: true }}
                  inputProps={{
                    "aria-label": "Entidad bancaria",
                  }}
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
                  // disabled={isCredito || !isDeposito}
                  inputProps={{
                    "aria-label": "Nro Operacion",
                  }}
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
        <div className={`rounded-lg border px-4 py-3 shadow-sm min-h-[88px] `}>
          <p className="text-sm font-semibold italic leading-snug"></p>
        </div>
        <textarea
          rows={3}
          className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Observaciones"
        />
      </div>
    </div>
  );
};
export default PaimentDetailComponent;
