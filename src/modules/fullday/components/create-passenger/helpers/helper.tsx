import { useWatch } from "react-hook-form";
import { formatCurrency } from "@/shared/helpers/formatCurrency";

export const SubTotal = ({ control, name }) => {
  const total = useWatch({ control, name }) || 0;
  return <>{formatCurrency(total)}</>;
};

export const TotalGeneral = ({ control, setValue }) => {
  const detalle = useWatch({ control, name: "detalle" });

  const total =
    Object.values(detalle || {}).reduce(
      (acc: number, d: any) => acc + Number(d?.total || 0),
      0,
    ) || 0;

  setValue("totalGeneral", total, { shouldDirty: true });

  return <>{formatCurrency(total)}</>;
};
