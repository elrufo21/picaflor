import {
  AutocompleteControlled,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { useForm } from "react-hook-form";
import { useCanalVenta } from "../../hooks/useCanalVenta";
import { showToast } from "@/components/ui/AppToast";
import { useDialogStore } from "@/app/store/dialogStore";
import { usePackageStore } from "../../store/fulldayStore";

type CanalVentaDialogValues = {
  label: string;
  contacto: string;
  telefono: string;
  email: string;
};

const CanalVentaDialogForm = ({
  payload,
  setPayload,
}: {
  payload: Partial<CanalVentaDialogValues>;
  setPayload: (next: Record<string, unknown>) => void;
}) => {
  const { control } = useForm<CanalVentaDialogValues>({
    defaultValues: {
      label: String(payload.label ?? ""),
      contacto: String(payload.contacto ?? ""),
      telefono: String(payload.telefono ?? ""),
      email: String(payload.email ?? ""),
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="label"
            control={control}
            label="Nombre"
            placeholder="Ej: AEROMAR TRAVEL"
            required
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, label: e.target.value });
            }}
            disableHistory
          />
        </div>
        <TextControlled<CanalVentaDialogValues>
          name="contacto"
          control={control}
          label="Contacto"
          placeholder="Ej: DIANA"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, contacto: e.target.value });
          }}
          disableHistory
        />
        <TextControlled<CanalVentaDialogValues>
          name="telefono"
          control={control}
          label="Teléfono"
          placeholder="Ej: 984821760"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, telefono: e.target.value });
          }}
          disableHistory
        />
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="email"
            control={control}
            label="Email"
            type="email"
            disableAutoUppercase
            placeholder="Ej: contacto@canal.com"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, email: e.target.value });
            }}
            disableHistory
          />
        </div>
      </div>
    </form>
  );
};

const CanalVentaComponent = ({ control, setValue, watch }) => {
  const { isEditing } = usePackageStore();
  const { openDialog } = useDialogStore();
  const { canalVentaList, addCanalToList, saveCanalVenta } = useCanalVenta();

  const parseCanalId = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleAddCanalVenta = () => {
    openDialog({
      title: "Nuevo canal de venta",
      description: "Crea un canal de venta sin salir del formulario.",
      size: "md",
      initialPayload: {
        label: "",
        value: "",
        contacto: "",
        telefono: "",
        email: "",
        search: "",
        editingValue: "",
      },
      confirmLabel: "Guardar canal",
      content: ({ payload, setPayload }: any) => (
        <CanalVentaDialogForm payload={payload} setPayload={setPayload} />
      ),
      onConfirm: async (data: any) => {
        const label = String(data.label ?? "").trim();
        const contacto = String(data.contacto ?? "").trim();
        const telefono = String(data.telefono ?? "").trim();
        const email = String(data.email ?? "").trim();
        const editingValue = String(data.editingValue ?? "").trim();

        if (!label) {
          showToast({
            title: "Atención",
            description: "Ingresa el nombre del canal de venta.",
            type: "warning",
          });
          throw new Error("Nombre de canal de venta requerido");
        }

        if (!contacto) {
          showToast({
            title: "Atención",
            description: "Ingresa el contacto del canal de venta.",
            type: "warning",
          });
          throw new Error("Contacto de canal de venta requerido");
        }

        if (!telefono) {
          showToast({
            title: "Atención",
            description: "Ingresa el teléfono del canal de venta.",
            type: "warning",
          });
          throw new Error("Teléfono de canal de venta requerido");
        }

        if (email && !/^[^\s@]+@[^\s@]+\.com$/i.test(email)) {
          showToast({
            title: "Atención",
            description:
              "Si ingresas correo, debe tener un formato válido con @ y .com",
            type: "warning",
          });
          throw new Error("Formato de email inválido");
        }

        try {
          const savedId = await saveCanalVenta({
            idAuxiliar: parseCanalId(editingValue),
            auxiliar: label,
            telefono,
            contacto,
            email,
          });

          const savedOption = {
            label,
            value: String(savedId),
            contacto: contacto || undefined,
            telefono: telefono || undefined,
            email: email || undefined,
            auxiliar: label,
          };

          addCanalToList(savedOption, editingValue);
          setValue("canalDeVenta", savedOption);
          setValue("canalVenta", label);
          setValue("canalDeVentaTelefono", savedOption.telefono ?? "");
          showToast({
            title: "Exito",
            description: `Canal guardado correctamente (ID ${savedId}).`,
            type: "success",
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error ?? "");
          const description =
            message.trim() || "No se pudo guardar el canal de venta.";
          showToast({
            title: "Error",
            description,
            type: "error",
          });
          throw error;
        }
      },
    });
  };

  /**Data para los select */

  const estadoPagoOptions = [
    { value: "CANCELADO", label: "Cancelado" },
    { value: "ACUENTA", label: "A Cuenta" },
    { value: "CREDITO", label: "Crédito" },
  ];
  const monedaOptions = [
    { value: "SOLES", label: "Soles" },
    { value: "DOLARES", label: "Dólares" },
  ];

  const handleCanalDeVentaChange = (e: any) => {
    setValue("canalDeVentaTelefono", e.telefono);
  };
  return (
    <div className="p-3 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="col-span-2">
          <AutocompleteControlled
            onValueChange={(value) => {
              handleCanalDeVentaChange(value);

              setTimeout(() => {
                document
                  .querySelector<HTMLInputElement>("#canalDeVentaTelefono")
                  ?.focus();
              }, 0);
            }}
            name="canalDeVenta"
            options={canalVentaList}
            control={control}
            label="Canal de venta"
            inputEndAdornment={
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                onClick={handleAddCanalVenta}
              >
                Nuevo
              </button>
            }
            getOptionLabel={(option: any) => option.label}
            size="small"
            className="w-full"
          />
        </div>
        <TextControlled
          name="counter"
          control={control}
          label="Counter"
          disabled
          size="small"
        />
        <SelectControlled
          name="moneda"
          control={control}
          label="Moneda"
          options={monedaOptions}
          disabled={!isEditing}
          required
          size="small"
          inputProps={{
            id: "moneda-input",
          }}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="col-span-2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <TextControlled
          id="canalDeVentaTelefono"
          name="canalDeVentaTelefono"
          control={control}
          label="Teléfono"
          inputProps={{
            "data-focus-next": 'input[id="condicion"]',
          }}
          size="small"
        />
        <AutocompleteControlled
          id="condicion"
          name="condicion"
          control={control}
          label="Condición"
          onValueChange={(e) => {
            if (e?.value === "ACUENTA" || e?.value === "CREDITO") {
              setValue("acuenta", 0);
              setValue("deposito", 0);
              setValue("efectivo", 0);
            }
            if (e?.value === "CANCELADO") {
              setValue("acuenta", watch("precioTotal"));
              setValue("medioPago", "");
              setValue("entidadBancaria", "-");
              setValue("nroOperacion", "");
            }
            if (e?.value === "ACUENTA") {
              setValue("medioPago", "");
              setValue("medioPago", "");
              setValue("entidadBancaria", "-");
              setValue("nroOperacion", "");
            }
            if (e?.value === "CREDITO") {
              setValue("medioPago", "");
              setValue("entidadBancaria", "-");
              setValue("nroOperacion", "");
            }
          }}
          options={estadoPagoOptions}
          getOptionLabel={(option: any) => option.label}
          isOptionEqualToValue={(option: any, value: any) =>
            option.value === value.value
          }
          data-focus-next='input[name="nombreCompleto"]'
          required
          size="small"
        />
      </div>
    </div>
  );
};

export default CanalVentaComponent;
