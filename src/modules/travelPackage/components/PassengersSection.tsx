import { useEffect } from "react";
import { Users } from "lucide-react";
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
  void onAdd;
  void onRemove;
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
        <table className=" w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium ">#</th>
              <th className="px-2 py-1.5 text-left font-medium w-[33%]">
                Nombres y apellidos
              </th>
              <th className="px-2 py-1.5 text-left font-medium w-[16%]">
                Pasaporte
              </th>
              <th className="px-2 py-1.5 text-left font-medium w-[33%]">
                Nacionalidad
              </th>
              <th className="px-2 py-1.5 text-left font-medium w-[16%]">
                Telefono
              </th>
            </tr>
          </thead>
          <tbody>
            {pasajeros.map((passenger, index) => {
              const selectedPais =
                paises.find(
                  (pais) =>
                    pais.nombre.toLowerCase() ===
                      passenger.nacionalidad.toLowerCase() ||
                    pais.iso.toLowerCase() ===
                      passenger.nacionalidad.toLowerCase(),
                ) ?? null;

              return (
                <tr key={passenger.id} className="border-t border-slate-200">
                  <td className="px-2 py-1.5 align-middle text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <TableTextInput
                      value={passenger.nombres}
                      navColumn="nombres"
                      navRow={index}
                      onChange={(value) =>
                        onUpdateField(passenger.id, "nombres", value)
                      }
                      placeholder="Nombres"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <TableTextInput
                      value={passenger.pasaporte}
                      navColumn="pasaporte"
                      navRow={index}
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
                      autoAdvanceOnSelect={false}
                      onChange={(pais) => {
                        onUpdateField(
                          passenger.id,
                          "nacionalidad",
                          pais?.nombre ?? "",
                        );
                        setTimeout(() => {
                          const next = document.getElementById(
                            `telefono-${passenger.id}`,
                          ) as HTMLInputElement | null;
                          next?.focus();
                        }, 0);
                      }}
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
                      id={`telefono-${passenger.id}`}
                      value={passenger.telefono}
                      navColumn="telefono"
                      navRow={index}
                      onChange={(value) =>
                        onUpdateField(passenger.id, "telefono", value)
                      }
                      placeholder="Telefono"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

export default PassengersSection;
