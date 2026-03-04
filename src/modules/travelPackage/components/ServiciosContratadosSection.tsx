import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, BusFront } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  ALIMENTACION_BOOL_OPTIONS,
  ALIMENTACION_OPTIONS,
  HABITACION_OPTIONS,
  HOTEL_INCLUSION_OPTIONS,
  MOVILIDAD_OPTIONS,
  getTravelCurrencySymbol,
} from "../constants/travelPackage.constants";
import type {
  HotelRoomSelection,
  HotelServicioRow,
  TravelPackageFormState,
} from "../types/travelPackage.types";
import SectionCard from "./SectionCard";
import {
  AutocompleteTable,
  RoomQuantitySelector,
  SelectControlled,
  TextControlled,
  TableTimePicker,
  type RoomQuantityValue,
} from "@/components/ui/inputs";
import { serviciosDB, type Hotel, type Ubigeo } from "@/app/db/serviciosDB";

type Props = {
  form: TravelPackageFormState;
  onUpdateField: <K extends keyof TravelPackageFormState>(
    key: K,
    value: TravelPackageFormState[K],
  ) => void;
  onAddHotelServicio: () => void;
  onRemoveHotelServicio: (id: number) => void;
  onUpdateHotelServicioField: <K extends keyof Omit<HotelServicioRow, "id">>(
    id: number,
    field: K,
    value: HotelServicioRow[K],
  ) => void;
};

const roomOptions = HABITACION_OPTIONS.map((tipo) => ({
  value: tipo,
  label: tipo,
}));

const mapToSelectorValue = (
  habitaciones?: HotelRoomSelection[],
): RoomQuantityValue[] =>
  (habitaciones ?? []).map((item) => ({
    value: item.tipo,
    quantity: item.cantidad,
    price: Number(item.precio ?? 0),
  }));

const mapFromSelectorValue = (
  value: RoomQuantityValue[],
): HotelRoomSelection[] =>
  value.map((item) => ({
    tipo: item.value,
    cantidad: item.quantity,
    precio: Number(item.price ?? 0),
  }));

type ServiciosContratadosFormValues = Record<string, string>;
const normalizeRegionName = (value: string) => value.trim().toLowerCase();
const MOVILIDAD_EMPRESAS_PERU = {
  BUS: [
    "Cruz del Sur",
    "Oltursa",
    "CIVA",
    "Movil Bus",
    "Excluciva",
    "Transportes Flores",
  ],
  AEREO: [
    "LATAM Airlines Peru",
    "Sky Airline Peru",
    "JetSMART Peru",
    "Star Peru",
    "ATSA Airlines",
  ],
} as const;

