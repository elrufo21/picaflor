import { useWatch } from "react-hook-form";

export const SubTotal = ({ control, name }) => {
  const total = useWatch({ control, name }) || 0;
  return <>{Number(total).toFixed(2)}</>;
};

export const TotalGeneral = ({ control, setValue }) => {
  const detalle = useWatch({ control, name: "detalle" });

  const total =
    Object.values(detalle || {}).reduce(
      (acc: number, d: any) => acc + Number(d?.total || 0),
      0,
    ) || 0;

  setValue("totalGeneral", total, { shouldDirty: true });

  return <>{total.toFixed(2)}</>;
};
