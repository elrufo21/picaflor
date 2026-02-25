import { useMemo } from "react";
import { Users } from "lucide-react";
import {
  AutocompleteTable,
  TableDateInput,
  TableTextInput,
} from "@/components/ui/inputs";
import { focusNextElement } from "@/shared/helpers/formFocus";
import { getTodayIso } from "../constants/travelPackage.constants";
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
  const maxBirthDate = useMemo(() => getTodayIso(), []);
  const paisesByValue = useMemo(() => {
    const map = new Map<string, (typeof paises)[number]>();
    paises.forEach((pais) => {
      const iso = String(pais.iso ?? "")
        .trim()
        .toLowerCase();
      const nombre = String(pais.nombre ?? "")
        .trim()
        .toLowerCase();
      if (iso) map.set(iso, pais);
      if (nombre) map.set(nombre, pais);
    });
    return map;
  }, [paises]);

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

              <th className="px-2 py-1.5 text-left font-medium w-[16%]">
                Fecha de Nac.
              </th>
              <th className="px-2 py-1.5 text-left font-medium w-[33%]">
                Nacionalidad
              </th>
            </tr>
          </thead>
          <tbody>
            {pasajeros.map((passenger, index) => {
              const selectedPais =
                paisesByValue.get(
                  String(passenger.nacionalidad ?? "")
                    .trim()
                    .toLowerCase(),
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
                    <TableDateInput
                      id={`fecha-nacimiento-${passenger.id}`}
                      value={passenger.fechaNacimiento}
                      navColumn="fechaNacimiento"
                      navRow={index}
                      onChange={(value) =>
                        onUpdateField(passenger.id, "fechaNacimiento", value)
                      }
                      max={maxBirthDate}
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <AutocompleteTable
                      id={`nacionalidad-${passenger.id}`}
                      options={paises}
                      value={selectedPais}
                      loading={loading}
                      autoAdvanceOnSelect={false}
                      onChange={(pais) => {
                        const nextNacionalidad = String(
                          pais?.nombre ?? "",
                        ).trim();
                        const currentNacionalidad = String(
                          passenger.nacionalidad ?? "",
                        ).trim();
                        if (
                          nextNacionalidad.toLowerCase() ===
                          currentNacionalidad.toLowerCase()
                        ) {
                          return;
                        }

                        onUpdateField(
                          passenger.id,
                          "nacionalidad",
                          nextNacionalidad,
                        );

                        if (index === 0 && nextNacionalidad) {
                          pasajeros.slice(1).forEach((nextPassenger) => {
                            const rowNacionalidad = String(
                              nextPassenger.nacionalidad ?? "",
                            ).trim();
                            if (
                              rowNacionalidad.toLowerCase() ===
                              nextNacionalidad.toLowerCase()
                            ) {
                              return;
                            }
                            onUpdateField(
                              nextPassenger.id,
                              "nacionalidad",
                              nextNacionalidad,
                            );
                          });
                        }

                        setTimeout(() => {
                          const nextRowNombres = document.querySelector(
                            `input[data-nav-col="nombres"][data-nav-row="${String(index + 1)}"]`,
                          ) as HTMLInputElement | null;

                          if (nextRowNombres) {
                            nextRowNombres.focus();
                            return;
                          }

                          const currentNacionalidadInput =
                            document.getElementById(
                              `nacionalidad-${passenger.id}`,
                            );
                          if (!currentNacionalidadInput) return;
                          focusNextElement(
                            currentNacionalidadInput,
                            currentNacionalidadInput.closest("form"),
                          );
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
