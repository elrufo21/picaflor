import { useMemo } from "react";
import { Calculator } from "lucide-react";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import { getTravelCurrencySymbol } from "../constants/travelPackage.constants";
import type { TravelPackageFormState } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

type Props = {
  form: TravelPackageFormState;
};

type LiquidationRow = {
  key: string;
  roomType: string;
  roomPrice: number;
  quantity: number;
};

const LiquidationSection = ({ form }: Props) => {
  const currencySymbol = getTravelCurrencySymbol(form.moneda);
  const paxCount = Math.max(0, Number(form.cantPax || 0));

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
            current.unitPriceSum = roundCurrency(current.unitPriceSum + roomPrice);
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
  }, [form.hotelesContratados, form.incluyeHotel, paxCount]);

  const destinosLabel = useMemo(() => {
    const values = (form.destinos ?? [])
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    return values.length ? values.join(" - ") : "SIN DESTINOS";
  }, [form.destinos]);

  const activitiesTotal = useMemo(
    () =>
      roundCurrency(
        (form.itinerario ?? []).reduce(
          (acc, day) => {
            const dayActivitiesSubtotal = (day.actividades ?? []).reduce(
              (sum, activity) => sum + Number(activity.subtotal || 0),
              0,
            );
            const dayImporteTotal =
              Number(day.precioUnitario || 0) * paxCount + dayActivitiesSubtotal;
            return acc + dayImporteTotal;
          },
          0,
        ),
      ),
    [form.itinerario, paxCount],
  );
  const activitiesUnit = useMemo(
    () => (paxCount > 0 ? roundCurrency(activitiesTotal / paxCount) : 0),
    [activitiesTotal, paxCount],
  );
  const showActivitiesRow = activitiesTotal > 0 && paxCount > 0;

  const grandTotal = useMemo(
    () =>
      roundCurrency(
        liquidationRows.reduce((acc, row) => {
          const unit = roundCurrency(row.roomPrice);
          return acc + roundCurrency(unit * row.quantity);
        }, 0) + (showActivitiesRow ? activitiesTotal : 0),
      ),
    [liquidationRows, showActivitiesRow, activitiesTotal],
  );
  const hasRows = liquidationRows.length > 0 || showActivitiesRow;

  return (
    <SectionCard
      icon={Calculator}
      title="6. Liquidacion"
      description="Resumen unificado por paquete y tipo de habitacion."
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[920px] w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-[58%]">
                Paquete
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
                <td
                  className="px-3 py-3 text-slate-500"
                  colSpan={4}
                >
                  No hay habitaciones con cantidad para liquidar.
                </td>
              </tr>
            ) : (
              <>
                {liquidationRows.map((row) => {
                  const unitAmount = roundCurrency(row.roomPrice);
                  const total = roundCurrency(unitAmount * row.quantity);
                  return (
                    <tr key={row.key} className="border-t border-slate-200">
                      <td className="px-3 py-2 text-slate-700">
                        {`Paquete ${destinosLabel} / Hab ${row.roomType}`}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-700">
                        {`${currencySymbol} ${formatCurrency(unitAmount)}`}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-700">
                        {row.quantity}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">
                        {`${currencySymbol} ${formatCurrency(total)}`}
                      </td>
                    </tr>
                  );
                })}
                {showActivitiesRow && (
                  <tr className="border-t border-slate-200">
                    <td className="px-3 py-2 text-slate-700">
                      {`Paquete ${destinosLabel} / Actividades`}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-700">
                      {`${currencySymbol} ${formatCurrency(activitiesUnit)}`}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-700">
                      {paxCount}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {`${currencySymbol} ${formatCurrency(activitiesTotal)}`}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
          {hasRows && (
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50">
                <td className="px-3 py-2 text-right font-semibold text-slate-800" colSpan={3}>
                  Total liquidacion
                </td>
                <td className="px-3 py-2 text-right font-bold text-slate-900">
                  {`${currencySymbol} ${formatCurrency(grandTotal)}`}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </SectionCard>
  );
};

export default LiquidationSection;
