import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import type {
  TravelPackageFormState,
  SelectOption,
} from "../types/travelPackage.types";
import SectionCard from "./SectionCard";
import {
  AutocompleteControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { useCanalVenta } from "@/modules/fullday/hooks/useCanalVenta";
import { useForm } from "react-hook-form";
import type { CanalOption } from "@/modules/fullday/hooks/canalUtils";
import { serviciosDB } from "@/app/db/serviciosDB";

type Props = {
  form: TravelPackageFormState;
  onUpdateField: <K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => void;
  onUpdateAgencia: (value: SelectOption | null) => void;
};

const AgencySection = ({ form, onUpdateField, onUpdateAgencia }: Props) => {
  type AgencySectionFormValues = {
    canalDeVenta: CanalOption | null;
    telefono: string;
    email: string;
    contacto: string;
    counter: string;
    condicionPago: string;
  };

  const { control, setValue } = useForm<AgencySectionFormValues>({
    defaultValues: {
      canalDeVenta: null,
      telefono: form.telefono,
      email: form.email,
      contacto: form.contacto,
      counter: form.counter,
      condicionPago: form.condicionPago,
    },
  });
  const { canalVentaList } = useCanalVenta();
  const [localCanales, setLocalCanales] = useState<CanalOption[]>([]);

  useEffect(() => {
    let active = true;

    const loadLocalCanales = async () => {
      const [canalesRows, auxiliaresRows] = await Promise.all([
        serviciosDB.canales.toArray(),
        serviciosDB.auxiliares.toArray(),
      ]);

      if (!active) return;

      const auxById = new Map(
        auxiliaresRows.map((aux) => [
          String(aux.id),
          {
            telefono: String(aux.telefono ?? "").trim(),
            contacto: String(aux.contacto ?? "").trim(),
            email: String(aux.email ?? "").trim(),
          },
        ]),
      );

      const mapped: CanalOption[] = canalesRows
        .map((row) => {
          const id = String(row.id ?? "").trim();
          const label = String(row.nombre ?? "").trim();
          if (!id && !label) return null;

          const aux = auxById.get(id);
          const contacto = String(row.contacto ?? "").trim() || aux?.contacto || "";
          const email = String(row.email ?? "").trim() || aux?.email || "";
          const telefono = String(aux?.telefono ?? "").trim();

          return {
            value: id || label,
            label: label || id,
            auxiliar: label || undefined,
            contacto: contacto || undefined,
            email: email || undefined,
            telefono: telefono || undefined,
          } as CanalOption;
        })
        .filter(Boolean) as CanalOption[];

      setLocalCanales(mapped);
    };

    void loadLocalCanales();

    return () => {
      active = false;
    };
  }, []);

  const mergedCanalVentaList = useMemo(() => {
    const byValue = new Map<string, CanalOption>();

    localCanales.forEach((item) => {
      byValue.set(String(item.value).toLowerCase(), item);
    });

    canalVentaList.forEach((item) => {
      const key = String(item.value).toLowerCase();
      if (byValue.has(key)) return;
      byValue.set(key, item);
    });

    return Array.from(byValue.values());
  }, [localCanales, canalVentaList]);

  useEffect(() => {
    setValue("telefono", form.telefono);
  }, [form.telefono, setValue]);

  useEffect(() => {
    setValue("email", form.email);
  }, [form.email, setValue]);

  useEffect(() => {
    setValue("contacto", form.contacto);
  }, [form.contacto, setValue]);

  useEffect(() => {
    setValue("counter", form.counter);
  }, [form.counter, setValue]);

  useEffect(() => {
    setValue("condicionPago", form.condicionPago);
  }, [form.condicionPago, setValue]);

  useEffect(() => {
    const selected =
      mergedCanalVentaList.find(
        (option) =>
          option.value === form.agencia?.value ||
          option.label === form.agencia?.label,
      ) ??
      null;
    setValue("canalDeVenta", selected);
  }, [mergedCanalVentaList, form.agencia, setValue]);

  return (
    <SectionCard
      icon={BriefcaseBusiness}
      title="2. Canal / Agencia"
      description="Canal comercial y datos de contacto."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="md:col-span-2 xl:col-span-3">
          <AutocompleteControlled<AgencySectionFormValues, CanalOption>
            onValueChange={(value) => {
              onUpdateAgencia(
                value ? { label: value.label, value: value.value } : null,
              );
              onUpdateField("telefono", value?.telefono ?? "");
              onUpdateField("email", value?.email ?? "");
              onUpdateField("contacto", value?.contacto ?? "");
            }}
            name="canalDeVenta"
            options={mergedCanalVentaList}
            control={control}
            label="Canal de venta"
            inputEndAdornment={
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
              >
                Nuevo
              </button>
            }
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            size="small"
            className="w-full"
          />
        </div>

        <TextControlled<AgencySectionFormValues>
          name="contacto"
          control={control}
          size="small"
          label="Contacto"
          className="w-full"
          onChange={(e) => onUpdateField("contacto", e.target.value)}
        />

        <TextControlled<AgencySectionFormValues>
          name="email"
          control={control}
          size="small"
          type="email"
          label="Email"
          disableAutoUppercase
          onChange={(e) => onUpdateField("email", e.target.value)}
        />

        <div className="md:col-span-2 xl:col-span-3">
          <TextControlled<AgencySectionFormValues>
            name="telefono"
            control={control}
            size="small"
            label="Telefono"
            onChange={(e) => onUpdateField("telefono", e.target.value)}
            disableHistory
          />
        </div>

        <TextControlled<AgencySectionFormValues>
          name="counter"
          control={control}
          size="small"
          label="Counter"
          InputProps={{ readOnly: true }}
          disabled
        />

        {/** <SelectControlled<AgencySectionFormValues>
          name="condicionPago"
          control={control}
          options={CONDICION_PAGO_OPTIONS}
          size="small"
          label="Condicion de pago"
          onChange={(e) => onUpdateField("condicionPago", String(e.target.value))}
        /> */}
      </div>
    </SectionCard>
  );
};

export default AgencySection;
