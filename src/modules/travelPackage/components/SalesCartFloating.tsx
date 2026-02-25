import { CreditCard, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import type { TravelPackageFormState } from "../types/travelPackage.types";
import { getTravelCurrencySymbol } from "../constants/travelPackage.constants";

type Props = {
  form: TravelPackageFormState;
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

const SalesCartFloating = ({ form, onUpdateField }: Props) => {
  const [open, setOpen] = useState(true);

  const paxCount = Math.max(0, Number(form.cantPax || 0));

  const baseItinerary = useMemo(() => {
    return roundCurrency(
      form.itinerario.reduce((acc, day) => {
        const dayBase = Number(day.precioUnitario || 0) * paxCount;
        const dayRows = day.actividades.reduce(
          (sum, row) => sum + Number(row.subtotal || 0),
          0,
        );
        return acc + dayBase + dayRows;
      }, 0),
    );
  }, [form.itinerario, paxCount]);

  const igv = useMemo(() => {
    if (["BOLETA", "FACTURA"].includes(form.documentoCobranza)) {
      return roundCurrency(baseItinerary * 0.18);
    }
    return 0;
  }, [baseItinerary, form.documentoCobranza]);

  const cargosExtra = useMemo(() => {
    const totalSinTarjeta = baseItinerary + igv;
    return form.medioPago === "TARJETA"
      ? roundCurrency(totalSinTarjeta * 0.05)
      : 0;
  }, [baseItinerary, igv, form.medioPago]);

  const totalFinal = roundCurrency(baseItinerary + igv + cargosExtra);
  const extraAplicado =
    form.moneda === "SOLES"
      ? Number(form.precioExtraSoles || 0)
      : Number(form.precioExtraDolares || 0);
  const totalConExtra = roundCurrency(totalFinal + extraAplicado);

  useEffect(() => {
    if (form.igv !== igv) onUpdateField("igv", igv);
    if (form.cargosExtra !== cargosExtra) onUpdateField("cargosExtra", cargosExtra);
    if (form.totalGeneral !== totalFinal) onUpdateField("totalGeneral", totalFinal);
  }, [igv, cargosExtra, totalFinal, form.igv, form.cargosExtra, form.totalGeneral, onUpdateField]);

  useEffect(() => {
    if (form.condicionPago === "CANCELADO") {
      if (form.acuenta !== totalConExtra) onUpdateField("acuenta", totalConExtra);
    }

    if (form.condicionPago === "CREDITO") {
      if (form.acuenta !== 0) onUpdateField("acuenta", 0);
      if (form.medioPago !== "-") onUpdateField("medioPago", "-");
      if (form.efectivo !== 0) onUpdateField("efectivo", 0);
      if (form.deposito !== 0) onUpdateField("deposito", 0);
    }
  }, [form.condicionPago, form.acuenta, form.medioPago, form.efectivo, form.deposito, totalConExtra, onUpdateField]);

  useEffect(() => {
    if (form.medioPago === "EFECTIVO") {
      if (form.entidadBancaria !== "-") onUpdateField("entidadBancaria", "-");
      if (form.nroOperacion !== "") onUpdateField("nroOperacion", "");
      if (form.efectivo !== form.acuenta) onUpdateField("efectivo", Number(form.acuenta || 0));
      if (form.deposito !== 0) onUpdateField("deposito", 0);
    }

    if (["DEPOSITO", "YAPE", "TARJETA"].includes(form.medioPago)) {
      if (form.entidadBancaria === "-") onUpdateField("entidadBancaria", "");
      if (form.deposito !== form.acuenta) onUpdateField("deposito", Number(form.acuenta || 0));
      if (form.efectivo !== 0) onUpdateField("efectivo", 0);
    }

    if (form.medioPago === "" || form.medioPago === "-") {
      if (form.deposito !== 0) onUpdateField("deposito", 0);
      if (form.efectivo !== 0) onUpdateField("efectivo", 0);
    }
  }, [form.medioPago, form.acuenta, form.entidadBancaria, form.nroOperacion, form.deposito, form.efectivo, onUpdateField]);

  useEffect(() => {
    if (form.moneda === "SOLES" && form.precioExtraDolares !== 0) {
      onUpdateField("precioExtraDolares", 0);
    }
    if (form.moneda === "DOLARES" && form.precioExtraSoles !== 0) {
      onUpdateField("precioExtraSoles", 0);
    }
  }, [form.moneda, form.precioExtraSoles, form.precioExtraDolares, onUpdateField]);

  useEffect(() => {
    const saldo = roundCurrency(totalConExtra - Number(form.acuenta || 0));
    if (form.saldo !== saldo) onUpdateField("saldo", saldo);

    const symbol = getTravelCurrencySymbol(form.moneda);
    const message =
      form.condicionPago === "CANCELADO"
        ? "EL PASAJERO NO TIENE DEUDA."
        : `EL PASAJERO SI TIENE DEUDA ${symbol} ${formatCurrency(saldo)}`;

    if (form.mensajePasajero !== message) onUpdateField("mensajePasajero", message);
  }, [form.acuenta, form.condicionPago, form.moneda, form.mensajePasajero, form.saldo, totalConExtra, onUpdateField]);

  const currencySymbol = getTravelCurrencySymbol(form.moneda);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed right-4 top-24 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-white shadow-lg hover:bg-emerald-700"
      >
        <ShoppingCart className="h-4 w-4" />
        Carrito
      </button>

      {open && (
        <aside className="fixed right-4 top-36 z-40 w-[360px] max-h-[calc(100vh-160px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">Carrito de venta</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Moneda</label>
              <select
                className="rounded-md border border-slate-300 px-2 py-1"
                value={form.moneda}
                onChange={(e) => onUpdateField("moneda", e.target.value as "SOLES" | "DOLARES")}
              >
                <option value="SOLES">Soles</option>
                <option value="DOLARES">Dolares</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Tipo Documento</label>
              <select
                className="rounded-md border border-slate-300 px-2 py-1"
                value={form.documentoCobranza}
                onChange={(e) => onUpdateField("documentoCobranza", e.target.value)}
              >
                {documentoCobranzaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Condicion</label>
              <select
                className="rounded-md border border-slate-300 px-2 py-1"
                value={form.condicionPago}
                onChange={(e) => onUpdateField("condicionPago", e.target.value)}
              >
                <option value="CANCELADO">Cancelado</option>
                <option value="ACUENTA">A Cuenta</option>
                <option value="CREDITO">Credito</option>
              </select>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex justify-between"><span>Base itinerario</span><span>{currencySymbol} {formatCurrency(baseItinerary)}</span></div>
              <div className="flex justify-between"><span>IGV</span><span>{currencySymbol} {formatCurrency(igv)}</span></div>
              <div className="flex justify-between"><span>Cargo extra</span><span>{currencySymbol} {formatCurrency(cargosExtra)}</span></div>
              <div className="mt-2 border-t border-slate-300 pt-2 flex justify-between font-semibold"><span>Total</span><span>{currencySymbol} {formatCurrency(totalFinal)}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Cobro Extra Sol</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded-md border border-slate-300 px-2 py-1 text-right"
                value={form.precioExtraSoles || ""}
                disabled={form.moneda !== "SOLES"}
                onChange={(e) => onUpdateField("precioExtraSoles", roundCurrency(Number(e.target.value || 0)))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Cobro Extra Dol</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded-md border border-slate-300 px-2 py-1 text-right"
                value={form.precioExtraDolares || ""}
                disabled={form.moneda !== "DOLARES"}
                onChange={(e) => onUpdateField("precioExtraDolares", roundCurrency(Number(e.target.value || 0)))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Acuenta</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded-md border border-slate-300 px-2 py-1 text-right"
                disabled={form.condicionPago !== "ACUENTA"}
                value={form.acuenta || ""}
                onChange={(e) => {
                  const value = Math.min(totalConExtra, Number(e.target.value || 0));
                  onUpdateField("acuenta", roundCurrency(value));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Medio de pago</label>
              <select
                className="rounded-md border border-slate-300 px-2 py-1"
                value={form.medioPago}
                disabled={form.condicionPago === "CREDITO"}
                onChange={(e) => onUpdateField("medioPago", e.target.value)}
              >
                {medioPagoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Entidad bancaria</label>
              <select
                className="rounded-md border border-slate-300 px-2 py-1"
                value={form.entidadBancaria}
                disabled={!(["DEPOSITO", "YAPE", "TARJETA"].includes(form.medioPago)) || form.condicionPago === "CREDITO"}
                onChange={(e) => onUpdateField("entidadBancaria", e.target.value)}
              >
                {bancoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">Nro Operacion</label>
              <input
                className="rounded-md border border-slate-300 px-2 py-1"
                value={form.nroOperacion}
                disabled={!(["DEPOSITO", "YAPE", "TARJETA"].includes(form.medioPago)) || form.entidadBancaria === "" || form.entidadBancaria === "-"}
                onChange={(e) => onUpdateField("nroOperacion", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-right">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                Dep: {currencySymbol} {formatCurrency(form.deposito || 0)}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                Efec: {currencySymbol} {formatCurrency(form.efectivo || 0)}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              {form.mensajePasajero}
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-right font-semibold text-emerald-900">
              Saldo: {currencySymbol} {formatCurrency(form.saldo || 0)}
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default SalesCartFloating;
