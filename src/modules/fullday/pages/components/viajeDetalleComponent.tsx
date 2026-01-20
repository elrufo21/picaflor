import { Autocomplete, TextField } from "@mui/material";
import { Controller, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { usePackageData } from "../../hooks/usePackageData";
import { TextControlled } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { moveFocus } from "@/shared/helpers/helpers";
import { usePackageStore } from "../../store/fulldayStore";
import { TimeAMPMInput } from "@/components/ui/inputs/TimeAMPMInput";
import { useParams } from "react-router";

const ViajeDetalleComponent = ({ control, setValue, getValues, watch }) => {
  const { idProduct } = useParams();
  const { isEditing } = usePackageStore();
  const {
    partidas,
    hoteles,
    actividades,
    trasladosOptions,
    horasPartida,
    preciosActividades,
    precioProducto,
    almuerzos,
    preciosAlmuerzo,
    preciosTraslado,
    direccionesHotel,
  } = usePackageData(idProduct, setValue);

  /* =========================
     CANTIDAD GLOBAL
  ========================= */
  const cantPax = Number(watch("cantPax") || 0);
  const disabledByCantPax = cantPax <= 0;
  const TIME_EDITABLE_POSITIONS = [0, 1, 3, 4, 5, 6];
  const TIME_DEFAULT_VALUE = "__:____";
  const getTimeChars = (value: string = TIME_DEFAULT_VALUE) => {
    const normalized = value.padEnd(7, "_").slice(0, 7).split("");
    normalized[2] = ":";
    return normalized;
  };

  /* =========================
     PRECIOS
  ========================= */
  const getPrecioActividad = (id) => {
    const p = preciosActividades?.find((x) => String(x.idActi) === String(id));
    return p ? Number(p.precioSol || 0) + Number(p.entradaSol || 0) : 0;
  };

  const getPrecioAlmuerzo = (id) => {
    const p = preciosAlmuerzo?.find((x) => String(x.id) === String(id));
    return Number(p?.precioSol || 0);
  };

  const getPrecioTraslado = (id) => {
    const p = preciosTraslado?.find((x) => String(x.id) === String(id));
    return Number(p?.precioSol || 0);
  };

  /* =========================
     SUBTOTAL
  ========================= */
  const SubTotal = ({ name }) => {
    const total = useWatch({ control, name });
    return <>{Number(total || 0).toFixed(2)}</>;
  };

  /* =========================
     INICIAL TARIFA
  ========================= */
  useEffect(() => {
    if (!precioProducto?.precioVenta) return;

    const base = Number(precioProducto.precioVenta);

    setValue("detalle.tarifa.precioBase", base);
    setValue("detalle.tarifa.precio", base);
    setValue("detalle.tarifa.cant", cantPax);
    setValue("detalle.tarifa.total", base * cantPax);
  }, [precioProducto, cantPax, setValue]);

  /* =========================
     ACTIVIDADES YA USADAS
  ========================= */
  const actividadesSeleccionadas = [
    getValues("detalle.act1.servicio")?.value,
    getValues("detalle.act2.servicio")?.value,
    getValues("detalle.act3.servicio")?.value,
  ].filter(Boolean);
  const BALLESTAS_LABEL = "EXCURSIÓN ISLAS BALLESTAS";
  const isBallestasSelected = actividadesSeleccionadas.some(
    (value) =>
      String(value || "").toLocaleUpperCase() ===
      BALLESTAS_LABEL.toLocaleUpperCase(),
  );

  const rows = [
    { key: "act1", label: "Actividad 1", options: actividades },
    { key: "act2", label: "Actividad 2", options: actividades },
    { key: "act3", label: "Actividad 3", options: actividades },
    { key: "traslado", label: "Traslados", options: trasladosOptions },
    { key: "entrada", label: "Entradas", input: true },
  ];
  const totales = useWatch({
    control,
    name: [
      "detalle.tarifa.total",
      "detalle.act1.total",
      "detalle.act2.total",
      "detalle.act3.total",
      "detalle.traslado.total",
      "detalle.entrada.total",
    ],
  });
  useEffect(() => {
    const suma = (totales || []).reduce(
      (acc, val) => acc + Number(val || 0),
      0,
    );

    setValue("precioTotal", Number(suma.toFixed(2)));
  }, [totales, setValue]);

  const BALLESTAS_ENTRADA_DETAIL = "IMPTOS DE ISLAS + MUELLE";
  const BALLESTAS_ENTRADA_PRICE = 16;

  useEffect(() => {
    if (!isBallestasSelected) return;

    setValue("detalle.entrada.servicio", BALLESTAS_ENTRADA_DETAIL, {
      shouldDirty: true,
    });
    setValue("detalle.entrada.precio", BALLESTAS_ENTRADA_PRICE, {
      shouldDirty: true,
    });
    setValue("detalle.entrada.cant", cantPax, {
      shouldDirty: true,
    });
    setValue("detalle.entrada.total", BALLESTAS_ENTRADA_PRICE * cantPax, {
      shouldDirty: true,
    });
  }, [cantPax, isBallestasSelected, setValue]);

  useEffect(() => {
    if (isBallestasSelected) return;

    const currentServicio = getValues("detalle.entrada.servicio") ?? "";
    const currentPrecio = Number(getValues("detalle.entrada.precio") ?? 0);
    const currentCant = Number(getValues("detalle.entrada.cant") ?? 0);
    const currentTotal = Number(getValues("detalle.entrada.total") ?? 0);

    if (
      currentServicio === BALLESTAS_ENTRADA_DETAIL &&
      currentPrecio === BALLESTAS_ENTRADA_PRICE &&
      currentCant === cantPax &&
      currentTotal === BALLESTAS_ENTRADA_PRICE * cantPax
    ) {
      setValue("detalle.entrada.servicio", "", {
        shouldDirty: true,
      });
      setValue("detalle.entrada.precio", 0, {
        shouldDirty: true,
      });
      setValue("detalle.entrada.cant", 0, {
        shouldDirty: true,
      });
      setValue("detalle.entrada.total", 0, {
        shouldDirty: true,
      });
    }
  }, [cantPax, getValues, isBallestasSelected, setValue]);

  const handleHotelChange = (idHotel: string) => {
    console.log("idHotel", idHotel);
    const direccion = direccionesHotel?.find(
      (d) => d.idHotel == Number(idHotel),
    );
    setValue("otrosPartidas", direccion?.direccion);
    console.log("direccion", direccion);
  };

  const handleKeyNav = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(e.currentTarget, "next");
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(e.currentTarget, "prev");
    }
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
  }, [isHotel, isOtros, setValue]);

  return (
    <div className="p-2.5 space-y-3">
      {/* =========================
          PARTIDA / HOTEL
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
        <label className="flex flex-col text-sm col-span-2">
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
                }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="-" />
                )}
              />
            )}
          />
        </label>

        <label className="flex flex-col text-sm md:col-span-4">
          <span className="font-semibold mb-1">Otros partidas</span>
          <TextControlled
            control={control}
            name="otrosPartidas"
            className="rounded-lg "
            size="small"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="font-semibold mb-1">Hora P.</span>

          <TimeAMPMInput name="horaPartida" control={control} />
        </label>

        <label className="flex flex-col text-sm md:col-span-5">
          <span className="font-semibold mb-1">Visitas y excursiones</span>
          <textarea
            rows={2}
            disabled
            className="rounded-lg border px-2 py-1.5"
            value={precioProducto?.visitas}
          />
        </label>
      </div>

      {/* =========================
          TABLA
      ========================= */}
      <div
        data-grid-form
        className="w-full border border-black text-sm overflow-x-auto"
      >
        {/* HEADER (solo desktop) */}
        <div className="hidden md:grid grid-cols-[160px_1fr_120px_120px_120px] border-b font-bold">
          <div />
          <div className="border-l p-2">Detalle</div>
          <div className="border-l p-2 text-center">Precio</div>
          <div className="border-l p-2 text-center">Cant</div>
          <div className="border-l p-2 text-center">SubTotal</div>
        </div>

        {/* ========================= TARIFA ========================= */}
        <div className="border-b">
          {/* Mobile Layout */}
          <div className="md:hidden p-3 space-y-3">
            <div>
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded inline-block mb-2">
                Tarifa Tour
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Detalle
              </label>
              <Controller
                name="detalle.tarifa.servicio"
                control={control}
                render={({ field }) => (
                  <select
                    className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                    value={field.value?.value ?? ""}
                    onChange={(e) => {
                      if (cantPax <= 0) {
                        showToast({
                          title: "Alerta",
                          description: "Añade un pasajero por lo menos.",
                          type: "error",
                        });
                        return;
                      }

                      const sel =
                        almuerzos?.find((a) => a.value === e.target.value) ??
                        null;
                      field.onChange(sel);

                      const adicional = sel ? getPrecioAlmuerzo(sel.id) : 0;
                      const base =
                        Number(getValues("detalle.tarifa.precioBase")) || 0;
                      const precio = base + adicional;

                      setValue("detalle.tarifa.precio", precio);
                      setValue("detalle.tarifa.cant", cantPax);
                      setValue("detalle.tarifa.total", precio * cantPax);
                    }}
                  >
                    <option value="">(SELECCIONE)</option>
                    {almuerzos?.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
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
                  name="detalle.tarifa.precio"
                  control={control}
                  render={({ field }) => (
                    <input
                      data-precio
                      className="w-full border px-2 py-1 text-right bg-slate-100"
                      onKeyDown={handleKeyNav}
                      value={field.value === 0 ? "" : (field.value ?? "")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(raw === "" ? 0 : Number(raw));
                      }}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Cant</label>
                <input
                  value={cantPax}
                  readOnly
                  className="w-full border px-2 py-1 text-right bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  SubTotal
                </label>
                <div className="w-full border px-2 py-1 text-right font-bold bg-slate-50">
                  <SubTotal name="detalle.tarifa.total" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-[160px_1fr_120px_120px_120px]">
            <div className="flex items-center px-2">
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                Tarifa Tour
              </span>
            </div>

            <div className="border-l p-1">
              <Controller
                name="detalle.tarifa.servicio"
                control={control}
                render={({ field }) => (
                  <select
                    className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                    value={field.value?.value ?? ""}
                    onChange={(e) => {
                      if (cantPax <= 0) {
                        showToast({
                          title: "Alerta",
                          description: "Añade un pasajero por lo menos.",
                          type: "error",
                        });
                        return;
                      }

                      const sel =
                        almuerzos?.find((a) => a.value === e.target.value) ??
                        null;
                      field.onChange(sel);

                      const adicional = sel ? getPrecioAlmuerzo(sel.id) : 0;
                      const base =
                        Number(getValues("detalle.tarifa.precioBase")) || 0;
                      const precio = base + adicional;

                      setValue("detalle.tarifa.precio", precio);
                      setValue("detalle.tarifa.cant", cantPax);
                      setValue("detalle.tarifa.total", precio * cantPax);
                    }}
                  >
                    <option value="">(SELECCIONE)</option>
                    {almuerzos?.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="border-l p-1">
              <Controller
                name="detalle.tarifa.precio"
                control={control}
                render={({ field }) => (
                  <input
                    data-precio
                    className="w-full border px-2 py-1 text-right bg-slate-100"
                    onKeyDown={handleKeyNav}
                    value={field.value === 0 ? "" : (field.value ?? "")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(raw === "" ? 0 : Number(raw));
                    }}
                  />
                )}
              />
            </div>

            <div className="border-l p-1">
              <input
                value={cantPax}
                readOnly
                className="w-full border px-2 py-1 text-right bg-slate-100"
              />
            </div>

            <div className="border-l p-2 text-right font-bold">
              <SubTotal name="detalle.tarifa.total" />
            </div>
          </div>
        </div>

        {/* ========================= OTRAS FILAS ========================= */}
        {rows.map((row) => (
          <div key={row.key} className="border-b">
            {/* Mobile Layout */}
            <div className="md:hidden p-3 space-y-3">
              <div>
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded inline-block mb-2">
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
                  render={({ field }) =>
                    row.input ? (
                      <input
                        {...field}
                        className="w-full border px-2 py-1"
                        disabled={row.key === "entrada" && isBallestasSelected}
                      />
                    ) : (
                      <select
                        className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                        value={field.value?.value ?? ""}
                        onChange={(e) => {
                          if (cantPax <= 0 && e.target.value !== "") {
                            showToast({
                              title: "Alerta",
                              description: "Añade un pasajero por lo menos.",
                              type: "error",
                            });
                            return;
                          }

                          const selected =
                            row.options?.find(
                              (o) => o.value === e.target.value,
                            ) ?? null;
                          field.onChange(selected);

                          let precio = 0;
                          if (row.key === "traslado") {
                            precio = selected
                              ? getPrecioTraslado(selected.id)
                              : 0;
                          } else {
                            precio = selected
                              ? getPrecioActividad(selected.id)
                              : 0;
                          }

                          setValue(`detalle.${row.key}.precio`, precio);
                          setValue(`detalle.${row.key}.cant`, cantPax);
                          setValue(
                            `detalle.${row.key}.total`,
                            precio * cantPax,
                          );
                        }}
                      >
                        <option value="-">-</option>
                        {row.options
                          ?.filter(
                            (o) =>
                              !row.key.startsWith("act") ||
                              !actividadesSeleccionadas.includes(o.value) ||
                              field.value?.value === o.value,
                          )
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                    )
                  }
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
                        data-precio
                        className="w-full border px-2 py-1 text-right"
                        onKeyDown={handleKeyNav}
                        value={field.value === 0 ? "" : (field.value ?? "")}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const precio = raw === "" ? 0 : Number(raw);
                          field.onChange(precio);
                          setValue(
                            `detalle.${row.key}.total`,
                            precio * cantPax,
                          );
                        }}
                        onBlur={() => {
                          if (!field.value) field.onChange(0);
                        }}
                        disabled={row.key === "entrada" && isBallestasSelected}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Cant
                  </label>
                  <input
                    value={cantPax}
                    readOnly
                    className="w-full border px-2 py-1 text-right bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    SubTotal
                  </label>
                  <div className="w-full border px-2 py-1 text-right font-bold bg-slate-50">
                    <SubTotal name={`detalle.${row.key}.total`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-[160px_1fr_120px_120px_120px]">
              <div className="flex items-center px-2">
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  {row.label}
                </span>
              </div>

              <div className="border-l p-1">
                <Controller
                  name={`detalle.${row.key}.servicio`}
                  control={control}
                  render={({ field }) =>
                    row.input ? (
                      <input
                        {...field}
                        className="w-full border px-2 py-1"
                        disabled={row.key === "entrada" && isBallestasSelected}
                      />
                    ) : (
                      <select
                        className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                        value={field.value?.value ?? ""}
                        onChange={(e) => {
                          if (cantPax <= 0 && e.target.value !== "") {
                            showToast({
                              title: "Alerta",
                              description: "Añade un pasajero por lo menos.",
                              type: "error",
                            });
                            return;
                          }

                          const selected =
                            row.options?.find(
                              (o) => o.value === e.target.value,
                            ) ?? null;
                          field.onChange(selected);

                          let precio = 0;
                          if (row.key === "traslado") {
                            precio = selected
                              ? getPrecioTraslado(selected.id)
                              : 0;
                          } else {
                            precio = selected
                              ? getPrecioActividad(selected.id)
                              : 0;
                          }

                          setValue(`detalle.${row.key}.precio`, precio);
                          setValue(`detalle.${row.key}.cant`, cantPax);
                          setValue(
                            `detalle.${row.key}.total`,
                            precio * cantPax,
                          );
                        }}
                      >
                        <option value="-">-</option>
                        {row.options
                          ?.filter(
                            (o) =>
                              !row.key.startsWith("act") ||
                              !actividadesSeleccionadas.includes(o.value) ||
                              field.value?.value === o.value,
                          )
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                    )
                  }
                />
              </div>

              <div className="border-l p-1">
                <Controller
                  name={`detalle.${row.key}.precio`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      data-precio
                      className="w-full border px-2 py-1 text-right"
                      onKeyDown={handleKeyNav}
                      value={field.value === 0 ? "" : (field.value ?? "")}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const precio = raw === "" ? 0 : Number(raw);
                        field.onChange(precio);
                        setValue(`detalle.${row.key}.total`, precio * cantPax);
                      }}
                      onBlur={() => {
                        if (!field.value) field.onChange(0);
                      }}
                      disabled={row.key === "entrada" && isBallestasSelected}
                    />
                  )}
                />
              </div>

              <div className="border-l p-1">
                <input
                  value={cantPax}
                  readOnly
                  className="w-full border px-2 py-1 text-right bg-slate-100"
                />
              </div>

              <div className="border-l p-2 text-right font-bold">
                <SubTotal name={`detalle.${row.key}.total`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViajeDetalleComponent;
