import { useMemo } from "react";
import { Calculator } from "lucide-react";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import {
  CONDICION_PAGO_OPTIONS,
  MEDIO_PAGO_OPTIONS,
  getEntidadBancariaOptions,
  getTravelCurrencySymbol,
} from "../constants/travelPackage.constants";
import {
  calculateTravelPackageCharges,
  getBillablePassengerCount,
} from "../utils/liquidationCalculator";
import type { TravelPackageFormState } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

type Props = {
  form: TravelPackageFormState;
  onUpdateField: <K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => void;
};

type LiquidationRow = {
  key: string;
  roomType: string;
  roomPrice: number;
  quantity: number;
};

type PassengerLiquidationRow = {
  key: string;
  passengerType: string;
  quantity: number;
  total: number;
  unit: number;
};

const LiquidationSection = ({ form, onUpdateField }: Props) => {
  const currencySymbol = getTravelCurrencySymbol(form.moneda);
  const paxCount = useMemo(() => getBillablePassengerCount(form), [form]);

  const passengerRows = useMemo<PassengerLiquidationRow[]>(() => {
    const groupedByType = new Map<
      string,
      { passengerType: string; quantity: number; total: number }
    >();

    (form.pasajeros ?? []).forEach((passenger) => {
      const passengerType =
        String(passenger.tipoPasajero ?? "")
          .trim()
          .toUpperCase() || "GENERAL";
      const totalTipoPasajero = Math.max(
        0,
        Number(String(passenger.totalTipoPasajero ?? "").trim() || 0),
      );
      const passengerTotal =
        passengerType === "LIBERADO" ? 0 : roundCurrency(totalTipoPasajero);
      const current = groupedByType.get(passengerType);

      if (current) {
        current.quantity += 1;
        current.total = roundCurrency(current.total + passengerTotal);
        return;
      }

      groupedByType.set(passengerType, {
        passengerType,
        quantity: 1,
        total: passengerTotal,
      });
    });

    return Array.from(groupedByType.entries())
      .map(([key, value]) => ({
        key,
        passengerType: value.passengerType,
        quantity: value.quantity,
        total: roundCurrency(value.total),
        unit:
          value.quantity > 0 ? roundCurrency(value.total / value.quantity) : 0,
      }))
      .sort((a, b) => a.passengerType.localeCompare(b.passengerType));
  }, [form.pasajeros]);

  const passengerBaseTotal = useMemo(
    () =>
      roundCurrency(
        passengerRows.reduce((sum, row) => sum + Number(row.total || 0), 0),
      ),
    [passengerRows],
  );

  const liquidationRows = useMemo<LiquidationRow[]>(() => {
    if (form.incluyeHotel) {
      const groupedByType = new Map<
        string,
        { roomType: string; unitPriceSum: number; quantity: number }
      >();

      (form.hotelesContratados ?? []).forEach((hotelRow) => {
        (hotelRow.habitaciones ?? []).forEach((room) => {
          const roomType = String(room.tipo ?? "").trim();
          if (!roomType) return;
          const quantity = Math.max(0, Number(room.cantidad || 0));
          if (quantity <= 0) return;
          const roomPrice = roundCurrency(Number(room.precio || 0));
          const key = roomType.toUpperCase();
          const current = groupedByType.get(key);

          if (current) {
            // Unitario unificado: suma de precios del mismo tipo entre hoteles.
            current.unitPriceSum = roundCurrency(
              current.unitPriceSum + roomPrice,
            );
            // Cantidad unificada: la cantidad del paquete (no suma por hotel).
            current.quantity = Math.max(current.quantity, quantity);
            return;
          }

          groupedByType.set(key, {
            roomType,
            unitPriceSum: roomPrice,
            quantity,
          });
        });
      });

      return Array.from(groupedByType.entries())
        .map(([key, value]) => ({
          key,
          roomType: value.roomType,
          roomPrice: value.unitPriceSum,
          quantity: value.quantity,
        }))
        .sort((a, b) => a.roomType.localeCompare(b.roomType));
    }

    return [];
  }, [form.hotelesContratados, form.incluyeHotel]);

  const destinosLabel = useMemo(() => {
    const values = (form.destinos ?? [])
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    return values.length ? values.join(" - ") : "SIN DESTINOS";
  }, [form.destinos]);

  const activitiesTotal = useMemo(
    () =>
      roundCurrency(
        (form.itinerario ?? []).reduce((acc, day) => {
          const dayActivitiesSubtotal = (day.actividades ?? []).reduce(
            (sum, activity) => sum + Number(activity.subtotal || 0),
            0,
          );
          const dayImporteTotal =
            Number(day.precioUnitario || 0) * paxCount + dayActivitiesSubtotal;
          return acc + dayImporteTotal;
        }, 0),
      ),
    [form.itinerario, paxCount],
  );
  const activitiesUnit = useMemo(
    () => (paxCount > 0 ? roundCurrency(activitiesTotal / paxCount) : 0),
    [activitiesTotal, paxCount],
  );
  const showActivitiesRow = activitiesTotal > 0 && paxCount > 0;
  const isDirectAgency = useMemo(() => {
    const agenciaValue = String(form.agencia?.value ?? "")
      .trim()
      .toUpperCase();
    const agenciaLabel = String(form.agencia?.label ?? "")
      .trim()
      .toUpperCase();
    return agenciaValue.includes("DIRECTO") || agenciaLabel.includes("DIRECTO");
  }, [form.agencia?.label, form.agencia?.value]);
  const showCommissionSection =
    (form.itinerario ?? []).length > 0 && !isDirectAgency;
  const commissionPercentInput = useMemo(() => {
    const firstDay = (form.itinerario ?? [])[0];
    if (!firstDay) return "";
    if (
      firstDay.comisionPorcentaje === null ||
      firstDay.comisionPorcentaje === undefined
    ) {
      return "";
    }
    return Number.isFinite(Number(firstDay.comisionPorcentaje))
      ? String(firstDay.comisionPorcentaje)
      : "";
  }, [form.itinerario]);
  const incentiveInput = useMemo(() => {
    const firstDay = (form.itinerario ?? [])[0];
    if (!firstDay) return "";
    if (
      firstDay.incentivoValor === null ||
      firstDay.incentivoValor === undefined
    ) {
      return "";
    }
    const numericValue = Number(firstDay.incentivoValor);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return "";
    return String(firstDay.incentivoValor);
  }, [form.itinerario]);
  const commissionPercent = useMemo(
    () =>
      roundCurrency(
        Math.max(0, Math.min(100, Number(commissionPercentInput || 0))),
      ),
    [commissionPercentInput],
  );
  const totalComision = useMemo(
    () => roundCurrency((passengerBaseTotal * commissionPercent) / 100),
    [passengerBaseTotal, commissionPercent],
  );
  const totalIncentivo = useMemo(
    () => roundCurrency(Math.max(0, Number(incentiveInput || 0))),
    [incentiveInput],
  );

  const foodUnit = useMemo(
    () =>
      roundCurrency(
        (form.hotelesContratados ?? []).reduce((acc, hotelRow) => {
          if (!hotelRow.incluyeAlimentacion) return acc;
          return acc + Number(hotelRow.alimentacionPrecio || 0);
        }, 0),
      ),
    [form.hotelesContratados],
  );
  const foodTotal = useMemo(
    () => roundCurrency(foodUnit * paxCount),
    [foodUnit, paxCount],
  );
  const showFoodRow = form.incluyeHotel && foodUnit > 0 && paxCount > 0;
  const movilidadUnit = useMemo(
    () => roundCurrency(Number(form.movilidadPrecio || 0)),
    [form.movilidadPrecio],
  );
  const movilidadQuantity = useMemo(() => Math.max(0, paxCount), [paxCount]);
  const movilidadTotal = useMemo(
    () => roundCurrency(movilidadUnit * movilidadQuantity),
    [movilidadUnit, movilidadQuantity],
  );
  const showMovilidadRow = Boolean(
    String(form.movilidadTipo ?? "").trim() &&
    String(form.movilidadTipo ?? "").toUpperCase() !== "NO INCLUYE" &&
    movilidadUnit > 0 &&
    movilidadQuantity > 0,
  );
  const movilidadLabel = useMemo(() => {
    const tipo = String(form.movilidadTipo ?? "")
      .trim()
      .toUpperCase();
    if (tipo === "AEREO") return "Vuelo";
    return "Movilidad";
  }, [form.movilidadTipo]);

  const grandTotal = useMemo(
    () =>
      roundCurrency(
        passengerBaseTotal +
          liquidationRows.reduce((acc, row) => {
            const unit = roundCurrency(row.roomPrice);
            return acc + roundCurrency(unit * row.quantity);
          }, 0) +
          (showMovilidadRow ? movilidadTotal : 0) +
          (showActivitiesRow ? activitiesTotal : 0) +
          (showFoodRow ? foodTotal : 0),
      ),
    [
      passengerBaseTotal,
      liquidationRows,
      showMovilidadRow,
      movilidadTotal,
      showActivitiesRow,
      activitiesTotal,
      showFoodRow,
      foodTotal,
    ],
  );
  const hasRows =
    passengerRows.length > 0 ||
    liquidationRows.length > 0 ||
    showMovilidadRow ||
    showActivitiesRow ||
    showFoodRow;
  const { igv, cargosExtra, totalGeneral } = useMemo(
    () =>
      calculateTravelPackageCharges({
        baseAmount: grandTotal,
        documentoCobranza: form.documentoCobranza,
        medioPago: form.medioPago,
      }),
    [grandTotal, form.documentoCobranza, form.medioPago],
  );
  const showIgv = ["BOLETA", "FACTURA"].includes(
    String(form.documentoCobranza ?? "").toUpperCase(),
  );
  const extraAplicado =
    form.moneda === "SOLES"
      ? Number(form.precioExtraSoles ?? 0)
      : Number(form.precioExtraDolares ?? 0);
  const totalConExtra = roundCurrency(totalGeneral + extraAplicado);
  const enablesBankFlow = ["DEPOSITO", "YAPE", "TARJETA"].includes(
    form.medioPago,
  );
  const entidadBancariaOptions = useMemo(
    () => getEntidadBancariaOptions(form.medioPago),
    [form.medioPago],
  );
  const isCredit = form.condicionPago === "CREDITO";
  const canEditBank = !isCredit && enablesBankFlow;
  const canEditOperation =
    canEditBank &&
    Boolean(form.entidadBancaria) &&
    form.entidadBancaria !== "-";
  const liquidationSummaryRows = [
    { label: "Subtotal", value: grandTotal, strong: true },
    { label: showIgv ? "IGV (18%)" : "IGV", value: igv, strong: false },
    { label: "Cargo extra (Tarjeta 5%)", value: cargosExtra, strong: false },
    { label: "Total general", value: totalGeneral, strong: true },
  ];
  const handleCommissionPercentChange = (rawValue: string) => {
    const parsed = Number(rawValue);
    const porcentaje =
      rawValue.trim() === ""
        ? undefined
        : roundCurrency(
            Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 0)),
          );
    onUpdateField(
      "itinerario",
      (form.itinerario ?? []).map((day) =>
        day.id > 0 ? { ...day, comisionPorcentaje: porcentaje } : day,
      ),
    );
  };
  const handleIncentiveValueChange = (rawValue: string) => {
    const parsed = Number(rawValue);
    const incentivo =
      rawValue.trim() === ""
        ? undefined
        : roundCurrency(Math.max(0, Number.isFinite(parsed) ? parsed : 0));
    onUpdateField(
      "itinerario",
      (form.itinerario ?? []).map((day) =>
        day.id > 0 ? { ...day, incentivoValor: incentivo } : day,
      ),
    );
  };

  return (
    <SectionCard
      icon={Calculator}
      title="6. Liquidacion"
      description="Resumen unificado por paquete y tipo de habitacion."
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[920px] w-full table-fixed text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium w-[50%]">
                    Paquete
                  </th>
                  <th className="px-3 py-2 text-center font-medium w-[8%]">
                    Moneda
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[16%]">
                    P. Unitario
                  </th>
                  <th className="px-3 py-2 text-center font-medium w-[10%]">
                    Cant
                  </th>
                  <th className="px-3 py-2 text-right font-medium w-[16%]">
                    P. Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {!hasRows ? (
                  <tr className="border-t border-slate-200">
                    <td className="px-3 py-3 text-slate-500" colSpan={5}>
                      No hay habitaciones con cantidad para liquidar.
                    </td>
                  </tr>
                ) : (
                  <>
                    {passengerRows.map((row) => (
                      <tr key={row.key} className="border-t border-slate-200">
                        <td className="px-3 py-2 text-slate-700">
                          {`Paquete ${destinosLabel} / PAX ${row.passengerType}`}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-slate-700">
                          {currencySymbol}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">
                          {formatCurrency(row.unit)}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700">
                          {row.quantity}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                    {liquidationRows.map((row) => {
                      const unitAmount = roundCurrency(row.roomPrice);
                      const total = roundCurrency(unitAmount * row.quantity);
                      return (
                        <tr key={row.key} className="border-t border-slate-200">
                          <td className="px-3 py-2 text-slate-700">
                            {`Paquete ${destinosLabel} / Hab ${row.roomType}`}
                          </td>
                          <td className="px-3 py-2 text-center font-medium text-slate-700">
                            {currencySymbol}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700">
                            {formatCurrency(unitAmount)}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-700">
                            {row.quantity}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      );
                    })}
                    {showMovilidadRow && (
                      <tr className="border-t border-slate-200">
                        <td className="px-3 py-2 text-slate-700">
                          {`Paquete ${destinosLabel} / ${movilidadLabel}`}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-slate-700">
                          {currencySymbol}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">
                          {formatCurrency(movilidadUnit)}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700">
                          {movilidadQuantity}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          {formatCurrency(movilidadTotal)}
                        </td>
                      </tr>
                    )}
                    {showActivitiesRow && (
                      <tr className="border-t border-slate-200">
                        <td className="px-3 py-2 text-slate-700">
                          {`Paquete ${destinosLabel} / Actividades`}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-slate-700">
                          {currencySymbol}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">
                          {formatCurrency(activitiesUnit)}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700">
                          {paxCount}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          {formatCurrency(activitiesTotal)}
                        </td>
                      </tr>
                    )}
                    {showFoodRow && (
                      <tr className="border-t border-slate-200">
                        <td className="px-3 py-2 text-slate-700">
                          {`Paquete ${destinosLabel} / Alimentacion`}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-slate-700">
                          {currencySymbol}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-700">
                          {formatCurrency(foodUnit)}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700">
                          {paxCount}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          {formatCurrency(foodTotal)}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          {showCommissionSection && (
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Comision e incentivo total
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full table-fixed text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-[30%]">
                        Base comisionable
                      </th>
                      <th className="px-3 py-2 text-center font-medium w-[10%]">
                        Moneda
                      </th>
                      <th className="px-3 py-2 text-center font-medium w-[18%]">
                        % Comision
                      </th>
                      <th className="px-3 py-2 text-right font-medium w-[21%]">
                        Comision
                      </th>
                      <th className="px-3 py-2 text-right font-medium w-[21%]">
                        Incentivo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200">
                      <td className="px-3 py-2 text-slate-700">
                        {`Total pasajeros: ${formatCurrency(passengerBaseTotal)}`}
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-slate-700">
                        {currencySymbol}
                      </td>
                      <td className="px-3 py-2">
                        <div className="mx-auto flex w-[120px] items-center rounded-md border border-slate-300 bg-white px-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={commissionPercentInput}
                            onChange={(event) =>
                              handleCommissionPercentChange(event.target.value)
                            }
                            className="h-8 w-full border-0 bg-transparent text-right text-sm text-slate-800 focus:outline-none"
                          />
                          <span className="ml-1 text-xs font-medium text-slate-500">
                            %
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        {formatCurrency(totalComision)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="ml-auto flex w-[160px] items-center rounded-md border border-slate-300 bg-white px-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={incentiveInput}
                            onChange={(event) =>
                              handleIncentiveValueChange(event.target.value)
                            }
                            className="h-8 w-full border-0 bg-transparent text-right text-sm text-slate-800 focus:outline-none"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">
                        Total comision
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {formatCurrency(totalComision)}
                      </td>
                      <td className="px-3 py-2" />
                    </tr>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td className="px-3 py-2 text-center font-semibold text-slate-700"></td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">
                        Total incentivo
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {formatCurrency(totalIncentivo)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {hasRows && (
            <div className="rounded-xl border border-orange-200 bg-orange-50">
              <div className="grid grid-cols-2 border-b border-orange-200 bg-orange-100/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-orange-800">
                <span>Concepto</span>
                <span className="text-right">Importe</span>
              </div>
              {liquidationSummaryRows.map((row, index) => {
                const isLast = index === liquidationSummaryRows.length - 1;
                return (
                  <div
                    key={row.label}
                    className={`grid grid-cols-2 px-3 py-2 text-sm ${
                      isLast
                        ? "bg-orange-100/70"
                        : "border-b border-orange-200/80"
                    }`}
                  >
                    <span
                      className={
                        row.strong
                          ? "font-semibold text-orange-950"
                          : "text-orange-800"
                      }
                    >
                      {row.label}
                    </span>
                    <span className="text-right font-semibold text-orange-950">
                      {row.label === "Total general"
                        ? `${currencySymbol} ${formatCurrency(row.value)}`
                        : formatCurrency(row.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white xl:sticky xl:top-4">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">
              Cobranza y condicion
            </p>
          </div>

          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Medio de pago
                </label>
                <select
                  name="medioPago"
                  value={form.medioPago}
                  disabled={isCredit}
                  onChange={(event) =>
                    onUpdateField("medioPago", event.target.value)
                  }
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {MEDIO_PAGO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Entidad bancaria
                </label>
                <select
                  name="entidadBancaria"
                  value={form.entidadBancaria}
                  disabled={!canEditBank}
                  onChange={(event) => {
                    onUpdateField("entidadBancaria", event.target.value);
                    onUpdateField("nroOperacion", "");
                  }}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {entidadBancariaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Nro operacion
                </label>
                <input
                  name="nroOperacion"
                  value={form.nroOperacion}
                  disabled={!canEditOperation}
                  onChange={(event) =>
                    onUpdateField("nroOperacion", event.target.value)
                  }
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Acuenta
                </label>
                <input
                  name="acuenta"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.acuenta === 0 ? "" : form.acuenta}
                  disabled={form.condicionPago !== "ACUENTA"}
                  onChange={(event) => {
                    const value = Number(event.target.value || 0);
                    const capped =
                      form.totalGeneral > 0
                        ? Math.min(value, form.totalGeneral)
                        : value;
                    onUpdateField("acuenta", roundCurrency(capped));
                  }}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-right text-sm text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Resumen de pago
                </p>
              </div>
              <div className="space-y-2 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Deposito
                    </p>
                    <p className="text-right text-sm font-semibold text-slate-800">
                      {` ${formatCurrency(form.deposito || 0)}`}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Efectivo
                    </p>
                    <p className="text-right text-sm font-semibold text-slate-800">
                      {` ${formatCurrency(form.efectivo || 0)}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className="font-medium text-slate-600">Saldo</span>
                  <span className="text-right font-semibold text-slate-900">
                    {` ${formatCurrency(form.saldo || 0)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <div
              className={`rounded-lg border ${
                form.condicionPago === "CANCELADO"
                  ? "bg-[#305496]"
                  : "bg-[#C00000]"
              } px-4 py-2 shadow-sm min-h-[56px] flex items-center`}
            >
              <p className="text-sm font-semibold italic text-white leading-tight">
                {form.mensajePasajero || "SIN MENSAJE DE COBRANZA"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </SectionCard>
  );
};

export default LiquidationSection;
