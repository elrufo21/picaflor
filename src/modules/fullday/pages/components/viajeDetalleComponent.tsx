import { Autocomplete, TextField } from "@mui/material";
import { Controller, useWatch } from "react-hook-form";
import { useParams } from "react-router";
import { useEffect } from "react";
import { usePackageData } from "../../hooks/usePackageData";

const ViajeDetalleComponent = ({ control, setValue, getValues, watch }) => {
  const { idProduct } = useParams();

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
  } = usePackageData(idProduct, setValue);

  /* =========================
     CANTIDAD GLOBAL
  ========================= */
  const cantPax = Number(watch("cantPax") || 0);
  const disabledByCantPax = cantPax <= 0;

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
                {...field}
                options={hoteles || []}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                size="small"
                renderInput={(params) => (
                  <TextField {...params} placeholder="-" />
                )}
              />
            )}
          />
        </label>

        <label className="flex flex-col text-sm md:col-span-4">
          <span className="font-semibold mb-1">Otros partidas</span>
          <input className="rounded-lg border px-2 py-1.5" />
        </label>

        <label className="flex flex-col text-sm">
          <span className="font-semibold mb-1">Hora P.</span>
          <Controller
            name="horaPartida"
            control={control}
            render={({ field }) => (
              <input {...field} className="rounded-lg border px-2 py-1.5" />
            )}
          />
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
      <div className="w-full border border-black text-sm">
        <div className="grid grid-cols-[160px_1fr_120px_120px_120px] border-b font-bold">
          <div />
          <div className="border-l p-2">Detalle</div>
          <div className="border-l p-2 text-center">Precio</div>
          <div className="border-l p-2 text-center">Cant</div>
          <div className="border-l p-2 text-center">SubTotal</div>
        </div>

        {/* TARIFA */}
        <div className="grid grid-cols-[160px_1fr_120px_120px_120px] border-b">
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
                  disabled={disabledByCantPax}
                  className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                  value={field.value?.value ?? ""}
                  onChange={(e) => {
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
                  {...field}
                  readOnly
                  className="w-full border px-2 py-1 text-right bg-slate-100"
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

        {/* OTRAS FILAS */}
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[160px_1fr_120px_120px_120px] border-b"
          >
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
                    <input {...field} className="w-full border px-2 py-1" />
                  ) : (
                    <select
                      disabled={disabledByCantPax}
                      className="w-full border rounded px-2 py-1 disabled:bg-slate-100"
                      value={field.value?.value ?? ""}
                      onChange={(e) => {
                        const selected =
                          row.options?.find(
                            (o) => o.value === e.target.value,
                          ) ?? null;

                        field.onChange(selected);

                        let precio = 0;
                        if (row.key === "traslado")
                          precio = selected
                            ? getPrecioTraslado(selected.id)
                            : 0;
                        else
                          precio = selected
                            ? getPrecioActividad(selected.id)
                            : 0;

                        setValue(`detalle.${row.key}.precio`, precio);
                        setValue(`detalle.${row.key}.cant`, cantPax);
                        setValue(`detalle.${row.key}.total`, precio * cantPax);
                      }}
                    >
                      <option value="">(SELECCIONE)</option>
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
                    {...field}
                    type="number"
                    className="w-full border px-2 py-1 text-right"
                    onChange={(e) => {
                      const precio = Number(e.target.value || 0);

                      field.onChange(precio); // 👈 guarda el precio

                      // 👇 recalcula el total
                      setValue(`detalle.${row.key}.total`, precio * cantPax);
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
              <SubTotal name={`detalle.${row.key}.total`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViajeDetalleComponent;
