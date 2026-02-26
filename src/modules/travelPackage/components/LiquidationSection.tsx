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

  const packageUnitAmount = useMemo(() => {
    const unitByDay = (form.itinerario ?? []).reduce(
      (acc, day) => acc + Number(day.precioUnitario || 0),
      0,
    );
    const activitySubtotal = (form.itinerario ?? []).reduce(
      (acc, day) =>
        acc +
        (day.actividades ?? []).reduce(
          (sum, activity) => sum + Number(activity.subtotal || 0),
          0,
        ),
      0,
    );
    const activityUnit = paxCount > 0 ? activitySubtotal / paxCount : 0;
    return roundCurrency(unitByDay + activityUnit);
  }, [form.itinerario, paxCount]);

  const liquidationRows = useMemo<LiquidationRow[]>(() => {
    const grouped = new Map<string, LiquidationRow>();

    (form.hotelesContratados ?? []).forEach((hotelRow) => {
      (hotelRow.habitaciones ?? []).forEach((room) => {
        const quantity = Math.max(0, Number(room.cantidad || 0));
        if (quantity <= 0) return;
        const roomType = String(room.tipo ?? "").trim();
        if (!roomType) return;
        const roomPrice = roundCurrency(Number(room.precio || 0));
        const key = `${roomType.toUpperCase()}|${roomPrice.toFixed(2)}`;
        const current = grouped.get(key);

        if (current) {
          current.quantity += quantity;
          return;
        }

        grouped.set(key, {
          key,
          roomType,
          roomPrice,
          quantity,
        });
      });
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.roomType.localeCompare(b.roomType),
    );
  }, [form.hotelesContratados]);

  const destinosLabel = useMemo(() => {
    const values = (form.destinos ?? [])
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    return values.length ? values.join(" - ") : "SIN DESTINOS";
  }, [form.destinos]);

  const grandTotal = useMemo(
    () =>
      roundCurrency(
        liquidationRows.reduce((acc, row) => {
          const unit = roundCurrency(packageUnitAmount + row.roomPrice);
          return acc + roundCurrency(unit * row.quantity);
        }, 0),
      ),
    [liquidationRows, packageUnitAmount],
  );

  return (
    <SectionCard
      icon={Calculator}
      title="6. Liquidacion"
      description="Resumen por tipo de habitacion (paquete + hotel)."
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
            {liquidationRows.length === 0 ? (
              <tr className="border-t border-slate-200">
                <td
                  className="px-3 py-3 text-slate-500"
                  colSpan={4}
                >
                  No hay habitaciones con cantidad para liquidar.
                </td>
              </tr>
            ) : (
              liquidationRows.map((row) => {
                const unitAmount = roundCurrency(packageUnitAmount + row.roomPrice);
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
              })
            )}
          </tbody>
          {liquidationRows.length > 0 && (
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
