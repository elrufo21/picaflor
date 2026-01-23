import {
  AutocompleteControlled,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { useCanalVenta } from "../../hooks/useCanalVenta";
import { showToast } from "@/components/ui/AppToast";
import { useDialogStore } from "@/app/store/dialogStore";
import { usePackageStore } from "../../store/fulldayStore";

const CanalVentaComponent = ({ control, setValue, watch }) => {
  const { isEditing } = usePackageStore();
  const { openDialog } = useDialogStore();
  const { canalVentaList, addCanalToList } = useCanalVenta();
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
      content: ({ payload, setPayload, close }: any) => {
        const search = String(payload.search ?? "").toLowerCase();
        const filtered = canalVentaList.filter((opt) => {
          const haystack = [
            opt.label,
            opt.contacto ?? "",
            opt.telefono ?? "",
            opt.email ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(search);
        });

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Nombre</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.label ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, label: e.target.value })
                  }
                  placeholder="Ej: AEROMAR TRAVEL"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">
                  Código interno (opcional)
                </span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.value ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, value: e.target.value })
                  }
                  placeholder="Ej: WEB_PERU"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Contacto</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.contacto ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, contacto: e.target.value })
                  }
                  placeholder="Ej: DIANA"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Teléfono</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.telefono ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, telefono: e.target.value })
                  }
                  placeholder="Ej: 984821760"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-semibold text-slate-800">Email</span>
                <input
                  type="email"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.email ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, email: e.target.value })
                  }
                  placeholder="Ej: contacto@canal.com"
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  Lista de canales
                </label>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Buscar..."
                  value={String(payload.search ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, search: e.target.value })
                  }
                />
              </div>
              <div className="border border-slate-200 rounded-lg max-h-64 overflow-auto divide-y divide-slate-200">
                {filtered.length === 0 && (
                  <p className="text-sm text-slate-500 px-3 py-2">
                    No hay canales para mostrar.
                  </p>
                )}
                {filtered?.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-800">
                        {opt.label}
                      </p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
                        {opt.contacto && <span>Contacto: {opt.contacto}</span>}
                        {opt.telefono && <span>Teléfono: {opt.telefono}</span>}
                        {opt.email && <span>Email: {opt.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                        onClick={() =>
                          setPayload({
                            ...payload,
                            label: opt.label,
                            value: opt.value,
                            contacto: opt.contacto ?? "",
                            telefono: opt.telefono ?? "",
                            email: opt.email ?? "",
                            editingValue: opt.value,
                          })
                        }
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        onClick={() => {
                          setValue("canalDeVenta", opt);
                          close();
                        }}
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },
      onConfirm: (data: any) => {
        const label = String(data.label ?? "").trim();
        const customValue = String(data.value ?? "").trim();
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

        const newOption = {
          label,
          value: customValue || label.trim().toUpperCase().replace(/\s+/g, "_"),
          contacto: contacto || undefined,
          telefono: telefono || undefined,
          email: email || undefined,
          auxiliar: label,
        };

        addCanalToList(newOption, editingValue);
        setValue("canalVenta", newOption);
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
            onValueChange={(value, { setNextFocus }) => {
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
            }
            if (e?.value === "ACUENTA") {
              setValue("medioPago", "");
            }
            if (e?.value === "CREDITO") {
              setValue("entidadBancaria", "-");
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
