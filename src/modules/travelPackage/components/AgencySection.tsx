import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import type {
  TravelPackageFormState,
  SelectOption,
} from "../types/travelPackage.types";
import SectionCard from "./SectionCard";
import { AutocompleteControlled, TextControlled } from "@/components/ui/inputs";
import { useCanalVenta } from "@/modules/fullday/hooks/useCanalVenta";
import { useForm } from "react-hook-form";
import {
  normalizeCanalText,
  type CanalOption,
} from "@/modules/fullday/hooks/canalUtils";
import { serviciosDB } from "@/app/db/serviciosDB";
import { useAuthStore } from "@/store/auth/auth.store";
import type { AuthUser } from "@/store/auth/auth.store";

const AUTH_SESSION_STORAGE_KEY = "picaflor.auth.session";

const normalizeSessionText = (value: unknown): string =>
  String(value ?? "").trim();

const resolveSessionLockedCanalVenta = (authUser: AuthUser | null) => {
  const currentId = normalizeSessionText(authUser?.canalVentaId);
  const currentName = normalizeSessionText(authUser?.canalVentaNombre);
  if (currentId && currentName) {
    return { canalVentaId: currentId, canalVentaNombre: currentName };
  }

  if (typeof window === "undefined") return null;

  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawSession) return null;

    const parsed = JSON.parse(rawSession) as {
      user?: { canalVentaId?: unknown; canalVentaNombre?: unknown };
    };
    const storedId = normalizeSessionText(parsed?.user?.canalVentaId);
    const storedName = normalizeSessionText(parsed?.user?.canalVentaNombre);
    if (!storedId || !storedName) return null;

    return { canalVentaId: storedId, canalVentaNombre: storedName };
  } catch {
    return null;
  }
};

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
    telPax: string;
  };

  const { control, setValue } = useForm<AgencySectionFormValues>({
    defaultValues: {
      canalDeVenta: null,
      telefono: form.telefono,
      telPax: form.telPax,
      email: form.email,
      contacto: form.contacto,
      counter: form.counter,
      condicionPago: form.condicionPago,
    },
  });
  const authUser = useAuthStore((state) => state.user);
  const lockedCanalVenta = useMemo(
    () => resolveSessionLockedCanalVenta(authUser),
    [authUser],
  );
  const isCanalVentaLocked = Boolean(lockedCanalVenta);
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
          normalizeCanalText(aux.id),
          {
            telefono: normalizeCanalText(aux.telefono),
            contacto: normalizeCanalText(aux.contacto),
            email: normalizeCanalText(aux.email),
          },
        ]),
      );

      const mapped: CanalOption[] = canalesRows
        .map((row) => {
          const id = normalizeCanalText(row.id);
          const label = normalizeCanalText(row.nombre);
          if (!id && !label) return null;

          const aux = auxById.get(id);
          const contacto =
            normalizeCanalText(row.contacto) || aux?.contacto || "";
          const email = normalizeCanalText(row.email) || aux?.email || "";
          const telefono = normalizeCanalText(aux?.telefono);

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

    if (lockedCanalVenta) {
      const lockedKey = String(lockedCanalVenta.canalVentaId).toLowerCase();
      if (!byValue.has(lockedKey)) {
        byValue.set(lockedKey, {
          value: lockedCanalVenta.canalVentaId,
          label: lockedCanalVenta.canalVentaNombre,
          auxiliar: lockedCanalVenta.canalVentaNombre,
        });
      }
    }

    return Array.from(byValue.values());
  }, [localCanales, canalVentaList, lockedCanalVenta]);

  const lockedCanalVentaOption = useMemo(() => {
    if (!lockedCanalVenta) return null;

    const canalVentaId = normalizeSessionText(lockedCanalVenta.canalVentaId);
    const canalVentaNombre = normalizeSessionText(
      lockedCanalVenta.canalVentaNombre,
    );

    const selectedOption =
      mergedCanalVentaList.find(
        (option) =>
          normalizeSessionText(option.value).toLowerCase() ===
            canalVentaId.toLowerCase() ||
          normalizeSessionText(option.label).toLowerCase() ===
            canalVentaNombre.toLowerCase() ||
          normalizeSessionText(option.auxiliar).toLowerCase() ===
            canalVentaNombre.toLowerCase(),
      ) ?? null;

    if (selectedOption) {
      return {
        ...selectedOption,
        auxiliar: selectedOption.auxiliar ?? canalVentaNombre,
      };
    }

    return {
      value: canalVentaId,
      label: canalVentaNombre,
      auxiliar: canalVentaNombre,
    };
  }, [lockedCanalVenta, mergedCanalVentaList]);

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
    setValue("telPax", form.telPax);
  }, [form.telPax, setValue]);

  useEffect(() => {
    setValue("condicionPago", form.condicionPago);
  }, [form.condicionPago, setValue]);

  useEffect(() => {
    if (!lockedCanalVentaOption) return;

    setValue("canalDeVenta", lockedCanalVentaOption);
    onUpdateAgencia({
      label: lockedCanalVentaOption.label,
      value: lockedCanalVentaOption.value,
    });
    onUpdateField("telefono", lockedCanalVentaOption.telefono ?? "");
    onUpdateField("email", lockedCanalVentaOption.email ?? "");
    onUpdateField("contacto", lockedCanalVentaOption.contacto ?? "");
  }, [lockedCanalVentaOption, setValue, onUpdateAgencia, onUpdateField]);

  useEffect(() => {
    if (isCanalVentaLocked) return;

    const selected =
      mergedCanalVentaList.find(
        (option) =>
          option.value === form.agencia?.value ||
          option.label === form.agencia?.label,
      ) ?? null;
    setValue("canalDeVenta", selected);
  }, [mergedCanalVentaList, form.agencia, setValue, isCanalVentaLocked]);

  return (
    <SectionCard
      icon={BriefcaseBusiness}
      title="2. Canal / Agencia"
      description="Canal comercial y datos de contacto."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="md:col-span-2 xl:col-span-3">
          <AutocompleteControlled<AgencySectionFormValues, CanalOption>
            data-focus-next='input[data-focus-target="agencia-telpax"]'
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
            disabled={isCanalVentaLocked}
            inputEndAdornment={
              isCanalVentaLocked ? null : (
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Nuevo
                </button>
              )
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
          type="text"
          label="Email"
          disableAutoUppercase
          inputProps={{ inputMode: "email" }}
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
            inputProps={{ "data-focus-target": "agencia-telefono" }}
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
        <TextControlled<AgencySectionFormValues>
          name="telPax"
          control={control}
          size="small"
          label="Telefono Pax"
          onChange={(e) => onUpdateField("telPax", e.target.value)}
          inputProps={{ "data-focus-target": "agencia-telpax" }}
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
