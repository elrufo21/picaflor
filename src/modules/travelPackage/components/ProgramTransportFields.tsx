import { useEffect } from "react";
import { SelectControlled, TextControlled } from "@/components/ui/inputs";
import { useForm } from "react-hook-form";
import { CONDICION_PAGO_OPTIONS } from "../constants/travelPackage.constants";

type ProgramTransportFieldsValues = {
  programa: string;
  cantPax: string;
  condicionPago: string;
};

type Props = {
  programa: string;
  cantPax: string;
  condicionPago: string;
  onChange: (field: keyof ProgramTransportFieldsValues, value: string) => void;
};

const ProgramTransportFields = ({ programa, cantPax, condicionPago, onChange }: Props) => {
  const { control, setValue } = useForm<ProgramTransportFieldsValues>({
    defaultValues: {
      programa,
      cantPax,
      condicionPago,
    },
  });

  useEffect(() => {
    setValue("programa", programa, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [programa, setValue]);

  useEffect(() => {
    setValue("cantPax", cantPax, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [cantPax, setValue]);

  useEffect(() => {
    setValue("condicionPago", condicionPago, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [condicionPago, setValue]);

  return (
    <>
      <div className="xl:col-span-3">
        <TextControlled<ProgramTransportFieldsValues>
          fullWidth
          size="small"
          label="Programa"
          name="programa"
          control={control}
          disableAutoUppercase
          onChange={(event) => onChange("programa", event.target.value)}
        />
      </div>
      <div className="xl:col-span-3 grid grid-cols-2">
        <div className="col-span-1">
          <TextControlled<ProgramTransportFieldsValues>
            fullWidth
            size="small"
            label="Cantidad de pasajeros"
            name="cantPax"
            control={control}
            disableAutoUppercase
            onChange={(event) => onChange("cantPax", event.target.value)}
          />
        </div>
        <div className="col-span-1">
          <SelectControlled<ProgramTransportFieldsValues>
            name="condicionPago"
            control={control}
            options={CONDICION_PAGO_OPTIONS}
            size="small"
            label="Condicion de pago"
            onChange={(e) => onChange("condicionPago", String(e.target.value))}
          />
        </div>
      </div>
    </>
  );
};

export default ProgramTransportFields;
