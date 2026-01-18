import {
  AutocompleteControlled,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { useCanalVenta } from "../../hooks/useCanalVenta";

const CanalVentaComponent = ({ control, setValue }) => {
  const { canalVentaList, addCanalToList } = useCanalVenta();

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

  const handleAddCanalVenta = (e) => {};
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
