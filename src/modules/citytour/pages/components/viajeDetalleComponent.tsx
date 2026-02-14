import { Autocomplete, TextField } from "@mui/material";
import { Controller, useWatch } from "react-hook-form";
import { useEffect, useMemo, useRef } from "react";
import { usePackageData } from "../../hooks/usePackageData";
import { TextControlled } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import { normalizeLegacyXmlPayload } from "@/shared/helpers/normalizeLegacyXmlPayload";
import { usePackageStore } from "../../store/cityTourStore";
import { useParams } from "react-router";

type ActivityRowKey = "act1" | "act2" | "act3";
type ActivityOption = {
  value: string;
  label: string;
  id?: string;
  precioVenta?: number;
  precioBase?: number;
  visitas?: string;
};

const ACTIVITY_ROWS: { key: ActivityRowKey; label: string }[] = [
  { key: "act1", label: "Actividad 1" },
  { key: "act2", label: "Actividad 2" },
  { key: "act3", label: "Actividad 3" },
];

const TURNOS = ["AM", "PM"];
const FIXED_ACTIVITY_KEY: ActivityRowKey = "act1";

const ViajeDetalleComponent = ({ control, setValue, getValues, watch }) => {
  const { idProduct } = useParams();
  const { isEditing } = usePackageStore();
  const {
    partidas,
    hoteles,
    horasPartida,
    precioProducto,
    direccionesHotel,
    productosCityTourDetalle,
  } = usePackageData(idProduct, setValue);
  const cantPax = Number(watch("cantPax") || 0);
  const disponibles = Number(watch("disponibles") ?? 0);
  const prevCantPaxRef = useRef<number | null>(null);
  const productOptions = useMemo<ActivityOption[]>(
    () =>
      (productosCityTourDetalle || [])
        .map((producto) => ({
          value: String(producto.id),
          label: normalizeLegacyXmlPayload(
            String(producto.nombre ?? ""),
          ).trim(),
          id: String(producto.id),
          precioVenta: Number(producto.precioVenta || 0),
          precioBase: Number(producto.precioBase || 0),
          visitas: normalizeLegacyXmlPayload(
            String(producto.visitas ?? ""),
          ).trim(),
        }))
        .filter((option) => option.value && option.label),
    [productosCityTourDetalle],
  );

  const serviciosWatch = useWatch({
    control,
    name: [
      "detalle.act1.servicio",
      "detalle.act2.servicio",
      "detalle.act3.servicio",
    ],
  });
  const visitasValue = watch("visitas") || "";

  const totales = useWatch({
    control,
    name: ["detalle.act1.total", "detalle.act2.total", "detalle.act3.total"],
  });

  const selectedActivityValues = (serviciosWatch || [])
    .map((servicio) => String(servicio?.value ?? "").trim())
    .filter(Boolean);

  const fixedProductOption = useMemo(() => {
    const fixedId = String(precioProducto?.id ?? "").trim();
    if (!fixedId) return null;
    return (
      productOptions.find((option) => String(option.value) === fixedId) ?? null
    );
  }, [productOptions, precioProducto?.id]);

  const SubTotal = ({ name, visible = true }) => {
    const total = useWatch({ control, name });

    if (!visible || !total || Number(total) === 0) return null;
    return <>{formatCurrency(total)}</>;
  };

  const getPrecioActividad = (option: ActivityOption | null) => {
    if (!option) return 0;
    const precioVenta = Number(option.precioVenta || 0);
    const precioBase = Number(option.precioBase || 0);
    const precio = precioVenta > 0 ? precioVenta : precioBase;
    return roundCurrency(precio);
  };

  const isRowInactive = (rowKey: ActivityRowKey) => {
    const servicio = getValues(`detalle.${rowKey}.servicio`);
    return !servicio || !servicio.value;
  };

  const isRowLocked = (rowKey: ActivityRowKey) => rowKey === FIXED_ACTIVITY_KEY;

  const handlePrecioChange = (rowKey: ActivityRowKey, value: number) => {
    if (!isEditing) return;

    const rounded = roundCurrency(value);
    const cant = Number(getValues(`detalle.${rowKey}.cant`)) || 0;

    setValue(`detalle.${rowKey}.precio`, rounded, { shouldDirty: true });
    setValue(`detalle.${rowKey}.total`, roundCurrency(rounded * cant), {
      shouldDirty: true,
    });
  };

  const handleServiceChange = (
    rowKey: ActivityRowKey,
    value: string,
    onChange: (value: ActivityOption | null) => void,
  ) => {
    if (!isEditing || isRowLocked(rowKey)) return;

    if (cantPax <= 0 && value !== "") {
      showToast({
        title: "Alerta",
        description: "Anade un pasajero por lo menos.",
        type: "error",
      });
      return;
    }

    const selected =
      (productOptions || []).find((option) => option.value === value) ?? null;
    onChange(selected);

    if (!selected) {
      setValue(`detalle.${rowKey}.turno`, "", { shouldDirty: true });
      setValue(`detalle.${rowKey}.precio`, 0, { shouldDirty: true });
      setValue(`detalle.${rowKey}.cant`, 0, { shouldDirty: true });
      setValue(`detalle.${rowKey}.total`, 0, { shouldDirty: true });
      return;
    }

    const precio = getPrecioActividad(selected);
    setValue(`detalle.${rowKey}.precio`, precio, { shouldDirty: true });
    setValue(`detalle.${rowKey}.cant`, cantPax, { shouldDirty: true });
    setValue(`detalle.${rowKey}.total`, roundCurrency(precio * cantPax), {
      shouldDirty: true,
    });
  };

  const getActivityOptions = (
    rowKey: ActivityRowKey,
    currentValue: string,
  ): (ActivityOption & { descripcion?: string })[] => {
    if (isRowLocked(rowKey)) {
      return fixedProductOption ? [fixedProductOption] : [];
    }

    return (productOptions || []).filter((option) => {
      const value = String(option.value ?? "").trim();
      if (!value) return false;
      if (value === String(currentValue ?? "").trim()) return true;
      return !selectedActivityValues.includes(value);
    });
  };

  const getTurnoOptions = () => TURNOS;

  const handleKeyNav = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    e.preventDefault();
    const container = e.currentTarget.closest("[data-grid-form]");
    if (!container) return;

    const sameColumnInputs = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        'input[data-nav-col="precio"]:not([disabled])',
      ),
    ).filter((el) => el.offsetParent !== null);

    const currentIndex = sameColumnInputs.indexOf(e.currentTarget);
    if (currentIndex === -1) return;

    const nextIndex = e.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
    const target = sameColumnInputs[nextIndex];
    target?.focus();
  };

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
    const suma = (totales || []).reduce(
      (acc, val) => acc + Number(val || 0),
      0,
    );
    setValue("precioTotal", roundCurrency(suma));
  }, [totales, setValue]);

  useEffect(() => {
    const selectedValues = (serviciosWatch || [])
      .map((servicio) => String(servicio?.value ?? "").trim())
      .filter(Boolean);

    const visitasProductos = selectedValues
      .map(
        (value) =>
          productOptions?.find((producto) => String(producto.value) === value)
            ?.visitas,
      )
      .map((visitasProducto) =>
        normalizeLegacyXmlPayload(String(visitasProducto ?? "")).trim(),
      )
      .filter((visitasProducto): visitasProducto is string =>
        Boolean(visitasProducto),
      );

    const visitasBase = normalizeLegacyXmlPayload(
      String(precioProducto?.visitas || ""),
    );

    const visitasFromActivities =
      visitasProductos.length > 0
        ? Array.from(new Set(visitasProductos)).join(" / ")
        : visitasBase;

    const currentVisitas = normalizeLegacyXmlPayload(
      String(getValues("visitas") || ""),
    );
    if (currentVisitas === visitasFromActivities) return;

    setValue("visitas", visitasFromActivities, {
      shouldDirty: true,
      shouldTouch: false,
    });
  }, [
    serviciosWatch,
    productOptions,
    precioProducto?.visitas,
    getValues,
    setValue,
  ]);

  useEffect(() => {
    if (!isEditing) {
      prevCantPaxRef.current = cantPax;
      return;
    }

    if (prevCantPaxRef.current === cantPax) return;
    prevCantPaxRef.current = cantPax;

    ACTIVITY_ROWS.forEach((row) => {
      const servicio = getValues(`detalle.${row.key}.servicio`);
      if (!servicio || !servicio.value) {
        setValue(`detalle.${row.key}.cant`, 0, { shouldDirty: true });
        setValue(`detalle.${row.key}.total`, 0, { shouldDirty: true });
        return;
      }

      const precio = Number(getValues(`detalle.${row.key}.precio`)) || 0;
      setValue(`detalle.${row.key}.cant`, cantPax, { shouldDirty: true });
      setValue(`detalle.${row.key}.total`, roundCurrency(precio * cantPax), {
        shouldDirty: true,
      });
    });
  }, [cantPax, isEditing, getValues, setValue]);

  useEffect(() => {
    if (!isEditing) return;
    if (!fixedProductOption) return;

    const currentServicio = getValues(`detalle.${FIXED_ACTIVITY_KEY}.servicio`);
    const currentValue = String(currentServicio?.value ?? "").trim();
    const fixedValue = String(fixedProductOption.value ?? "").trim();
    const defaultPrecio = getPrecioActividad(fixedProductOption);
    const currentPrecio =
      Number(getValues(`detalle.${FIXED_ACTIVITY_KEY}.precio`)) || 0;
    const targetPrecio =
      currentValue !== fixedValue ? defaultPrecio : currentPrecio;
    const targetCant = cantPax;
    const targetTotal = roundCurrency(targetPrecio * targetCant);
    const currentCant =
      Number(getValues(`detalle.${FIXED_ACTIVITY_KEY}.cant`)) || 0;
    const currentTotal =
      Number(getValues(`detalle.${FIXED_ACTIVITY_KEY}.total`)) || 0;

    if (
      currentValue === fixedValue &&
      currentPrecio === targetPrecio &&
      currentCant === targetCant &&
      currentTotal === targetTotal
    ) {
      return;
    }

    if (currentValue !== fixedValue) {
      setValue(`detalle.${FIXED_ACTIVITY_KEY}.servicio`, fixedProductOption, {
        shouldDirty: false,
      });
    }
    if (targetPrecio !== currentPrecio) {
      setValue(`detalle.${FIXED_ACTIVITY_KEY}.precio`, targetPrecio, {
        shouldDirty: false,
      });
    }
    setValue(`detalle.${FIXED_ACTIVITY_KEY}.cant`, targetCant, {
      shouldDirty: false,
    });
    setValue(`detalle.${FIXED_ACTIVITY_KEY}.total`, targetTotal, {
      shouldDirty: false,
    });
  }, [isEditing, fixedProductOption, cantPax, getValues, setValue]);

  useEffect(() => {
    if (!isEditing) return;

    ACTIVITY_ROWS.forEach((row, index) => {
      if (isRowLocked(row.key)) return;

      const servicio = serviciosWatch[index];
      const inactive = !servicio || !servicio.value;
      if (!inactive) return;

      setValue(`detalle.${row.key}.turno`, "", { shouldDirty: true });
      setValue(`detalle.${row.key}.precio`, 0, { shouldDirty: true });
      setValue(`detalle.${row.key}.cant`, 0, { shouldDirty: true });
      setValue(`detalle.${row.key}.total`, 0, { shouldDirty: true });
    });
  }, [serviciosWatch, isEditing, setValue]);

  useEffect(() => {
    if (!isEditing) return;
    if (!precioProducto) return;
    if (cantPax <= 0) return;

    ACTIVITY_ROWS.forEach((row) => {
      const servicio = getValues(`detalle.${row.key}.servicio`);
      if (!servicio || !servicio.value) return;

      const precio = Number(getValues(`detalle.${row.key}.precio`)) || 0;
      setValue(`detalle.${row.key}.cant`, cantPax, { shouldDirty: false });
      setValue(`detalle.${row.key}.total`, roundCurrency(precio * cantPax), {
        shouldDirty: false,
      });
    });
  }, [precioProducto, cantPax, isEditing, getValues, setValue]);

  const handleHotelChange = (idHotel: string) => {
    const direccion = direccionesHotel?.find(
      (direccionItem) => direccionItem.idHotel == Number(idHotel),
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
                    (partidaItem) => partidaItem.value === selectedValue,
                  );
                  const hora =
                    horasPartida?.find(
                      (horaItem) =>
                        String(horaItem.idParti) === String(partida?.id),
                    )?.hora ?? "";

                  setValue("horaPartida", hora, { shouldDirty: true });
                }}
              >
                <option value="">Seleccione</option>
                <option value="HOTEL">Hotel</option>
                <option value="OTROS">Otros</option>

                {partidas?.map((partidaItem) => (
                  <option key={partidaItem.id} value={partidaItem.value}>
                    {partidaItem.label}
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
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.value === value?.value
                }
                size="small"
                value={field.value || null}
                disabled={!isHotel}
                onChange={(_, option) => {
                  if (!option) {
                    field.onChange(null);
                    return;
                  }

                  handleHotelChange(option.value);
                  field.onChange(option);
                  setTimeout(() => {
                    document
                      .querySelector<HTMLInputElement>("#otrosPartidas")
                      ?.focus();
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
            value={visitasValue}
          />
        </label>
      </div>

      <div
        data-grid-form
        className="w-full border border-black text-sm overflow-x-auto"
      >
        <div className="hidden md:grid grid-cols-[140px_1fr_100px_120px_100px_120px] border-b font-bold">
          <div />
          <div className="border-l p-2">Detalle</div>
          <div className="border-l p-2 text-center">Turno</div>
          <div className="border-l p-2 text-center">Precio</div>
          <div className="border-l p-2 text-center">Cant</div>
          <div className="border-l p-2 text-center">SubTotal</div>
        </div>

        {ACTIVITY_ROWS.map((row) => (
          <div key={row.key} className="border-b">
            <div className="md:hidden p-3 space-y-3">
              <div>
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded inline-block">
                  {row.label}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Detalle
                </label>
                <Controller
                  name={`detalle.${row.key}.servicio`}
                  control={control}
                  render={({ field }) => (
                    <select
                      className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                      value={field.value?.value ?? ""}
                      disabled={!isEditing || isRowLocked(row.key)}
                      onChange={(e) =>
                        handleServiceChange(
                          row.key,
                          e.target.value,
                          field.onChange,
                        )
                      }
                    >
                      <option value="">(SELECCIONE)</option>
                      {getActivityOptions(row.key, field.value?.value).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Turno
                </label>
                <Controller
                  name={`detalle.${row.key}.turno`}
                  control={control}
                  render={({ field }) => (
                    <select
                      className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                      value={field.value ?? ""}
                      disabled={!isEditing || isRowInactive(row.key)}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">-</option>
                      {getTurnoOptions().map((turno) => (
                        <option key={turno} value={turno}>
                          {turno}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Precio
                  </label>
                  <Controller
                    name={`detalle.${row.key}.precio`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        data-nav-col="precio"
                        className="w-full border px-2 py-1 text-right disabled:bg-slate-100"
                        value={field.value === 0 ? "" : field.value}
                        disabled={
                          !isEditing ||
                          isRowInactive(row.key) ||
                          isRowLocked(row.key)
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          handlePrecioChange(
                            row.key,
                            raw === "" ? 0 : Number(raw || 0),
                          );
                        }}
                        onKeyDown={handleKeyNav}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Cant
                  </label>
                  <Controller
                    name={`detalle.${row.key}.cant`}
                    control={control}
                    render={({ field }) => (
                      <input
                        readOnly
                        className="w-full border px-2 py-1 text-right bg-slate-100"
                        value={field.value === 0 ? "" : field.value}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    SubTotal
                  </label>
                  <div className="w-full border px-2 py-2 text-right font-bold bg-slate-50 flex items-center justify-end min-h-[30px]">
                    <SubTotal
                      name={`detalle.${row.key}.total`}
                      visible={!isRowInactive(row.key)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-[140px_1fr_100px_120px_100px_120px]">
              <div className="flex items-center px-2">
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  {row.label}
                </span>
              </div>

              <div className="border-l p-1">
                <Controller
                  name={`detalle.${row.key}.servicio`}
                  control={control}
                  render={({ field }) => (
                    <select
                      className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                      value={field.value?.value ?? ""}
                      disabled={!isEditing || isRowLocked(row.key)}
                      onChange={(e) =>
                        handleServiceChange(
                          row.key,
                          e.target.value,
                          field.onChange,
                        )
                      }
                    >
                      <option value="">(SELECCIONE)</option>
                      {getActivityOptions(row.key, field.value?.value).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  )}
                />
              </div>

              <div className="border-l p-1">
                <Controller
                  name={`detalle.${row.key}.turno`}
                  control={control}
                  render={({ field }) => (
                    <select
                      className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                      value={field.value ?? ""}
                      disabled={!isEditing || isRowInactive(row.key)}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">-</option>
                      {getTurnoOptions().map((turno) => (
                        <option key={turno} value={turno}>
                          {turno}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="border-l p-1">
                <Controller
                  name={`detalle.${row.key}.precio`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      data-nav-col="precio"
                      className="w-full border px-2 py-1 text-right disabled:bg-slate-100"
                      value={field.value === 0 ? "" : field.value}
                      disabled={!isEditing || isRowInactive(row.key)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        handlePrecioChange(
                          row.key,
                          raw === "" ? 0 : Number(raw || 0),
                        );
                      }}
                      onKeyDown={handleKeyNav}
                    />
                  )}
                />
              </div>

              <div className="border-l p-1">
                <Controller
                  name={`detalle.${row.key}.cant`}
                  control={control}
                  render={({ field }) => (
                    <input
                      readOnly
                      className="w-full border px-2 py-1 text-right bg-slate-100"
                      value={field.value === 0 ? "" : field.value}
                    />
                  )}
                />
              </div>

              <div className="border-l p-2 text-right font-bold">
                <SubTotal
                  name={`detalle.${row.key}.total`}
                  visible={!isRowInactive(row.key)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViajeDetalleComponent;
