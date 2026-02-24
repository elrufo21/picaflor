import { CreditCard, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import type { TravelPackageFormState } from "../types/travelPackage.types";

type Props = {
  form: TravelPackageFormState;
  open: boolean;
  onClose: () => void;
  onUpdateField: <K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => void;
};

const documentoCobranzaOptions = [
  { label: "Documento de Cobranza", value: "DOCUMENTO COBRANZA" },
  { label: "Boleta", value: "BOLETA" },
  { label: "Factura", value: "FACTURA" },
];

const medioPagoOptions = [
  { value: "", label: "(SELECCIONE)" },
  { value: "-", label: "-" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "DEPOSITO", label: "Deposito" },
  { value: "YAPE", label: "Yape" },
  { value: "TARJETA", label: "Tarjeta" },
];

const bancoOptions = [
  { value: "", label: "(SELECCIONE)" },
  { value: "-", label: "-" },
  { value: "BCP", label: "BCP" },
  { value: "BBVA", label: "BBVA" },
  { value: "INTERBANK", label: "Interbank" },
];

const PaymentDetailFloating = ({
  form,
  open,
  onClose,
  onUpdateField,
}: Props) => {
  const setIfChanged = <K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => {
    if (form[key] !== value) onUpdateField(key, value);
  };

  const paxCount = Math.max(0, Number(form.cantPax || 0));
  const currencySymbol = form.moneda === "DOLARES" ? "USD$" : "S/";

  const base = useMemo(
    () =>
      roundCurrency(
        form.itinerario.reduce((acc, day) => {
          const dayRows = day.actividades.reduce(
            (sum, row) => sum + Number(row.subtotal || 0),
            0,
          );
          return acc + dayRows;
        }, 0) + Number(form.movilidadPrecio || 0),
      ),
    [form.itinerario, paxCount, form.movilidadPrecio],
  );

  const igv = useMemo(() => {
    if (["BOLETA", "FACTURA"].includes(form.documentoCobranza)) {
      return roundCurrency(base * 0.18);
    }
    return 0;
  }, [base, form.documentoCobranza]);

  const cargosExtra = useMemo(() => {
    const totalSinTarjeta = base + igv;
    return form.medioPago === "TARJETA"
      ? roundCurrency(totalSinTarjeta * 0.05)
      : 0;
  }, [base, igv, form.medioPago]);

  const totalFinal = roundCurrency(base + igv + cargosExtra);

  const extraAplicado =
    form.moneda === "SOLES"
      ? Number(form.precioExtraSoles ?? 0)
      : Number(form.precioExtraDolares ?? 0);
  const totalSaldo = roundCurrency(totalFinal + extraAplicado);

  useEffect(() => {
    setIfChanged("igv", igv);
    setIfChanged("cargosExtra", cargosExtra);
    setIfChanged("totalGeneral", totalFinal);
  }, [igv, cargosExtra, totalFinal]);

  useEffect(() => {
    if (form.condicionPago === "CANCELADO") {
      setIfChanged("acuenta", roundCurrency(totalFinal));
    }

    if (form.condicionPago === "CREDITO") {
      setIfChanged("acuenta", 0);
      setIfChanged("deposito", 0);
      setIfChanged("efectivo", 0);
      setIfChanged("medioPago", "-");
    }

    if (form.condicionPago === "ACUENTA") {
      setIfChanged("deposito", 0);
      setIfChanged("efectivo", 0);
    }
  }, [form.condicionPago, totalFinal]);

  useEffect(() => {
    if (form.medioPago === "EFECTIVO") {
      setIfChanged("entidadBancaria", "-");
      setIfChanged("nroOperacion", "");
      setIfChanged("efectivo", Number(form.acuenta || 0));
      setIfChanged("deposito", 0);
    }

    if (["DEPOSITO", "YAPE", "TARJETA"].includes(form.medioPago)) {
      if (form.entidadBancaria === "-") setIfChanged("entidadBancaria", "");
      setIfChanged("efectivo", 0);
      setIfChanged("deposito", Number(form.acuenta || 0));
    }

    if (form.medioPago === "" || form.medioPago === "-") {
      setIfChanged("efectivo", 0);
      setIfChanged("deposito", 0);
    }
  }, [form.medioPago, form.acuenta, form.entidadBancaria]);

  useEffect(() => {
    if (form.moneda === "SOLES" && form.precioExtraDolares !== 0) {
      setIfChanged("precioExtraDolares", 0);
    }
    if (form.moneda === "DOLARES" && form.precioExtraSoles !== 0) {
      setIfChanged("precioExtraSoles", 0);
    }
  }, [form.moneda, form.precioExtraSoles, form.precioExtraDolares]);

  useEffect(() => {
    setIfChanged(
      "saldo",
      roundCurrency(totalSaldo - Number(form.acuenta ?? 0)),
    );
  }, [form.acuenta, totalSaldo]);

  useEffect(() => {
    const message =
      form.condicionPago === "CANCELADO"
        ? "EL PASAJERO NO TIENE DEUDA."
        : form.condicionPago === "CREDITO"
          ? `EL PASAJERO SI TIENE DEUDA ${currencySymbol} ${formatCurrency(totalSaldo)}`
          : `EL PASAJERO SI TIENE DEUDA ${currencySymbol} ${formatCurrency(form.saldo ?? 0)}`;

    setIfChanged("mensajePasajero", message);
  }, [form.condicionPago, currencySymbol, totalSaldo, form.saldo]);

  return (
    <>
      {open && (
        <aside className="fixed right-4 top-28 z-40 w-[390px] max-h-[calc(100vh-150px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">
                Detalle del Pago
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4 text-sm">
            <div className="grid grid-cols-6 gap-2.5">
              <div className="col-span-3">
                <label className="mb-1 block text-xs text-slate-600">
                  Tipo de Documento
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={form.documentoCobranza}
                  onChange={(e) =>
                    onUpdateField("documentoCobranza", e.target.value)
                  }
                >
                  {documentoCobranzaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="mb-1 block text-xs text-slate-600">
                  Serie
                </label>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={form.nserie}
                  maxLength={4}
                  disabled={form.documentoCobranza === "DOCUMENTO COBRANZA"}
                  onChange={(e) =>
                    onUpdateField("nserie", e.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-slate-600">
                  N Documento
                </label>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={form.ndocumento}
                  disabled={form.documentoCobranza === "DOCUMENTO COBRANZA"}
                  onChange={(e) => onUpdateField("ndocumento", e.target.value)}
                />
              </div>
            </div>

            <div
              className="rounded-lg border border-slate-300 overflow-hidden"
              data-arrow-group="liquidacion"
            >
              <div className="grid grid-cols-3 border-b border-slate-300">
                <div className="bg-amber-50 text-amber-900 font-semibold px-3 py-2 col-span-2">
                  MOVILIDAD {currencySymbol} :
                </div>
                <div className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(form.movilidadPrecio ?? 0)}
                </div>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-300">
                <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
                  TOTAL A PAGAR {currencySymbol} :
                </div>
                <div className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(totalFinal)}
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
                    className="w-full rounded border border-slate-300 px-2 py-1 text-right disabled:bg-slate-100"
                    disabled={form.condicionPago !== "ACUENTA"}
                    value={form.acuenta || ""}
                    onChange={(e) => {
                      const ingresado = Number(e.target.value || 0);
                      const capped =
                        totalFinal > 0 && ingresado > totalFinal
                          ? totalFinal
                          : ingresado;
                      onUpdateField("acuenta", roundCurrency(capped));
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-300">
                <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
                  SALDO {currencySymbol} :
                </div>
                <div className="px-3 py-2 text-right font-semibold">
                  {formatCurrency(form.saldo ?? 0)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
              <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900">
                  Medio Pago
                </p>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  Cobranza
                </span>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-1 divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
                    <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                      Moneda
                    </div>
                    <div className="bg-white px-2 py-1">
                      <select
                        className="w-full rounded border border-slate-300 px-2 py-1"
                        value={form.moneda}
                        onChange={(e) =>
                          onUpdateField(
                            "moneda",
                            e.target.value as "SOLES" | "DOLARES",
                          )
                        }
                      >
                        <option value="SOLES">SOLES</option>
                        <option value="DOLARES">DOLARES</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
                    <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                      Condicion
                    </div>
                    <div className="bg-white px-2 py-1">
                      <select
                        className="w-full rounded border border-slate-300 px-2 py-1"
                        value={form.condicionPago}
                        onChange={(e) =>
                          onUpdateField("condicionPago", e.target.value)
                        }
                      >
                        <option value="CANCELADO">CANCELADO</option>
                        <option value="ACUENTA">ACUENTA</option>
                        <option value="CREDITO">CREDITO</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
                    <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                      Medio de pago
                    </div>
                    <div className="bg-white px-2 py-1">
                      <select
                        className="w-full rounded border border-slate-300 px-2 py-1"
                        disabled={form.condicionPago === "CREDITO"}
                        value={form.medioPago}
                        onChange={(e) =>
                          onUpdateField("medioPago", e.target.value)
                        }
                      >
                        {medioPagoOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
                    <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                      Entidad bancaria
                    </div>
                    <div className="bg-white px-2 py-1">
                      <select
                        className="w-full rounded border border-slate-300 px-2 py-1"
                        disabled={
                          form.condicionPago === "CREDITO" ||
                          !["DEPOSITO", "YAPE", "TARJETA"].includes(
                            form.medioPago,
                          )
                        }
                        value={form.entidadBancaria}
                        onChange={(e) =>
                          onUpdateField("entidadBancaria", e.target.value)
                        }
                      >
                        {bancoOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
                    <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                      Nro Operacion
                    </div>
                    <div className="bg-white px-2 py-1">
                      <input
                        className="w-full rounded border border-slate-300 px-2 py-1"
                        disabled={
                          form.condicionPago === "CREDITO" ||
                          !["DEPOSITO", "YAPE", "TARJETA"].includes(
                            form.medioPago,
                          ) ||
                          !form.entidadBancaria ||
                          form.entidadBancaria === "-"
                        }
                        value={form.nroOperacion}
                        onChange={(e) =>
                          onUpdateField("nroOperacion", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center">
                    <div className="flex items-center bg-blue-600/90 text-white text-xs font-semibold px-3 py-2">
                      Deposito {currencySymbol}
                    </div>
                    <div className="bg-white px-2 py-1">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_auto_1.4fr] items-center">
                        <input
                          disabled
                          className="w-full rounded border border-slate-300 px-2 py-1 text-right bg-slate-100"
                          value={formatCurrency(form.deposito || 0)}
                        />
                        <span className="text-xs font-semibold text-slate-600">
                          Efec.
                        </span>
                        <input
                          disabled
                          className="w-full rounded border border-slate-300 px-2 py-1 text-right bg-slate-100"
                          value={formatCurrency(form.efectivo || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white px-2 py-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                        <p className="text-xs font-semibold text-emerald-700">
                          IGV
                        </p>
                        <p className="text-right font-bold text-emerald-900">
                          {formatCurrency(form.igv ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <p className="text-xs font-semibold text-amber-700">
                          Cargo extra
                        </p>
                        <p className="text-right font-bold text-amber-900">
                          {formatCurrency(form.cargosExtra ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div
                className={`rounded-lg border ${
                  form.condicionPago === "CANCELADO"
                    ? "bg-[#305496]"
                    : "bg-[#C00000]"
                } px-4 py-2 shadow-sm min-h-[56px] flex items-center`}
              >
                <p className="text-sm font-semibold italic text-white leading-tight">
                  {form.mensajePasajero}
                </p>
              </div>

              <textarea
                rows={2}
                className="w-full min-h-[84px] rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                placeholder="Observaciones"
                value={form.observaciones}
                onChange={(e) =>
                  onUpdateField("observaciones", e.target.value.toUpperCase())
                }
              />
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default PaymentDetailFloating;