const ServiciosContratadosSection = ({
  form,
  onUpdateField,
  onAddHotelServicio,
  onRemoveHotelServicio,
  onUpdateHotelServicioField,
}: Props) => {
  const initialAlimentacionTipo = String(
    (form.hotelesContratados ?? []).find((row) => row.alimentacionTipo)
      ?.alimentacionTipo ?? "",
  );
  const initialIncluyeAlimentacion =
    initialAlimentacionTipo.length > 0 ||
    (form.hotelesContratados ?? []).some((row) => row.incluyeAlimentacion);

  const { control, setValue, watch } = useForm<ServiciosContratadosFormValues>({
    defaultValues: {
      movilidadTipo: form.movilidadTipo ?? "",
      movilidadEmpresa: form.movilidadEmpresa ?? "",
      movilidadPrecio: String(form.movilidadPrecio ?? ""),
      incluyeHotel: form.incluyeHotel ? "SI" : "",
      incluyeAlimentacionEstado: initialIncluyeAlimentacion ? "SI" : "NO",
      incluyeAlimentacionGlobal: initialAlimentacionTipo,
      precioAlimentacionGlobal: "",
    },
  });
  const [regiones, setRegiones] = useState<Ubigeo[]>([]);
  const [hotelesCatalogo, setHotelesCatalogo] = useState<Hotel[]>([]);
  const [empresasMovilidad, setEmpresasMovilidad] = useState<string[]>([]);
  const currencySymbol = getTravelCurrencySymbol(form.moneda);
  const selectedMovilidadTipo = String(watch("movilidadTipo") ?? "");
  const selectedMovilidadEmpresa = String(watch("movilidadEmpresa") ?? "");
  const showMovilidadPrice = Boolean(
    selectedMovilidadTipo &&
    selectedMovilidadTipo !== "NO INCLUYE" &&
    selectedMovilidadEmpresa &&
    selectedMovilidadEmpresa !== "-",
  );
  const selectedAlimentacionEstado = String(
    watch("incluyeAlimentacionEstado") ?? "",
  );
  const selectedAlimentacionGlobal = String(
    watch("incluyeAlimentacionGlobal") ?? "",
  );
  const showAlimentacionPrice = Boolean(
    selectedAlimentacionEstado === "SI" && selectedAlimentacionGlobal,
  );
  const hasHotelPackage = useMemo(
    () =>
      (form.paquetesViaje ?? []).some(
        (item) =>
          !String(item.paquete ?? "")
            .toLowerCase()
            .includes("sin hotel"),
      ),
    [form.paquetesViaje],
  );
  const onlySinHotelPackageSelected = useMemo(() => {
    const paquetes = form.paquetesViaje ?? [];
    if (!paquetes.length) return false;
    return paquetes.every((item) =>
      String(item.paquete ?? "").toLowerCase().includes("sin hotel"),
    );
  }, [form.paquetesViaje]);
  const hotelesContratados = useMemo(
    () =>
      Array.isArray(form.hotelesContratados) ? form.hotelesContratados : [],
    [form.hotelesContratados],
  );

  useEffect(() => {
    let active = true;

    const loadCatalogs = async () => {
      const [ubigeosRows, hotelesRows, trasladosRows] = await Promise.all([
        serviciosDB.ubigeos.toArray(),
        serviciosDB.hoteles.toArray(),
        serviciosDB.traslados.toArray(),
      ]);

      if (!active) return;
      setRegiones(ubigeosRows);
      setHotelesCatalogo(hotelesRows);
      setEmpresasMovilidad(
        Array.from(
          new Set(
            trasladosRows
              .map((item) => String(item.nombre ?? "").trim())
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b)),
      );
    };

    void loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  const uniqueRegiones = useMemo(() => {
    const byNombre = new Map<string, Ubigeo>();
    regiones.forEach((region) => {
      const nombre = String(region.nombre ?? "").trim();
      if (!nombre) return;
      if (!byNombre.has(nombre.toLowerCase())) {
        byNombre.set(nombre.toLowerCase(), region);
      }
    });
    return Array.from(byNombre.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }, [regiones]);

  const movilidadEmpresaOptions = useMemo(() => {
    const tipo = selectedMovilidadTipo.toUpperCase();
    const baseValues =
      tipo === "BUS" || tipo === "AEREO"
        ? [...MOVILIDAD_EMPRESAS_PERU[tipo]]
        : empresasMovilidad;

    const options = Array.from(
      new Set(baseValues.map((value) => String(value).trim()).filter(Boolean)),
    )
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }));

    const currentValue = String(form.movilidadEmpresa ?? "").trim();
    const preserveCurrentValue = tipo !== "BUS" && tipo !== "AEREO";
    if (
      preserveCurrentValue &&
      currentValue &&
      !options.some(
        (option) => option.value.toLowerCase() === currentValue.toLowerCase(),
      )
    ) {
      options.unshift({ value: currentValue, label: currentValue });
    }
    return [
      { value: "", label: "SELECCIONE" },
      { value: "-", label: "-" },
      ...options,
    ];
  }, [empresasMovilidad, form.movilidadEmpresa, selectedMovilidadTipo]);

  useEffect(() => {
    const tipo = selectedMovilidadTipo.toUpperCase();
    if (tipo !== "BUS" && tipo !== "AEREO") return;

    const currentEmpresa = String(form.movilidadEmpresa ?? "").trim();
    if (!currentEmpresa) return;

    const allowed = MOVILIDAD_EMPRESAS_PERU[tipo].map((value) =>
      value.toLowerCase(),
    );
    if (allowed.includes(currentEmpresa.toLowerCase())) return;

    onUpdateField("movilidadEmpresa", "");
    onUpdateField("movilidadPrecio", 0);
    setValue("movilidadEmpresa", "", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    setValue("movilidadPrecio", "0", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [selectedMovilidadTipo, form.movilidadEmpresa, onUpdateField, setValue]);

  useEffect(() => {
    setValue("movilidadTipo", form.movilidadTipo ?? "", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.movilidadTipo, setValue]);

  useEffect(() => {
    setValue("movilidadEmpresa", form.movilidadEmpresa ?? "", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.movilidadEmpresa, setValue]);

  useEffect(() => {
    setValue("movilidadPrecio", String(form.movilidadPrecio ?? ""), {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.movilidadPrecio, setValue]);

  useEffect(() => {
    setValue("incluyeHotel", form.incluyeHotel ? "SI" : "NO", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.incluyeHotel, setValue]);

  useEffect(() => {
    hotelesContratados.forEach((row) => {
      setValue(
        `incluyeAlimentacion_${row.id}`,
        row.alimentacionTipo || (row.incluyeAlimentacion ? "Desayuno" : ""),
        {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        },
      );
    });
  }, [hotelesContratados, setValue]);

  useEffect(() => {
    if (!form.incluyeHotel) return;

    const destinos = Array.from(
      new Set(
        (form.destinos ?? [])
          .map((destino) => String(destino ?? "").trim())
          .filter(Boolean),
      ),
    );

    if (!destinos.length) return;

    const rowsByRegion = new Map<string, HotelServicioRow>();
    hotelesContratados.forEach((row) => {
      const key = normalizeRegionName(String(row.region ?? ""));
      if (!key || rowsByRegion.has(key)) return;
      rowsByRegion.set(key, row);
    });

    const nextRows = destinos.map((destino) => {
      const key = normalizeRegionName(destino);
      const existing = rowsByRegion.get(key);
      if (existing) return existing;

      return {
        id: Date.now() + Math.random(),
        region: destino,
        hotel: "",
        habitaciones: [],
        entrada: "",
        salida: "",
        incluyeAlimentacion: false,
        alimentacionTipo: "",
        alimentacionPrecio: 0,
      } as HotelServicioRow;
    });

    const sameLength = nextRows.length === hotelesContratados.length;
    const sameOrderAndRegion =
      sameLength &&
      nextRows.every((row, index) => {
        const current = hotelesContratados[index];
        return (
          current &&
          current.id === row.id &&
          normalizeRegionName(String(current.region ?? "")) ===
            normalizeRegionName(String(row.region ?? ""))
        );
      });

    if (!sameOrderAndRegion) {
      onUpdateField("hotelesContratados", nextRows);
    }
  }, [form.incluyeHotel, form.destinos, hotelesContratados, onUpdateField]);

  useEffect(() => {
    if (!form.incluyeHotel) return;
    if (!hotelesContratados.length) return;
    if (hotelesContratados.length === 1) return;

    const [firstHotelRow] = hotelesContratados;
    if (!firstHotelRow) return;
    const roomOrder = new Map(
      roomOptions.map((option, index) => [
        String(option.value).trim().toLowerCase(),
        index,
      ]),
    );
    const templateRooms = [...(firstHotelRow.habitaciones ?? [])]
      .map((room) => ({
        tipo: String(room.tipo ?? "").trim(),
        cantidad: Math.max(0, Math.floor(Number(room.cantidad || 0) || 0)),
        precio: Number(room.precio ?? 0),
      }))
      .filter((room) => room.tipo)
      .sort(
        (a, b) =>
          (roomOrder.get(a.tipo.toLowerCase()) ?? 9999) -
          (roomOrder.get(b.tipo.toLowerCase()) ?? 9999),
      );

    const nextRows = hotelesContratados.map((row) => {
      if (row.id === firstHotelRow.id) return row;

      const currentPriceByType = new Map(
        (row.habitaciones ?? []).map((item) => [
          String(item.tipo ?? "")
            .trim()
            .toLowerCase(),
          Number(item.precio ?? 0),
        ]),
      );

      const nextHabitaciones = templateRooms.map((item) => ({
        tipo: item.tipo,
        cantidad: item.cantidad,
        precio:
          currentPriceByType.get(item.tipo.toLowerCase()) ??
          Number(item.precio ?? 0),
      }));

      return {
        ...row,
        habitaciones: nextHabitaciones,
      };
    });

    const hasChanged = nextRows.some((row, index) => {
      const current = hotelesContratados[index];
      if (!current) return true;
      const left = JSON.stringify(
        [...(current.habitaciones ?? [])].sort((a, b) =>
          String(a.tipo).localeCompare(String(b.tipo)),
        ),
      );
      const right = JSON.stringify(
        [...(row.habitaciones ?? [])].sort((a, b) =>
          String(a.tipo).localeCompare(String(b.tipo)),
        ),
      );
      return left !== right;
    });

    if (hasChanged) {
      onUpdateField("hotelesContratados", nextRows);
    }
  }, [
    form.incluyeHotel,
    hotelesContratados,
    onUpdateField,
  ]);

  return (
    <SectionCard
      icon={BusFront}
      title="4. Servicios Contratados"
      description="Movilidad y hoteles incluidos en el paquete."
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Movilidad
              </label>
              <SelectControlled<ServiciosContratadosFormValues>
                name="movilidadTipo"
                control={control}
                options={[
                  { value: "", label: "SELECCIONE" },
                  { value: "NO INCLUYE", label: "NO INCLUYE" },
                  ...MOVILIDAD_OPTIONS.map((option) => ({
                    value: option,
                    label: option,
                  })),
                ]}
                size="small"
                onChange={(e) => {
                  const nextValue = String(e.target.value);
                  onUpdateField("movilidadTipo", nextValue);
                  if (nextValue === "NO INCLUYE") {
                    onUpdateField("movilidadEmpresa", "-");
                    onUpdateField("movilidadPrecio", 0);
                    setValue("movilidadPrecio", "0");
                    return;
                  }
                  if (!nextValue) {
                    onUpdateField("movilidadEmpresa", "");
                    onUpdateField("movilidadPrecio", 0);
                    setValue("movilidadPrecio", "0");
                    return;
                  }
                  if (selectedMovilidadEmpresa === "-") {
                    onUpdateField("movilidadEmpresa", "");
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Empresa movilidad
              </label>
              <SelectControlled<ServiciosContratadosFormValues>
                name="movilidadEmpresa"
                control={control}
                options={movilidadEmpresaOptions}
                size="small"
                disabled={String(form.movilidadTipo ?? "") === "NO INCLUYE"}
                onChange={(e) => {
                  const nextEmpresa = String(e.target.value);
                  onUpdateField("movilidadEmpresa", nextEmpresa);
                  if (!nextEmpresa || nextEmpresa === "-") {
                    onUpdateField("movilidadPrecio", 0);
                    setValue("movilidadPrecio", "0");
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Precio
              </label>
              <TextControlled<ServiciosContratadosFormValues>
                name="movilidadPrecio"
                control={control}
                size="small"
                type="number"
                displayZeroAsEmpty
                disabled={!showMovilidadPrice}
                onChange={(e) =>
                  onUpdateField(
                    "movilidadPrecio",
                    Math.max(0, Number(e.target.value || 0)),
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Alimentacion
              </label>
              <SelectControlled<ServiciosContratadosFormValues>
                name="incluyeAlimentacionEstado"
                control={control}
                options={[
                  { value: "", label: "SELECCIONE" },
                  ...ALIMENTACION_BOOL_OPTIONS,
                ]}
                size="small"
                onChange={(e) => {
                  const nextEstado = String(e.target.value);
                  const include = nextEstado === "SI";
                  const selectedTipo = selectedAlimentacionGlobal.trim();
                  const nextTipo = include ? selectedTipo : "";
                  hotelesContratados.forEach((row) => {
                    onUpdateHotelServicioField(
                      row.id,
                      "incluyeAlimentacion",
                      include,
                    );
                    onUpdateHotelServicioField(
                      row.id,
                      "alimentacionTipo",
                      nextTipo,
                    );
                    if (!include) {
                      onUpdateHotelServicioField(
                        row.id,
                        "alimentacionPrecio",
                        0,
                      );
                    }
                  });
                  if (!include) {
                    setValue("incluyeAlimentacionGlobal", "", {
                      shouldDirty: false,
                      shouldTouch: false,
                      shouldValidate: false,
                    });
                    setValue("precioAlimentacionGlobal", "", {
                      shouldDirty: false,
                      shouldTouch: false,
                      shouldValidate: false,
                    });
                  }
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tipo de alimentacion
              </label>
              <SelectControlled<ServiciosContratadosFormValues>
                name="incluyeAlimentacionGlobal"
                control={control}
                options={[
                  { value: "", label: "SELECCIONE" },
                  ...ALIMENTACION_OPTIONS.map((option) => ({
                    value: option,
                    label: option,
                  })),
                ]}
                size="small"
                disabled={selectedAlimentacionEstado !== "SI"}
                onChange={(e) => {
                  const selectedValue = String(e.target.value).trim();
                  const include = selectedAlimentacionEstado === "SI";
                  if (!include) return;
                  hotelesContratados.forEach((row) => {
                    onUpdateHotelServicioField(
                      row.id,
                      "incluyeAlimentacion",
                      true,
                    );
                    onUpdateHotelServicioField(
                      row.id,
                      "alimentacionTipo",
                      selectedValue,
                    );
                  });
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Precio
              </label>
              <TextControlled<ServiciosContratadosFormValues>
                name="precioAlimentacionGlobal"
                control={control}
                size="small"
                type="number"
                displayZeroAsEmpty
                disabled={!showAlimentacionPrice}
                onChange={(e) => {
                  const price = Math.max(0, Number(e.target.value || 0));
                  hotelesContratados.forEach((row) => {
                    onUpdateHotelServicioField(
                      row.id,
                      "alimentacionPrecio",
                      price,
                    );
                  });
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Hotel
              </label>
              <SelectControlled<ServiciosContratadosFormValues>
                name="incluyeHotel"
                control={control}
                options={[
                  { value: "", label: "SELECCIONE" },
                  ...HOTEL_INCLUSION_OPTIONS,
                ]}
                size="small"
                disabled={hasHotelPackage || onlySinHotelPackageSelected}
                onChange={(e) =>
                  onUpdateField("incluyeHotel", String(e.target.value) === "SI")
                }
              />
            </div>
            <div className="hidden md:block" />
            <div className="hidden md:block" />
          </div>
        </div>

        {form.incluyeHotel && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[1220px] w-full table-fixed text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium w-[250px]">
                      Region
                    </th>
                    <th className="px-2 py-2 text-left font-medium w-[330px]">
                      Hotel
                    </th>
                    <th className="px-2 py-2 text-left font-medium w-[260px]">
                      Habitaciones
                    </th>
                    <th className="px-2 py-2 text-left font-medium w-[120px]">
                      Entrada
                    </th>
                    <th className="px-2 py-2 text-left font-medium w-[120px]">
                      Salida
                    </th>

                    <th className="px-2 py-2 text-center font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {hotelesContratados.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200">
                      <td className="px-2 py-1.5">
                        <AutocompleteTable
                          options={uniqueRegiones}
                          value={
                            uniqueRegiones.find(
                              (region) =>
                                String(region.nombre).toLowerCase() ===
                                String(row.region ?? "").toLowerCase(),
                            ) ?? null
                          }
                          onChange={(region) => {
                            const nextRegion = region?.nombre ?? "";
                            onUpdateHotelServicioField(
                              row.id,
                              "region",
                              nextRegion,
                            );

                            const stillValidHotel = hotelesCatalogo.some(
                              (hotel) =>
                                hotel.nombre.toLowerCase() ===
                                  String(row.hotel ?? "").toLowerCase() &&
                                hotel.region.toLowerCase() ===
                                  nextRegion.toLowerCase(),
                            );
                            if (!stillValidHotel) {
                              onUpdateHotelServicioField(row.id, "hotel", "");
                            }
                          }}
                          getOptionKey={(region) => region.id}
                          getOptionLabel={(region) => region.nombre}
                          columns={[
                            {
                              key: "nombre",
                              header: "Region",
                              render: (region) => region.nombre,
                            },
                          ]}
                          placeholder="Seleccionar region"
                          noOptionsText="Sin regiones"
                          size="small"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <AutocompleteTable
                          options={hotelesCatalogo.filter((hotel) =>
                            row.region
                              ? hotel.region.toLowerCase() ===
                                row.region.toLowerCase()
                              : true,
                          )}
                          value={
                            hotelesCatalogo.find(
                              (hotel) =>
                                String(hotel.nombre).toLowerCase() ===
                                  String(row.hotel ?? "").toLowerCase() &&
                                (row.region
                                  ? hotel.region.toLowerCase() ===
                                    row.region.toLowerCase()
                                  : true),
                            ) ?? null
                          }
                          onChange={(hotel) => {
                            onUpdateHotelServicioField(
                              row.id,
                              "hotel",
                              hotel?.nombre ?? "",
                            );
                            if (hotel?.region) {
                              onUpdateHotelServicioField(
                                row.id,
                                "region",
                                hotel.region,
                              );
                            }
                          }}
                          getOptionKey={(hotel) => hotel.id}
                          getOptionLabel={(hotel) => hotel.nombre}
                          columns={[
                            {
                              key: "nombre",
                              header: "Hotel",
                              render: (hotel) => hotel.nombre,
                            },
                            {
                              key: "region",
                              header: "Region",
                              render: (hotel) => hotel.region,
                            },
                          ]}
                          placeholder="Seleccionar hotel"
                          noOptionsText="Sin hoteles"
                          size="small"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <RoomQuantitySelector
                          options={roomOptions}
                          value={mapToSelectorValue(row.habitaciones)}
                          currencySymbol={currencySymbol}
                          onChange={(value) =>
                            onUpdateHotelServicioField(
                              row.id,
                              "habitaciones",
                              mapFromSelectorValue(value),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <TableTimePicker
                          value={row.entrada}
                          onChange={(value) =>
                            onUpdateHotelServicioField(row.id, "entrada", value)
                          }
                          placeholder="Hora entrada"
                          compact
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <TableTimePicker
                          value={row.salida}
                          onChange={(value) =>
                            onUpdateHotelServicioField(row.id, "salida", value)
                          }
                          placeholder="Hora salida"
                          compact
                        />
                      </td>

                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveHotelServicio(row.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onAddHotelServicio}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar hotel
              </button>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default ServiciosContratadosSection;
