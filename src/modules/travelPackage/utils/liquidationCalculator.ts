import { roundCurrency } from "@/shared/helpers/formatCurrency";
import type { TravelPackageFormState } from "../types/travelPackage.types";

const normalizeText = (value: string) => String(value ?? "").trim().toUpperCase();

const shouldApplyIgv = (documentoCobranza: string) => {
  const normalized = normalizeText(documentoCobranza);
  return normalized === "BOLETA" || normalized === "FACTURA";
};

const shouldApplyCardCharge = (medioPago: string) =>
  normalizeText(medioPago) === "TARJETA";

export const calculateTravelPackageCharges = ({
  baseAmount,
  documentoCobranza,
  medioPago,
}: {
  baseAmount: number;
  documentoCobranza: string;
  medioPago: string;
}) => {
  const base = roundCurrency(Number(baseAmount || 0));
  const igv = shouldApplyIgv(documentoCobranza) ? roundCurrency(base * 0.18) : 0;
  const cargosExtra = shouldApplyCardCharge(medioPago)
    ? roundCurrency((base + igv) * 0.05)
    : 0;
  const totalGeneral = roundCurrency(base + igv + cargosExtra);

  return {
    igv,
    cargosExtra,
    totalGeneral,
  };
};

export const calculateTravelPackageLiquidationBase = (
  form: TravelPackageFormState,
) => {
  const paxCount = Math.max(0, Number(form.cantPax || 0));

  const hotelRowsTotal = (() => {
    if (!form.incluyeHotel) return 0;

    const groupedByType = new Map<string, { unitPriceSum: number; quantity: number }>();

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
          current.unitPriceSum = roundCurrency(current.unitPriceSum + roomPrice);
          current.quantity = Math.max(current.quantity, quantity);
          return;
        }

        groupedByType.set(key, {
          unitPriceSum: roomPrice,
          quantity,
        });
      });
    });

    return roundCurrency(
      Array.from(groupedByType.values()).reduce((acc, row) => {
        const unitAmount = roundCurrency(row.unitPriceSum);
        return acc + roundCurrency(unitAmount * row.quantity);
      }, 0),
    );
  })();

  const activitiesTotal = roundCurrency(
    (form.itinerario ?? []).reduce((acc, day) => {
      const dayActivitiesSubtotal = (day.actividades ?? []).reduce(
        (sum, activity) => sum + Number(activity.subtotal || 0),
        0,
      );
      const dayImporteTotal =
        Number(day.precioUnitario || 0) * paxCount + dayActivitiesSubtotal;
      return acc + dayImporteTotal;
    }, 0),
  );
  const showActivitiesRow = activitiesTotal > 0 && paxCount > 0;

  const foodUnit = roundCurrency(
    (form.hotelesContratados ?? []).reduce((acc, hotelRow) => {
      if (!hotelRow.incluyeAlimentacion) return acc;
      return acc + Number(hotelRow.alimentacionPrecio || 0);
    }, 0),
  );
  const foodTotal = roundCurrency(foodUnit * paxCount);
  const showFoodRow = form.incluyeHotel && foodUnit > 0 && paxCount > 0;

  const movilidadUnit = roundCurrency(Number(form.movilidadPrecio || 0));
  const movilidadQuantity = Math.max(0, paxCount);
  const movilidadTotal = roundCurrency(movilidadUnit * movilidadQuantity);
  const movilidadTipo = normalizeText(form.movilidadTipo);
  const showMovilidadRow =
    movilidadTipo !== "" &&
    movilidadTipo !== "NO INCLUYE" &&
    movilidadUnit > 0 &&
    movilidadQuantity > 0;

  return roundCurrency(
    hotelRowsTotal +
      (showMovilidadRow ? movilidadTotal : 0) +
      (showActivitiesRow ? activitiesTotal : 0) +
      (showFoodRow ? foodTotal : 0),
  );
};
