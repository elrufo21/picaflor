import { useMemo } from "react";
import { Users } from "lucide-react";
import {
  AutocompleteTable,
  TableDateInput,
  TableTextInput,
} from "@/components/ui/inputs";
import { getTodayIso } from "../constants/travelPackage.constants";
import { usePaises } from "../hooks/usePaises";
import type { PassengerRow } from "../types/travelPackage.types";
import SectionCard from "./SectionCard";

type Props = {
  pasajeros: PassengerRow[];
  onUpdateField: (
    id: number,
    key: keyof Omit<PassengerRow, "id">,
    value: string | number,
  ) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
};

const toPositiveIntegerText = (value: string): string => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return "";
  return String(Math.max(0, Math.floor(parsed)));
};

const PASSENGER_TYPE_OPTIONS = [
  { id: "GENERAL", value: "GENERAL", label: "GENERAL" },
  { id: "LIBERADO", value: "LIBERADO", label: "LIBERADO" },
  { id: "NIÑO", value: "NIÑO", label: "NIÑO" },
  { id: "ADULTO", value: "ADULTO", label: "ADULTO" },
] as const;

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
  const focusTotalTipoInput = (passengerId: number) => {
    setTimeout(() => {
      const totalTipoInput = document.getElementById(
        `total-tipo-${passengerId}`,
      ) as HTMLInputElement | null;
      totalTipoInput?.focus();
      totalTipoInput?.select();
    }, 0);
  };
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
        <table className="w-full min-w-[980px] table-auto text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 px-2 py-1.5 text-left font-medium">#</th>
              <th className="min-w-[220px] px-2 py-1.5 text-left font-medium">
                Nombres y apellidos
              </th>
              <th className="min-w-[140px] px-2 py-1.5 text-left font-medium">
                Pasaporte/DNI
              </th>

              <th className="min-w-[140px] px-2 py-1.5 text-left font-medium">
                Fecha de Nac.
              </th>
              <th className="min-w-[220px] px-2 py-1.5 text-left font-medium">
                Nacionalidad
              </th>
              <th className="min-w-[170px] px-2 py-1.5 text-left font-medium">
                Tipo pasajero
              </th>
              <th className="min-w-[110px] px-2 py-1.5 text-left font-medium">
                Total tipo
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
              const passengerTypeValue =
                String(passenger.tipoPasajero ?? "")
                  .trim()
                  .toUpperCase() || "GENERAL";
              const isLiberadoPassenger = passengerTypeValue === "LIBERADO";
              const selectedPassengerType =
                PASSENGER_TYPE_OPTIONS.find(
                  (option) => option.value === passengerTypeValue,
                ) ?? PASSENGER_TYPE_OPTIONS[0];

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
                        if (!isLiberadoPassenger) {
                          focusTotalTipoInput(passenger.id);
                        }
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
                    <AutocompleteTable
                      id={`tipo-pasajero-${passenger.id}`}
                      options={[...PASSENGER_TYPE_OPTIONS]}
                      value={selectedPassengerType}
                      autoAdvanceOnSelect={false}
                      onChange={(option) => {
                        const nextPassengerType = String(
                          option?.value ?? "GENERAL",
                        );
                        onUpdateField(
                          passenger.id,
                          "tipoPasajero",
                          nextPassengerType,
                        );
                        if (nextPassengerType === "LIBERADO") {
                          onUpdateField(passenger.id, "totalTipoPasajero", "");
                          return;
                        }
                        focusTotalTipoInput(passenger.id);
                      }}
                      getOptionKey={(option) => option.id}
                      getOptionLabel={(option) => option.label}
                      columns={[
                        {
                          key: "label",
                          header: "Tipo",
                          render: (option) => option.label,
                        },
                      ]}
                      noOptionsText="Sin tipos"
                      placeholder="Seleccionar"
                      size="small"
                    />
                  </td>
                  <td className="px-2 py-1.5 align-middle">
                    <TableTextInput
                      id={`total-tipo-${passenger.id}`}
                      value={String(passenger.totalTipoPasajero ?? "")}
                      navColumn="totalTipoPasajero"
                      navRow={index}
                      type="number"
                      textAlign="right"
                      disabled={isLiberadoPassenger}
                      onChange={(value) =>
                        onUpdateField(
                          passenger.id,
                          "totalTipoPasajero",
                          toPositiveIntegerText(value),
                        )
                      }
                      textSize="lg"
                      placeholder="0"
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
