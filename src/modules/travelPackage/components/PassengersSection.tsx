import { TextField } from "@mui/material";
import { Trash2, Plus, Users } from "lucide-react";
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
}: Props) => (
    <SectionCard
        icon={Users}
        title="3. Pasajeros"
        description="Lista de pasajeros."
    >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-[400px] w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600">
                    <tr>
                        <th className="px-2 py-1.5 text-left font-medium w-8">#</th>
                        <th className="px-2 py-1.5 text-left font-medium">
                            Nombres y apellidos
                        </th>
                        <th className="px-2 py-1.5 text-left font-medium w-24">Doc.</th>
                        <th className="px-2 py-1.5 text-left font-medium w-24">Nac.</th>
                        <th className="px-2 py-1.5 text-center font-medium w-16"></th>
                    </tr>
                </thead>
                <tbody>
                    {pasajeros.map((passenger, index) => (
                        <tr key={passenger.id} className="border-t border-slate-200">
                            <td className="px-2 py-1.5 align-middle text-slate-500">
                                {index + 1}
                            </td>
                            <td className="px-2 py-1.5 align-middle">
                                <input
                                    type="text"
                                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                                    value={passenger.nombres}
                                    onChange={(e) =>
                                        onUpdateField(passenger.id, "nombres", e.target.value)
                                    }
                                    placeholder="Nombres"
                                />
                            </td>
                            <td className="px-2 py-1.5 align-middle">
                                <input
                                    type="text"
                                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                                    value={passenger.documento}
                                    onChange={(e) =>
                                        onUpdateField(passenger.id, "documento", e.target.value)
                                    }
                                    placeholder="DNI/Pas"
                                />
                            </td>
                            <td className="px-2 py-1.5 align-middle">
                                <input
                                    type="text"
                                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
                                    value={passenger.nacionalidad}
                                    onChange={(e) =>
                                        onUpdateField(passenger.id, "nacionalidad", e.target.value)
                                    }
                                    placeholder="Nac."
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
                    ))}
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

export default PassengersSection;
