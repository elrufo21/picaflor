import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, BusFront } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  ALIMENTACION_BOOL_OPTIONS,
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
const inferRoomTypeFromPackage = (paquete: string): string | null => {
  const normalized = String(paquete ?? "").trim().toLowerCase();
  if (!normalized || normalized.includes("sin hotel")) return null;
  if (normalized.includes("matrimonial")) return "Matrimonial";
  if (normalized.includes("simple")) return "Simple";
  if (normalized.includes("doble")) return "Doble";
  if (normalized.includes("triple")) return "Triple";
  if (normalized.includes("familiar")) return "Familiar";
  return null;
};

const ServiciosContratadosSection = ({
  form,
  onUpdateField,
  onAddHotelServicio,
  onRemoveHotelServicio,
  onUpdateHotelServicioField,
}: Props) => {
  const { control, setValue } = useForm<ServiciosContratadosFormValues>({
    defaultValues: {
      movilidadTipo: form.movilidadTipo ?? "",
      movilidadEmpresa: form.movilidadEmpresa ?? "",
      incluyeHotel: form.incluyeHotel ? "SI" : "",
      incluyeAlimentacionGlobal: "",
    },
  });
  const [regiones, setRegiones] = useState<Ubigeo[]>([]);
  const [hotelesCatalogo, setHotelesCatalogo] = useState<Hotel[]>([]);
  const [empresasMovilidad, setEmpresasMovilidad] = useState<string[]>([]);
  const currencySymbol = getTravelCurrencySymbol(form.moneda);
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
    const options = empresasMovilidad.map((value) => ({ value, label: value }));
    const currentValue = String(form.movilidadEmpresa ?? "").trim();
    if (
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
  }, [empresasMovilidad, form.movilidadEmpresa]);

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
    setValue("incluyeHotel", form.incluyeHotel ? "SI" : "", {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form.incluyeHotel, setValue]);

  useEffect(() => {
    hotelesContratados.forEach((row) => {
      setValue(
        `incluyeAlimentacion_${row.id}`,
        row.incluyeAlimentacion ? "SI" : "NO",
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

    const roomCountByType = new Map<string, number>();
    (form.paquetesViaje ?? []).forEach((item) => {
      const roomType = inferRoomTypeFromPackage(item.paquete);
      if (!roomType) return;
      const nextCount = Math.max(1, Math.floor(Number(item.cantidad || 0) || 1));
      roomCountByType.set(roomType, nextCount);
    });

    if (!roomCountByType.size) return;

    const nextRows = hotelesContratados.map((row) => {
      const currentPriceByType = new Map(
        (row.habitaciones ?? []).map((item) => [
          String(item.tipo ?? "").trim().toLowerCase(),
          Number(item.precio ?? 0),
        ]),
      );

      const nextHabitaciones = Array.from(roomCountByType.entries()).map(
        ([tipo, cantidad]) => ({
          tipo,
          cantidad,
          precio: currentPriceByType.get(tipo.toLowerCase()) ?? 0,
        }),
      );

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
  }, [form.incluyeHotel, form.paquetesViaje, hotelesContratados, onUpdateField]);

  return (
    <SectionCard
      icon={BusFront}
      title="4. Servicios Contratados"
      description="Movilidad y hoteles incluidos en el paquete."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
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
                }
              }}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Empresa de movilidad
            </label>
            <SelectControlled<ServiciosContratadosFormValues>
              name="movilidadEmpresa"
              control={control}
              options={movilidadEmpresaOptions}
              size="small"
              disabled={String(form.movilidadTipo ?? "") === "NO INCLUYE"}
              onChange={(e) =>
                onUpdateField("movilidadEmpresa", String(e.target.value))
              }
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Hoteles
            </label>
            <SelectControlled<ServiciosContratadosFormValues>
              name="incluyeHotel"
              control={control}
              options={[{ value: "", label: "SELECCIONE" }, ...HOTEL_INCLUSION_OPTIONS]}
              size="small"
              onChange={(e) =>
                onUpdateField("incluyeHotel", String(e.target.value) === "SI")
              }
            />
          </div>

          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Alimentacion
            </label>
            <SelectControlled<ServiciosContratadosFormValues>
              name="incluyeAlimentacionGlobal"
              control={control}
              options={[
                { value: "", label: "SELECCIONE" },
                ...ALIMENTACION_BOOL_OPTIONS,
              ]}
              size="small"
              onChange={(e) => {
                const selectedValue = String(e.target.value);
                if (!selectedValue) return;
                const include = selectedValue === "SI";
                hotelesContratados.forEach((row) => {
                  onUpdateHotelServicioField(
                    row.id,
                    "incluyeAlimentacion",
                    include,
                  );
                });
              }}
            />
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
