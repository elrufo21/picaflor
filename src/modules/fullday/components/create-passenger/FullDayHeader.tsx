import {
  TextControlled,
  SelectControlled,
  DateInput,
  AutocompleteControlled,
} from "@/components/ui/inputs";
import Divider from "@mui/material/Divider";
import type { Control } from "react-hook-form";
import type { CanalOption } from "../../hooks/canalUtils";

interface PackageHeaderProps {
  pkg: any;
  control: Control<any>;
  monedaOptions: any[];
  canalVentaList: CanalOption[];
  estadoPagoOptions: any[];
  handleAddCanalVenta: () => void;
}

export const PackageHeader = ({
  pkg,
  control,
  monedaOptions,
  canalVentaList,
  estadoPagoOptions,
  handleAddCanalVenta,
}: PackageHeaderProps) => {
  return (
    <div className="space-y-3">
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="col-span-2">
            <TextControlled
              name="destino"
              disabled
              control={control}
              size="small"
              label="Destino"
            />
          </div>
          <SelectControlled
            name="moneda"
            control={control}
            label="Moneda"
            options={monedaOptions}
            required
            size="small"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="col-span-2">
              <DateInput
                name="fechaViaje"
                control={control}
                label="Fecha de viaje"
                required
                disabled
                size="small"
              />
            </div>
            <div className="h-full flex items-center text-xl text-slate-600 ">
              Disp:{" "}
              <span className="ml-1 font-semibold text-emerald-700">
                {pkg.disponibles}
              </span>
            </div>
          </div>
          <DateInput
            name="fechaEmision"
            control={control}
            label="Fecha de emisión"
            required
            size="small"
            disabled
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <AutocompleteControlled
            name="canalVenta"
            control={control}
            label="Canal de venta"
            options={canalVentaList}
            getOptionLabel={(option: any) => option.label}
            isOptionEqualToValue={(option: any, value: any) =>
              option.value === value.value
            }
            inputEndAdornment={
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                onClick={handleAddCanalVenta}
              >
                Nuevo
              </button>
            }
            size="small"
            className="w-full"
          />
          <TextControlled
            name="counter"
            control={control}
            label="Counter"
            disabled
            size="small"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <TextControlled
            name="telefono"
            control={control}
            label="Teléfono"
            inputProps={{ "data-focus-next": 'input[name="nombreCompleto"]' }}
            size="small"
          />
          <AutocompleteControlled
            name="condicion"
            control={control}
            label="Condición"
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
      <Divider />
    </div>
  );
};
