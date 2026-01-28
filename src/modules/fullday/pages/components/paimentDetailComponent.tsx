import {
  DateInput,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import { usePackageStore } from "../../store/fulldayStore";

const PaimentDetailComponent = ({ control, setValue, watch }) => {
  const { isEditing } = usePackageStore();
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
    { value: "-", label: "-" },
    { value: "EFECTIVO", label: "Efectivo" },
    { value: "DEPOSITO", label: "Deposito" },
    { value: "YAPE", label: "Yape" },
  ];
  const bancoOptions = [
    { value: "", label: "(SELECCIONE)" },
    { value: "-", label: "-" },
    { value: "BCP", label: "BCP" },
    { value: "BBVA", label: "BBVA" },
    { value: "INTERBANK", label: "Interbank" },
  ];

  const medioPago = watch("medioPago");
  const condicion = watch("condicion.value");
  const total = watch("precioTotal");
  const precioTotal = Number(total ?? 0);
  const acuenta = watch("acuenta");

  useEffect(() => {
    if (isEditing === false) return;
    if (condicion === "CANCELADO") {
      setValue("acuenta", roundCurrency(total));
    }
    if (condicion === "CREDITO") {
      // en crédito sí tiene sentido limpiar todo
      setValue("acuenta", 0);
      setValue("deposito", 0);
      setValue("efectivo", 0);
    }

    if (medioPago === "EFECTIVO") {
      if (condicion === "CANCELADO") {
        setValue("efectivo", roundCurrency(total || 0));
        setValue("deposito", 0);
        setValue("nroOperacion", "");
      }
    }

    if (medioPago === "DEPOSITO" && condicion == "CANCELADO") {
      setValue("efectivo", 0);
      setValue("deposito", roundCurrency(total));
    }
  }, [medioPago, condicion, total, setValue]);
  useEffect(() => {
    if (condicion === "ACUENTA") {
      setValue("deposito", 0);
      setValue("efectivo", 0);
    }
  }, [medioPago, condicion, setValue]);
  useEffect(() => {
    if (!isEditing) return;

    if (medioPago === "EFECTIVO") {
      setValue("entidadBancaria", "-");
      setValue("nroOperacion", "");
    }

    if (medioPago === "DEPOSITO" && watch("entidadBancaria") === "-") {
      setValue("entidadBancaria", "");
    }
  }, [medioPago, isEditing]);

  useEffect(() => {}, [condicion, total, acuenta]);
  useEffect(() => {
    setValue(
      "saldo",
      roundCurrency(Number(watch("precioTotal") ?? 0) - Number(acuenta ?? 0)),
    );
  }, [acuenta]);

  const buildMessagePassenger = ({ value }: { value: string }) => {
    let message;
    if (value == "CANCELADO") {
      message = "El pasajero no tiene deuda.";
    } else if (value == "CREDITO") {
      message =
        "El pasajero si tiene deuda S/ " +
        formatCurrency(watch("precioTotal") ?? 0);
    } else {
      message =
        "El pasajero si tiene deuda S/" + formatCurrency(watch("saldo") ?? 0);
    }
    setValue("mensajePasajero", message);
  };
  useEffect(() => {
    if (condicion === "ACUENTA") {
      setValue("saldo", roundCurrency(total - acuenta));
    }
    if (condicion === "CREDITO") {
      setValue("medioPago", "-");
    }
    buildMessagePassenger({ value: condicion });
  }, [condicion, total, acuenta]);

  useEffect(() => {
    if (medioPago === "EFECTIVO") {
      setValue("efectivo", acuenta);
    }
    if (medioPago === "DEPOSITO" || medioPago === "YAPE") {
      setValue("efectivo", 0);
      setValue("deposito", acuenta);
    }
    if (medioPago === "-" || medioPago === "") {
      setValue("efectivo", 0);
      setValue("deposito", 0);
    }
  }, [acuenta, medioPago]);
  return (
    <div className="lg:col-span-2 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
        <div className="col-span-3">
          <SelectControlled
            name="documentoCobranza"
            control={control}
            label="Tipo de Documento"
            options={documentoCobranzaOptions}
            disabled={!isEditing}
            size="small"
          />
        </div>
        <div className="col-span-1">
          <TextControlled
            name="nserie"
            disabled={watch("documentoCobranza") === "DOCUMENTO COBRANZA"}
            control={control}
            size="small"
          />
        </div>
        <div className="col-span-2">
          <TextControlled
            name="ndocumento"
            disabled={watch("documentoCobranza") === "DOCUMENTO COBRANZA"}
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
              {formatCurrency(watch("precioTotal") ?? 0)}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
              ACUENTA:
            </div>
            <div className="px-3 py-2">
              <TextControlled
                name="acuenta"
                type="number"
                control={control}
                disabled={condicion != "ACUENTA"}
                disableHistory
                formatter={condicion != "ACUENTA" ? formatCurrency : undefined}
                displayZeroAsEmpty={condicion == "ACUENTA"}
                inputProps={{ style: { textAlign: "right" } }}
                onChange={(e) => {
                  const ingresado = Number(e.target.value || 0);
                  if (precioTotal > 0 && ingresado > precioTotal) {
                    setValue("acuenta", roundCurrency(precioTotal));
                    return;
                  }
                  if (
                    watch("medioPago") === "DEPOSITO" &&
                    condicion == "ACUENTA"
                  ) {
                    setValue("efectivo", 0);
                    //  setValue("entidadBancaria", null);
                    setValue("deposito", roundCurrency(e.target.value));
                  }
                  if (
                    watch("medioPago") === "EFECTIVO" &&
                    condicion == "ACUENTA"
                  ) {
                    setValue("deposito", 0);
                    //   setValue("entidadBancaria", null);
                    setValue("efectivo", roundCurrency(e.target.value));
                  }
                }}
                size="small"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
              SALDO S/ :
            </div>
            <div className="px-3 py-2 text-right font-semibold">
              {formatCurrency(watch("saldo") ?? 0)}
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-slate-300">
            <div className="bg-amber-50 text-amber-900 font-semibold px-3 py-2 col-span-2">
              Cobro Extra Sol:
            </div>
            <div className="px-3 py-2">
              <TextControlled
                name="precioExtraSoles"
                formatter={!isEditing ? formatCurrency : undefined}
                displayZeroAsEmpty={isEditing}
                inputProps={{ style: { textAlign: "right" } }}
                control={control}
                type="number"
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
              <TextControlled
                formatter={!isEditing ? formatCurrency : undefined}
                displayZeroAsEmpty={isEditing}
                type="number"
                inputProps={{ style: { textAlign: "right" } }}
                name="precioExtraDolares"
                control={control}
                size="small"
                className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  name="fechaAdelanto"
                  disabled={condicion == "CREDITO"}
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
                  disabled={condicion == "CREDITO" || !isEditing}
                  options={medioPagoOptions}
                  SelectProps={{ displayEmpty: true }}
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
                  disabled={
                    condicion === "CREDITO" ||
                    !["DEPOSITO", "YAPE"].includes(medioPago) ||
                    !isEditing
                  }
                  control={control}
                  options={bancoOptions}
                  size="small"
                  SelectProps={{ displayEmpty: true }}
                  inputProps={{
                    "aria-label": "Entidad bancaria",
                  }}
                  data-focus-next="#nro-operacion"
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
                  id="nro-operacion"
                  disabled={
                    condicion === "CREDITO" ||
                    !["DEPOSITO", "YAPE"].includes(medioPago)
                  }
                  disableHistory
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_auto_1.4fr] items-center">
                  <TextControlled
                    name="deposito"
                    control={control}
                    disabled
                    inputProps={{
                      min: 0,
                      step: "0.01",
                      "aria-label": "Deposito",
                    }}
                    size="small"
                    formatter={formatCurrency}
                    className="w-full"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Efec.
                  </span>
                  <TextControlled
                    name="efectivo"
                    control={control}
                    disabled
                    inputProps={{
                      min: 0,
                      step: "0.01",
                      "aria-label": "Efectivo soles",
                    }}
                    size="small"
                    formatter={formatCurrency}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.6fr] gap-3">
        <div
          className={`rounded-lg border ${condicion === "CANCELADO" ? "bg-[#305496]" : "bg-[#C00000]"} px-4 py-3 shadow-sm min-h-[88px] `}
        >
          <p className={`text-lg font-semibold italic text-white leading-snug`}>
            {watch("mensajePasajero")}
          </p>
        </div>
        <Controller
          name="observaciones"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={3}
              className="w-full min-h-[88px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Observaciones"
            />
          )}
        />
      </div>
    </div>
  );
};
export default PaimentDetailComponent;
