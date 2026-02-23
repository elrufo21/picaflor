import { useEffect } from "react";
import { Trash2, Plus, Users } from "lucide-react";
import { AutocompleteTable, TableTextInput } from "@/components/ui/inputs";
import { usePaises } from "../hooks/usePaises";
import type { PassengerRow } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

type Props = {
    pasajeros: PassengerRow[];
    onUpdateField: (
        id: number,
        key: keyof Omit<PassengerRow, "id">,
        value: string,
    ) => void;
    onAdd: () => void;
    onRemove: (id: number) => void;
};

const PassengersSection = ({
  pasajeros,
  onUpdateField,
  onAdd,
  onRemove,
}: Props) => {
  const { paises, loading, error } = usePaises();

  useEffect(() => {
    if (!paises.length) return;

    pasajeros.forEach((passenger) => {
      const nacionalidadActual = String(passenger.nacionalidad ?? "").trim();
      if (!nacionalidadActual) return;

      const matchByIso = paises.find(
        (pais) => pais.iso.toLowerCase() === nacionalidadActual.toLowerCase(),
      );

      if (matchByIso && matchByIso.nombre !== passenger.nacionalidad) {
        onUpdateField(passenger.id, "nacionalidad", matchByIso.nombre);
      }
    });
  }, [paises, pasajeros, onUpdateField]);

  return (
    <SectionCard
      icon={Users}
      title="3. Pasajeros"
      description="Lista de pasajeros."
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[1100px] w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium w-8">#</th>
              <th className="px-2 py-1.5 text-left font-medium w-[30%]">
                Nombres y apellidos
              </th>
              <th className="px-2 py-1.5 text-left font-medium w-[16%]">
                Pasaporte
              </th>
              <th className="px-2 py-1.5 text-left font-medium w-[30%]">
                Nacionalidad
              </th>
              <th className="px-2 py-1.5 text-left font-medium w-[16%]">
                Telefono
              </th>
              <th className="px-2 py-1.5 text-center font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {pasajeros.map((passenger, index) => {
              const selectedPais =
                paises.find(
                  (pais) =>
                    pais.nombre.toLowerCase() ===
                      passenger.nacionalidad.toLowerCase() ||
                    pais.iso.toLowerCase() === passenger.nacionalidad.toLowerCase(),
                ) ?? null;

              return (
                <tr key={passenger.id} className="border-t border-slate-200">
                  <td className="px-2 py-1.5 align-middle text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <TableTextInput
                      value={passenger.nombres}
                      onChange={(value) =>
                        onUpdateField(passenger.id, "nombres", value)
                      }
                      placeholder="Nombres"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <TableTextInput
                      value={passenger.pasaporte}
                      onChange={(value) =>
                        onUpdateField(passenger.id, "pasaporte", value)
                      }
                      placeholder="Pasaporte"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <AutocompleteTable
                      options={paises}
                      value={selectedPais}
                      loading={loading}
                      onChange={(pais) =>
                        onUpdateField(passenger.id, "nacionalidad", pais?.nombre ?? "")
                      }
                      getOptionKey={(pais) => pais.id}
                      getOptionLabel={(pais) => pais.nombre}
                      columns={[
                        {
                          key: "nombre",
                          header: "Pais",
                          render: (pais) => pais.nombre,
                        },
                      ]}
                      noOptionsText={
                        error ? "No se pudo cargar paises" : "Sin paises"
                      }
                      placeholder="Seleccionar"
                      size="small"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <TableTextInput
                      value={passenger.telefono}
                      onChange={(value) =>
                        onUpdateField(passenger.id, "telefono", value)
                      }
                      placeholder="Telefono"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(passenger.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar pasajero"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end p-1">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>
    </SectionCard>
  );
};

export default PassengersSection;
