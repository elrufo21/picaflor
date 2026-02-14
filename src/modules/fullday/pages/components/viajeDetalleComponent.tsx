import { Autocomplete, TextField } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useEffect, useRef } from "react";
import { usePackageData } from "../../hooks/usePackageData";
import { TextControlled } from "@/components/ui/inputs";
import { showToast } from "@/components/ui/AppToast";
import { moveFocus } from "@/shared/helpers/helpers";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import { usePackageStore } from "../../store/fulldayStore";
import { TimeAMPMInput } from "@/components/ui/inputs/TimeAMPMInput";
import { useParams } from "react-router";

const ViajeDetalleComponent = ({ control, setValue, getValues, watch }) => {
  const { liquidacionId } = useParams();
  const { idProduct } = useParams();
  const { setFocus } = useForm();
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
  const serviciosWatch = useWatch({
    control,
    name: [
      "detalle.act1.servicio",
      "detalle.act2.servicio",
      "detalle.act3.servicio",
      "detalle.traslado.servicio",
    ],
  });

  const isCreateMode = !liquidacionId && !isEditing;
  const isEditMode = !!liquidacionId && isEditing;
  const isViewMode = !!liquidacionId && !isEditing;

  const actividadesCantWatch = useWatch({
    control,
    name: ["detalle.act1", "detalle.act2", "detalle.act3"],
  });

  /* =========================
     CANTIDAD GLOBAL
  ========================= */
  const cantPax = Number(watch("cantPax") || 0);
  const disabledByCantPax = cantPax <= 0;
  const disponibles = Number(watch("disponibles") ?? 0);
  const TIME_EDITABLE_POSITIONS = [0, 1, 3, 4, 5, 6];
  const TIME_DEFAULT_VALUE = "__:____";
  const getTimeChars = (value: string = TIME_DEFAULT_VALUE) => {
    const normalized = value.padEnd(7, "_").slice(0, 7).split("");
    normalized[2] = ":";
    return normalized;
  };
  const otrosPartidasRef = useRef<HTMLInputElement | null>(null);

  const isPrecioDisabled = (rowKey: string) => {
    const servicio = getValues(`detalle.${rowKey}.servicio`);

    if (!servicio || servicio.value === "-" || servicio.value === "") {
      return true;
    }

    if (
      String(servicio.value).toUpperCase() === BALLESTAS_LABEL.toUpperCase()
    ) {
      return true;
    }

    return false;
  };

  /* =========================
     PRECIOS
  ========================= */
  const getPrecioActividad = (id, label?: string) => {
    if (String(label || "").toUpperCase() === BALLESTAS_LABEL.toUpperCase()) {
      return 0;
    }

    const p = preciosActividades?.find((x) => String(x.idActi) === String(id));
    return p ? Number(p.precioSol || 0) : 0;
  };

  const getPrecioAlmuerzo = (id) => {
    const p = preciosAlmuerzo?.find((x) => String(x.id) === String(id));
    return Number(p?.precioSol || 0);
  };

  const getPrecioTraslado = (id) => {
    const p = preciosTraslado?.find((x) => String(x.id) === String(id));
    return Number(p?.precioSol || 0);
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
  }, [cantPax, disponibles, setValue]);

  /* =========================
     SUBTOTAL
  ========================= */
  const SubTotal = ({ name, visible = true }) => {
    const total = useWatch({ control, name });

    if (!visible || !total || Number(total) === 0) return null;

    return <>{formatCurrency(total)}</>;
  };

  /* =========================
     INICIAL TARIFA
  ========================= */
  useEffect(() => {
    if (!isEditing) return;
    if (precioProducto?.precioVenta === undefined) return;

    const base = roundCurrency(Number(precioProducto.precioVenta));
    const currentPrecio = roundCurrency(
      getValues("detalle.tarifa.precio") ?? 0,
    );

    setValue("detalle.tarifa.precioBase", base);
    setValue("detalle.tarifa.cant", cantPax);

    if (currentPrecio > 0) {
      setValue("detalle.tarifa.total", roundCurrency(currentPrecio * cantPax));
      return;
    }

    setValue("detalle.tarifa.precio", base);
    setValue("detalle.tarifa.total", roundCurrency(base * cantPax));
  }, [precioProducto, cantPax, getValues, setValue, isEditing]);

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

    setValue("precioTotal", roundCurrency(suma));
  }, [totales, setValue]);

  const BALLESTAS_ENTRADA_DETAIL = "IMPTOS DE ISLAS + MUELLE";
  const BALLESTAS_ENTRADA_PRICE = 16;

  useEffect(() => {
    if (!isBallestasSelected) return;

    const currentServicio = getValues("detalle.entrada.servicio");

    if (currentServicio === BALLESTAS_ENTRADA_DETAIL) return;

    setValue("detalle.entrada.servicio", BALLESTAS_ENTRADA_DETAIL, {
      shouldDirty: true,
    });
    setValue("detalle.entrada.precio", BALLESTAS_ENTRADA_PRICE, {
      shouldDirty: true,
    });
  }, [isBallestasSelected, getValues, setValue]);
  useEffect(() => {
    if (!isBallestasSelected) return;

    setValue("detalle.entrada.cant", cantPax, {
      shouldDirty: true,
    });

    setValue(
      "detalle.entrada.total",
      roundCurrency(BALLESTAS_ENTRADA_PRICE * cantPax),
      { shouldDirty: true },
    );
  }, [cantPax, isBallestasSelected, setValue]);

  useEffect(() => {
    if (!isEditing) return;

    if (!isBallestasSelected) {
      setValue("detalle.entrada.servicio", "N/A", { shouldDirty: true });
      setValue("detalle.entrada.precio", 0, { shouldDirty: true });
      setValue("detalle.entrada.cant", 0, { shouldDirty: true });
      setValue("detalle.entrada.total", 0, { shouldDirty: true });
    }
  }, [isBallestasSelected, isEditing, setValue]);

  const handleHotelChange = (idHotel: string) => {
    const direccion = direccionesHotel?.find(
      (d) => d.idHotel == Number(idHotel),
    );
    setValue("otrosPartidas", direccion?.direccion);
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
  useEffect(() => {
    if (!isEditing) return;
    if (!isOtros) return;

    setTimeout(() => {
      otrosPartidasRef.current?.focus();
    }, 0);
  }, [isOtros, isEditing]);

  const getTrasladoDashOption = () =>
    trasladosOptions?.find((o) => o.value === "-") ?? {
      value: "-",
      label: "-",
      id: "6", // fallback por seguridad
    };
  const isDissabled = () => {
    const puntoPartida = watch("puntoPartida");
    if (
      puntoPartida !== "HOTEL" &&
      puntoPartida !== "OTROS" &&
      puntoPartida !== ""
    ) {
      return true;
    }
    return false;
  };
  const isTarifaPrecioDisabled = () => {
    const servicio = getValues("detalle.tarifa.servicio");
    return !servicio || !servicio.value;
  };
  const canEditCantidad = (rowKey: string) => {
    if (!isEditing) return false;

    const indexMap: Record<string, number> = {
      act1: 0,
      act2: 1,
      act3: 2,
      traslado: 3,
    };

    const servicio = serviciosWatch[indexMap[rowKey]];

    if (!servicio || !servicio.value || servicio.value === "-") {
      return false;
    }

    return true;
  };
  useEffect(() => {
    if (!isBallestasSelected) return;

    const actBallestas = actividadesCantWatch.find(
      (a) =>
        a?.servicio?.value?.toUpperCase() === BALLESTAS_LABEL.toUpperCase(),
    );

    if (!actBallestas) return;

    const cantBallestas = Math.min(Number(actBallestas.cant || 0), cantPax);

    setValue("detalle.entrada.cant", cantBallestas, {
      shouldDirty: true,
    });

    setValue(
      "detalle.entrada.total",
      roundCurrency(BALLESTAS_ENTRADA_PRICE * cantBallestas),
      { shouldDirty: true },
    );
  }, [actividadesCantWatch, isBallestasSelected, cantPax, setValue]);

  const prevCantPaxRef = useRef<number | null>(null);

  useEffect(() => {
    // ❌ nunca en vista
    if (isViewMode) {
      prevCantPaxRef.current = cantPax;
      return;
    }

    // 👉 al entrar a editar, inicializamos el ref pero NO sincronizamos
    if (isEditMode && prevCantPaxRef.current === null) {
      prevCantPaxRef.current = cantPax;
      return;
    }

    // 👉 si NO cambió la cantidad, no hacer nada
    if (prevCantPaxRef.current === cantPax) return;

    prevCantPaxRef.current = cantPax;

    const keys = ["act1", "act2", "act3", "traslado", "entrada"];

    // 🔥 CASO ESPECIAL: cantPax = 0 → limpiar cantidades
    if (cantPax === 0) {
      keys.forEach((key) => {
        setValue(`detalle.${key}.cant`, 0, { shouldDirty: true });
        setValue(`detalle.${key}.total`, 0, { shouldDirty: true });
      });
      return;
    }

    // 👉 cambio real de usuario con cantPax > 0
    keys.forEach((key) => {
      const servicio = getValues(`detalle.${key}.servicio`);
      if (!servicio || !servicio.value || servicio.value === "-") return;

      const precio = Number(getValues(`detalle.${key}.precio`)) || 0;

      setValue(`detalle.${key}.cant`, cantPax, { shouldDirty: true });
      setValue(`detalle.${key}.total`, roundCurrency(precio * cantPax), {
        shouldDirty: true,
      });
    });
  }, [cantPax, isEditMode, isViewMode, getValues, setValue]);

  //detectar si se no hay nada en el row
  const isRowInactive = (rowKey: string) => {
    const servicio = getValues(`detalle.${rowKey}.servicio`);
    return !servicio || !servicio.value || servicio.value === "-";
  };
  const isRowEmpty = (rowKey: string) => {
    const servicio = getValues(`detalle.${rowKey}.servicio`);

    if (!servicio) return true;

    // si es string (ENTRADAS)
    if (typeof servicio === "string") {
      return servicio.trim() === "";
    }

    // si es objeto (actividades, traslado, tarifa)
    return !servicio.value || servicio.value === "-";
  };

  //setea a 0 los valores
  useEffect(() => {
    if (!isEditing) return;

    const keys = ["act1", "act2", "act3", "traslado"];

    keys.forEach((key, index) => {
      const servicio = serviciosWatch[index];

      const isInactive =
        !servicio ||
        !servicio.value ||
        servicio.value === "-" ||
        servicio === "-";

      if (!isInactive) return;

      setValue(`detalle.${key}.precio`, 0, { shouldDirty: true });
      setValue(`detalle.${key}.cant`, 0, { shouldDirty: true });
      setValue(`detalle.${key}.total`, 0, { shouldDirty: true });
    });
  }, [serviciosWatch, isEditing, setValue]);

  // ===== helpers reutilizables (ANTES del return) =====

  const handleServicioChange = (
    rowKey: string,
    value: string,
    options?: any[],
  ) => {
    if (!isEditing) return;

    if (cantPax <= 0 && value !== "") {
      showToast({
        title: "Alerta",
        description: "Añade un pasajero por lo menos.",
        type: "error",
      });
      return;
    }

    const selected = options?.find((o) => o.value === value) ?? null;

    setValue(`detalle.${rowKey}.servicio`, selected);

    let precio = 0;
    if (rowKey === "traslado") {
      precio = selected ? getPrecioTraslado(selected.id) : 0;
    } else {
      precio = selected ? getPrecioActividad(selected.id) : 0;
    }

    const rounded = roundCurrency(precio);

    setValue(`detalle.${rowKey}.precio`, rounded);
    setValue(`detalle.${rowKey}.cant`, cantPax);
    setValue(`detalle.${rowKey}.total`, roundCurrency(rounded * cantPax));
  };

  const handlePrecioChange = (rowKey: string, value: number) => {
    if (!isEditing) return;

    const rounded = roundCurrency(value);
    setValue(`detalle.${rowKey}.precio`, rounded);

    const cant = Number(getValues(`detalle.${rowKey}.cant`)) || 0;
    setValue(`detalle.${rowKey}.total`, roundCurrency(rounded * cant));
  };

  const handleCantidadChange = (rowKey: string, value: number) => {
    if (!canEditCantidad(rowKey)) return;

    let cant = Math.min(value, cantPax);

    setValue(`detalle.${rowKey}.cant`, cant);

    const precio = Number(getValues(`detalle.${rowKey}.precio`)) || 0;
    setValue(`detalle.${rowKey}.total`, roundCurrency(precio * cant));
  };

  return (
    <div className="p-2.5 space-y-3">
      {/* =========================
          PARTIDA / HOTEL
      ========================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        {/* Punto partida */}
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
                  if (
                    selectedValue === "" ||
                    selectedValue === "HOTEL" ||
                    selectedValue === "OTROS"
                  ) {
                    setValue("detalle.traslado.servicio", null);
                    setValue("detalle.traslado.precio", 0);
                    setValue("detalle.traslado.cant", 0);
                    setValue("detalle.traslado.total", 0);
                  } else {
                    const dashOption = getTrasladoDashOption();

                    setValue("detalle.traslado.servicio", dashOption);
                    setValue("detalle.traslado.precio", 0);
                    setValue("detalle.traslado.cant", 0);
                    setValue("detalle.traslado.total", 0);
                  }

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

        {/* Hotel */}
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

        {/* Otros partidas */}
        <label className="flex flex-col text-sm sm:col-span-2 md:col-span-4">
          <span className="font-semibold mb-1">Otros partidas</span>
          <TextControlled
            control={control}
            id="otrosPartidas"
            name="otrosPartidas"
            className="rounded-lg"
            transform={(value) => value.toUpperCase()}
            size="small"
            disableHistory
            inputRef={otrosPartidasRef}
          />
        </label>

        {/* Hora */}
        <label className="flex flex-col text-sm sm:col-span-1 md:col-span-1">
          <span className="font-semibold mb-1">Hora P.</span>
          <TimeAMPMInput name="horaPartida" control={control} />
        </label>

        {/* Visitas */}
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
                      if (!isEditing) return;
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
                      const roundedPrecio = roundCurrency(precio);

                      setValue("detalle.tarifa.precio", roundedPrecio);
                      setValue("detalle.tarifa.cant", cantPax);
                      setValue(
                        "detalle.tarifa.total",
                        roundCurrency(roundedPrecio * cantPax),
                      );
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
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      className="w-full border px-2 py-1 text-right bg-slate-100"
                      onKeyDown={handleKeyNav}
                      value={formatCurrency(field.value)}
                      onChange={(e) => {
                        if (!isEditing) return;
                        const raw = e.target.value;
                        const precio = raw === "" ? 0 : Number(raw);
                        const roundedPrecio = roundCurrency(precio);
                        field.onChange(roundedPrecio);
                        setValue(
                          "detalle.tarifa.total",
                          roundCurrency(roundedPrecio * cantPax),
                        );
                      }}
                      disabled={isTarifaPrecioDisabled()}
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
                      if (!isEditing) return;
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
                      const roundedPrecio = roundCurrency(precio);

                      setValue("detalle.tarifa.precio", roundedPrecio);
                      setValue("detalle.tarifa.cant", cantPax);
                      setValue(
                        "detalle.tarifa.total",
                        roundCurrency(roundedPrecio * cantPax),
                      );
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
                    className={`w-full border px-2 py-1 text-right ${
                      isTarifaPrecioDisabled() ? "bg-slate-100" : ""
                    }`}
                    onKeyDown={handleKeyNav}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(e) => {
                      if (!isEditing) return;

                      const raw = e.target.value;
                      const precio = raw === "" ? 0 : Number(raw);
                      const roundedPrecio = roundCurrency(precio);

                      field.onChange(roundedPrecio);
                      setValue(
                        "detalle.tarifa.total",
                        roundCurrency(roundedPrecio * cantPax),
                      );
                    }}
                    disabled={isTarifaPrecioDisabled()}
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
            {/* ================= MOBILE ROW ================= */}
            <div className="md:hidden p-3 space-y-3">
              {/* Badge */}
              <div>
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded inline-block">
                  {row.label}
                </span>
              </div>

              {/* Detalle */}
              {!row.input && (
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Detalle
                  </label>
                  <select
                    className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                    value={
                      getValues(`detalle.${row.key}.servicio`)?.value ?? ""
                    }
                    onChange={(e) =>
                      handleServicioChange(row.key, e.target.value, row.options)
                    }
                    disabled={row.key === "traslado" && isDissabled()}
                  >
                    {row.key === "traslado" ? (
                      <option value="">(SELECCIONE)</option>
                    ) : (
                      <option value="-">-</option>
                    )}
                    {row.options
                      ?.filter(
                        (o) =>
                          !row.key.startsWith("act") ||
                          !actividadesSeleccionadas.includes(o.value) ||
                          getValues(`detalle.${row.key}.servicio`)?.value ===
                            o.value,
                      )
                      .map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Precio / Cant / SubTotal */}
              <div className="grid grid-cols-3 gap-2">
                {/* Precio */}
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
                        className="w-full border px-2 py-1 text-right disabled:bg-slate-100"
                        disabled={
                          row.key === "entrada" || isPrecioDisabled(row.key)
                        }
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) => {
                          if (!isEditing) return;

                          const raw = e.target.value;
                          const precio = raw === "" ? 0 : Number(raw);
                          const roundedPrecio = roundCurrency(precio);

                          field.onChange(roundedPrecio);

                          const cant =
                            Number(getValues(`detalle.${row.key}.cant`)) || 0;

                          setValue(
                            `detalle.${row.key}.total`,
                            roundCurrency(roundedPrecio * cant),
                          );
                        }}
                        onBlur={() => {
                          if (!field.value) field.onChange(0);
                        }}
                      />
                    )}
                  />
                </div>

                {/* Cant */}
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Cant
                  </label>
                  <Controller
                    name={`detalle.${row.key}.cant`}
                    control={control}
                    render={({ field }) => {
                      const editable = canEditCantidad(row.key);

                      return (
                        <input
                          type="number"
                          step="1"
                          min={0}
                          max={cantPax}
                          inputMode="numeric"
                          className={`w-full border px-2 py-1 text-right ${
                            !editable ? "bg-slate-100" : ""
                          }`}
                          value={field.value === 0 ? "" : field.value}
                          disabled={!editable}
                          onChange={(e) => {
                            if (!editable) return;

                            let cant = Math.floor(Number(e.target.value || 0));

                            if (cant > cantPax) {
                              showToast({
                                title: "Alerta",
                                description:
                                  "La cantidad no puede superar el número de pasajeros.",
                                type: "error",
                              });
                              cant = cantPax;
                            }

                            field.onChange(cant);

                            const precio =
                              Number(getValues(`detalle.${row.key}.precio`)) ||
                              0;

                            setValue(
                              `detalle.${row.key}.total`,
                              roundCurrency(precio * cant),
                            );
                          }}
                          onBlur={() => {
                            if (!field.value) field.onChange(0);
                          }}
                        />
                      );
                    }}
                  />
                </div>

                {/* SubTotal */}
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    SubTotal
                  </label>
                  <div className="w-full border px-2 py-2 text-right font-bold bg-slate-50 flex items-center justify-end min-h-[30px]">
                    <SubTotal
                      name={`detalle.${row.key}.total`}
                      visible={!isRowEmpty(row.key)}
                    />
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
                        disabled={row.key === "entrada"}
                      />
                    ) : (
                      <select
                        className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                        disabled={row.key === "traslado" && isDissabled()}
                        value={field.value?.value ?? ""}
                        onChange={(e) => {
                          if (!isEditing) return;
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
                          const roundedPrecio = roundCurrency(precio);

                          setValue(`detalle.${row.key}.precio`, roundedPrecio);
                          setValue(`detalle.${row.key}.cant`, cantPax);
                          setValue(
                            `detalle.${row.key}.total`,
                            roundCurrency(roundedPrecio * cantPax),
                          );
                        }}
                      >
                        {row.key === "traslado" ? (
                          <option value="">(SELECCIONE)</option>
                        ) : (
                          <option value="-">-</option>
                        )}
                        {row.options
                          ?.filter(
                            (o) =>
                              !row.key.startsWith("act") ||
                              !actividadesSeleccionadas.includes(o.value) ||
                              getValues(`detalle.${row.key}.servicio`)
                                ?.value === o.value,
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
                      step="0.01"
                      inputMode="decimal"
                      data-precio
                      className="w-full border px-2 py-1 text-right disabled:bg-slate-100"
                      onKeyDown={handleKeyNav}
                      disabled={
                        row.key === "entrada" || isPrecioDisabled(row.key)
                      }
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        if (!isEditing) return;

                        const raw = e.target.value;
                        const precio = raw === "" ? 0 : Number(raw);
                        const roundedPrecio = roundCurrency(precio);

                        field.onChange(roundedPrecio);

                        const cant =
                          Number(getValues(`detalle.${row.key}.cant`)) || 0;

                        setValue(
                          `detalle.${row.key}.total`,
                          roundCurrency(roundedPrecio * cant),
                        );
                      }}
                      onBlur={() => {
                        if (!field.value) field.onChange(0);
                      }}
                    />
                  )}
                />
              </div>

              <div className="border-l p-1">
                <Controller
                  name={`detalle.${row.key}.cant`}
                  control={control}
                  render={({ field }) => {
                    const editable = canEditCantidad(row.key);

                    return (
                      <input
                        type="number"
                        step="1"
                        min={0}
                        inputMode="numeric"
                        max={cantPax}
                        className={`w-full border px-2 py-1 text-right ${
                          !editable ? "bg-slate-100" : ""
                        }`}
                        value={field.value === 0 ? "" : field.value}
                        disabled={!editable}
                        onChange={(e) => {
                          if (!editable) return;

                          let cant = Math.floor(Number(e.target.value || 0));

                          if (cant > cantPax) {
                            showToast({
                              title: "Alerta",
                              description:
                                "La cantidad no puede superar el número de pasajeros.",
                              type: "error",
                            });
                            cant = cantPax;
                          }

                          field.onChange(cant);

                          const precio =
                            Number(getValues(`detalle.${row.key}.precio`)) || 0;

                          setValue(
                            `detalle.${row.key}.total`,
                            roundCurrency(precio * cant),
                          );
                        }}
                        onBlur={() => {
                          if (!field.value) field.onChange(0);
                        }}
                      />
                    );
                  }}
                />
              </div>

              <div className="border-l p-2 text-right font-bold">
                <SubTotal
                  name={`detalle.${row.key}.total`}
                  visible={!isRowEmpty(row.key)}
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
