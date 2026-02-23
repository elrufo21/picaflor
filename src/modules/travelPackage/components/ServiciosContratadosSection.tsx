import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, BusFront } from "lucide-react";
import {
  ALIMENTACION_BOOL_OPTIONS,
  HABITACION_OPTIONS,
  HOTEL_INCLUSION_OPTIONS,
  MOVILIDAD_OPTIONS,
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
  TableTimePicker,
  TableTextInput,
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
  }));

const mapFromSelectorValue = (
  value: RoomQuantityValue[],
): HotelRoomSelection[] =>
  value.map((item) => ({ tipo: item.value, cantidad: item.quantity }));

const ServiciosContratadosSection = ({
  form,
  onUpdateField,
  onAddHotelServicio,
  onRemoveHotelServicio,
  onUpdateHotelServicioField,
}: Props) => {
  const [regiones, setRegiones] = useState<Ubigeo[]>([]);
  const [hotelesCatalogo, setHotelesCatalogo] = useState<Hotel[]>([]);
  const hotelesContratados = Array.isArray(form.hotelesContratados)
    ? form.hotelesContratados
    : [];

  useEffect(() => {
    let active = true;

    const loadCatalogs = async () => {
      const [ubigeosRows, hotelesRows] = await Promise.all([
        serviciosDB.ubigeos.toArray(),
        serviciosDB.hoteles.toArray(),
      ]);

      if (!active) return;
      setRegiones(ubigeosRows);
      setHotelesCatalogo(hotelesRows);
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
          <select
            value={form.movilidadTipo}
            onChange={(e) => onUpdateField("movilidadTipo", e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Seleccionar</option>
            {MOVILIDAD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Empresa de movilidad
          </label>
          <TableTextInput
            value={form.movilidadEmpresa}
            onChange={(value) => onUpdateField("movilidadEmpresa", value)}
            placeholder="Empresa relacionada con movilidad"
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="lg:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Hoteles
          </label>
          <select
            value={form.incluyeHotel ? "SI" : "NO"}
            onChange={(e) => onUpdateField("incluyeHotel", e.target.value === "SI")}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-emerald-500 focus:outline-none"
          >
            {HOTEL_INCLUSION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
                  <th className="px-2 py-2 text-left font-medium w-[130px]">
                    Alimentacion
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
                          onUpdateHotelServicioField(row.id, "region", nextRegion);

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
                    <td className="px-2 py-1.5">
                      <select
                        value={row.incluyeAlimentacion ? "SI" : "NO"}
                        onChange={(e) =>
                          onUpdateHotelServicioField(
                            row.id,
                            "incluyeAlimentacion",
                            e.target.value === "SI",
                          )
                        }
                        className="h-8 w-full rounded border border-slate-300 px-2 text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        {ALIMENTACION_BOOL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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
