import { useEffect } from "react";
import { TextControlled } from "@/components/ui/inputs";
import { useForm } from "react-hook-form";

type ProgramTransportFieldsValues = {
  programa: string;
  cantPax: string;
};

type Props = {
  programa: string;
  cantPax: string;
  onChange: (field: keyof ProgramTransportFieldsValues, value: string) => void;
};

const ProgramTransportFields = ({ programa, cantPax, onChange }: Props) => {
  const { control, setValue } = useForm<ProgramTransportFieldsValues>({
    defaultValues: {
      programa,
      cantPax,
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

  return (
    <>
      <div className="xl:col-span-5">
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
      <div className="xl:col-span-1">
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
    </>
  );
};

export default ProgramTransportFields;
