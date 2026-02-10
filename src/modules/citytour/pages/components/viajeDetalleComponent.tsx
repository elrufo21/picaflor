import { Autocomplete, TextField } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useEffect, useRef } from "react";
import { usePackageData } from "../../hooks/usePackageData";
import { TextControlled } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import { usePackageStore } from "../../store/cityTourStore";
import { useParams } from "react-router";

const TARIFA_CITY_OPTIONS = [
  { value: "INCLUYE ENTRADA", label: "INCLUYE ENTRADA" },
  { value: "NO INCLUYE ENTRADA", label: "NO INCLUYE ENTRADA" },
];

/* =============================================
   COMPONENTE REUTILIZABLE: TableRow
============================================= */
const TableRow = ({
  rowKey,
  label,
  bgColor = "bg-orange-500",
  control,
  isEditing,
  options = [],
  showSelect = false,
  canEditPrecio = true,
  canEditCant = true,
  onPrecioChange,
  onCantChange,
  onServiceChange,
}) => {
  const precio = useWatch({ control, name: `detalle.${rowKey}.precio` });
  const cant = useWatch({ control, name: `detalle.${rowKey}.cant` });
  const total = useWatch({ control, name: `detalle.${rowKey}.total` });

  return (
    <div className="border-b">
      {/* MOBILE */}
      <div className="md:hidden p-3 space-y-3">
        <span className={`${bgColor} text-white text-xs px-2 py-1 rounded`}>
          {label}
        </span>

        {showSelect && (
          <>
            <label className="text-xs font-semibold">Detalle</label>
            <Controller
              name={`detalle.${rowKey}.servicio`}
              control={control}
              render={({ field }) => (
                <select
                  className="w-full border rounded px-2 py-1"
                  value={field.value?.value ?? ""}
                  onChange={(e) => {
                    if (!isEditing) return;
                    const value = e.target.value;
                    field.onChange({ value, label: value });
                    onServiceChange?.(rowKey, { value, label: value });
                  }}
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </>
        )}

        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            className="border px-2 py-1 text-right"
            value={precio || ""}
            disabled={!isEditing || !canEditPrecio}
            onChange={(e) =>
              onPrecioChange(rowKey, Number(e.target.value || 0))
            }
          />

          <input
            type="number"
            className="border px-2 py-1 text-right"
            value={cant || ""}
            disabled={!isEditing || !canEditCant}
            onChange={(e) => onCantChange(rowKey, Number(e.target.value || 0))}
          />

          <div className="border px-2 py-1 text-right font-bold bg-slate-50">
            {total && Number(total) !== 0 ? formatCurrency(total) : null}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:grid grid-cols-[160px_1fr_120px_120px_120px]">
        <div className="flex items-center px-2">
          <span className={`${bgColor} text-white text-xs px-2 py-1 rounded`}>
            {label}
          </span>
        </div>

        <div className="border-l p-1">
          {showSelect ? (
            <Controller
              name={`detalle.${rowKey}.servicio`}
              control={control}
              render={({ field }) => (
                <select
                  className="w-full border rounded px-2 py-1"
                  value={field.value?.value ?? ""}
                  onChange={(e) => {
                    if (!isEditing) return;
                    const value = e.target.value;
                    field.onChange({ value, label: value });
                    onServiceChange?.(rowKey, { value, label: value });
                  }}
                >
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          ) : (
            <div className="p-2">-</div>
          )}
        </div>

        <div className="border-l p-1">
          <input
            type="number"
            className="w-full border px-2 py-1 text-right"
            value={precio || ""}
            disabled={!isEditing || !canEditPrecio}
            onChange={(e) =>
              onPrecioChange(rowKey, Number(e.target.value || 0))
            }
          />
        </div>

        <div className="border-l p-1">
          <input
            type="number"
            className="w-full border px-2 py-1 text-right"
            value={cant || ""}
            disabled
            onChange={(e) => onCantChange(rowKey, Number(e.target.value || 0))}
          />
        </div>

        <div className="border-l p-2 text-right font-bold">
          {total && Number(total) !== 0 ? formatCurrency(total) : null}
        </div>
      </div>
    </div>
  );
};

/* =============================================
   COMPONENTE PRINCIPAL
============================================= */
const ViajeDetalleComponent = ({ control, setValue, getValues, watch }) => {
  const { idProduct } = useParams();
  const { isEditing } = usePackageStore();
  const { partidas, hoteles, horasPartida, precioProducto, direccionesHotel } =
    usePackageData(idProduct, setValue);

  const cantPax = Number(watch("cantPax") || 0);
  const disponibles = Number(watch("disponibles") ?? 0);

  const tarifaInicializadaRef = useRef(false);
  const prevCantPaxRef = useRef(null);
  const enteredEditModePrecioRef = useRef(false);
  const prevPrecioRef = useRef<number | null>(null);

  /* =========================
     EFFECTS
  ========================= */
  useEffect(() => {
    const precioActual = Number(getValues("detalle.tarifa.precio")) || 0;

    // Entramos a edición → NO tocar precio
    if (isEditing && !enteredEditModePrecioRef.current) {
      enteredEditModePrecioRef.current = true;
      prevPrecioRef.current = precioActual;
      return;
    }

    // Salimos de edición
    if (!isEditing) {
      enteredEditModePrecioRef.current = false;
      return;
    }

    // Si ya hay precio, NO inicializar
    if (precioActual > 0) return;

    // Inicializar SOLO si está vacío
    if (!precioProducto?.precioBase) return;

    const base = roundCurrency(Number(precioProducto.precioBase));

    setValue("detalle.tarifa.precio", base, { shouldDirty: false });

    const cant = Number(getValues("detalle.tarifa.cant")) || 1;
    setValue("detalle.tarifa.total", roundCurrency(base * cant), {
      shouldDirty: false,
    });
  }, [isEditing, precioProducto, getValues, setValue]);

  useEffect(() => {
    if (!isEditing) return;
    if (disponibles <= 0) return;
    if (cantPax <= disponibles) return;

    showToast({
      title: "Alerta",
      description: "No puedes superar la cantidad de asientos disponibles.",
      type: "error",
    });
    setValue("cantPax", 0);
  }, [cantPax, disponibles, setValue, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    if (!precioProducto?.precioVenta) return;

    const tarifa = getValues("detalle.tarifa");

    if (
      tarifaInicializadaRef.current &&
      tarifa?.precio > 0 &&
      tarifa?.cant > 0
    ) {
      return;
    }

    const base = roundCurrency(Number(precioProducto.precioVenta));

    setValue("detalle.tarifa.precioBase", base);
    setValue("detalle.tarifa.precio", base);
    setValue("detalle.tarifa.cant", cantPax || 0);
    setValue("detalle.tarifa.total", roundCurrency(base * (cantPax || 0)));

    tarifaInicializadaRef.current = true;
  }, [precioProducto, cantPax, isEditing, getValues, setValue]);

  const totales = useWatch({
    control,
    name: ["detalle.tarifa.total"],
  });

  useEffect(() => {
    const suma = totales.reduce((acc, v) => acc + Number(v || 0), 0);
    setValue("precioTotal", roundCurrency(suma));
  }, [totales, setValue]);

  const tarifaServicio = useWatch({
    control,
    name: "detalle.tarifa.servicio",
  });

  useEffect(() => {
    if (!isEditing) return;

    if (!tarifaServicio || tarifaServicio.value === "") {
      setValue("detalle.tarifa.precio", 0, { shouldDirty: true });
      setValue("detalle.tarifa.total", 0, { shouldDirty: true });
    }
  }, [tarifaServicio, isEditing, setValue]);

  const enteredEditModeRef = useRef(false);

  useEffect(() => {
    // Entramos a modo edición
    if (isEditing && !enteredEditModeRef.current) {
      enteredEditModeRef.current = true;
      prevCantPaxRef.current = cantPax;
      return;
    }

    // Salimos de edición
    if (!isEditing) {
      enteredEditModeRef.current = false;
      return;
    }

    // Si cantPax no cambió, NO tocar cantidad
    if (prevCantPaxRef.current === cantPax) return;

    prevCantPaxRef.current = cantPax;

    const precio = Number(getValues("detalle.tarifa.precio")) || 0;

    setValue("detalle.tarifa.cant", cantPax, { shouldDirty: true });
    setValue("detalle.tarifa.total", roundCurrency(precio * cantPax), {
      shouldDirty: true,
    });
  }, [cantPax, isEditing, getValues, setValue]);

  /* =========================
     HANDLERS
  ========================= */
  const handlePrecioChange = (rowKey, value) => {
    if (!isEditing) return;

    const rounded = roundCurrency(value);
    setValue(`detalle.${rowKey}.precio`, rounded);

    const cant = Number(getValues(`detalle.${rowKey}.cant`)) || 0;
    setValue(`detalle.${rowKey}.total`, roundCurrency(rounded * cant));
  };

  const handleCantidadChange = (rowKey, value) => {
    if (!isEditing) return;

    let cant = Math.min(value, cantPax);

    setValue(`detalle.${rowKey}.cant`, cant);

    const precio = Number(getValues(`detalle.${rowKey}.precio`)) || 0;
    setValue(`detalle.${rowKey}.total`, roundCurrency(precio * cant));
  };

  const handleServiceChange = (rowKey, option) => {
    // Lógica específica si es necesario
  };
  useEffect(() => {
    const servicio = getValues("detalle.tarifa.servicio");

    // Si ya tiene valor, NO tocar (respeta edición)
    if (servicio?.value) return;

    // Set default SOLO si está vacío
    setValue(
      "detalle.tarifa.servicio",
      { value: "INCLUYE ENTRADA", label: "INCLUYE ENTRADA" },
      { shouldDirty: false },
    );
  }, [getValues, setValue]);

  const handleHotelChange = (idHotel) => {
    const direccion = direccionesHotel?.find(
      (d) => d.idHotel == Number(idHotel),
    );
    setValue("otrosPartidas", direccion?.direccion);
  };

  const puntoPartida = watch("puntoPartida");
  const isHotel = puntoPartida === "HOTEL";
  const isOtros = puntoPartida === "OTROS";

  useEffect(() => {
    if (!isEditing) return;
    if (isHotel) {
      setValue("otrosPartidas", "", { shouldDirty: true });
      return;
    }

    if (isOtros) {
      setValue("hotel", null, { shouldDirty: true });
      return;
    }
    setValue("hotel", null, { shouldDirty: true });
    setValue("otrosPartidas", "", { shouldDirty: true });
  }, [isHotel, isOtros, setValue, isEditing]);

  return (
    <div className="p-2.5 space-y-3">
      {/* PARTIDA / HOTEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        <label className="flex flex-col text-sm md:col-span-3">
          <span className="font-semibold mb-1">Punto partida</span>

          <Controller
            name="puntoPartida"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <select
                {...field}
                className="rounded-lg border px-2.5 py-1.5"
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  field.onChange(selectedValue);

                  const partida = partidas?.find(
                    (p) => p.value === selectedValue,
                  );
                  const hora =
                    horasPartida?.find(
                      (h) => String(h.idParti) === String(partida?.id),
                    )?.hora ?? "";

                  setValue("horaPartida", hora, { shouldDirty: true });
                }}
              >
                <option value="">Seleccione</option>
                <option value="HOTEL">Hotel</option>
                <option value="OTROS">Otros</option>

                {partidas?.map((p) => (
                  <option key={p.id} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}
          />
        </label>

        <label className="flex flex-col text-sm md:col-span-2">
          <span className="font-semibold mb-1">Hotel</span>

          <Controller
            name="hotel"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={hoteles || []}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(o, v) => o.value === v?.value}
                size="small"
                value={field.value || null}
                disabled={!isHotel && !isOtros}
                onChange={(_, option) => {
                  if (!option) {
                    field.onChange(null);
                    return;
                  }

                  handleHotelChange(option.value);
                  field.onChange(option);
                  setTimeout(() => {
                    document.querySelector("#otrosPartidas")?.focus();
                  }, 0);
                }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="-" />
                )}
              />
            )}
          />
        </label>

        <label className="flex flex-col text-sm sm:col-span-2 md:col-span-5">
          <span className="font-semibold mb-1">Otros partidas</span>
          <TextControlled
            control={control}
            id="otrosPartidas"
            name="otrosPartidas"
            className="rounded-lg"
            transform={(value) => value.toUpperCase()}
            size="small"
            disableHistory
          />
        </label>

        <label className="flex flex-col text-sm md:col-span-5">
          <span className="font-semibold mb-1">Visitas y excursiones</span>
          <textarea
            rows={4}
            disabled
            className="rounded-lg border px-2 py-1.5"
            value={precioProducto?.visitas || ""}
          />
        </label>
      </div>

      {/* TABLA */}
      <div
        data-grid-form
        className="w-full border border-black text-sm overflow-x-auto"
      >
        <div className="hidden md:grid grid-cols-[160px_1fr_120px_120px_120px] border-b font-bold">
          <div />
          <div className="border-l p-2">Detalle</div>
          <div className="border-l p-2 text-center">Precio</div>
          <div className="border-l p-2 text-center">Cant</div>
          <div className="border-l p-2 text-center">SubTotal</div>
        </div>

        <TableRow
          rowKey="tarifa"
          label="Tarifa Tour"
          bgColor="bg-orange-500"
          control={control}
          isEditing={isEditing}
          showSelect={true}
          options={TARIFA_CITY_OPTIONS}
          canEditPrecio={true}
          canEditCant={true}
          onPrecioChange={handlePrecioChange}
          onCantChange={handleCantidadChange}
          onServiceChange={handleServiceChange}
        />
      </div>
    </div>
  );
};

export default ViajeDetalleComponent;
