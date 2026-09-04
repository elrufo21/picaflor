import type { TransporteDetail } from "../hooks/useTransportes";

type TransportAssignmentSelectProps = {
  transportes: TransporteDetail[];
  value: string;
  region?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function TransportAssignmentSelect({
  transportes,
  value,
  region,
  disabled = false,
  onChange,
}: TransportAssignmentSelectProps) {
  const activeTransportes = transportes.filter((transporte) => transporte.activo);
  const transportesForRegion = activeTransportes.filter(
    (transporte) => transporte.region.trim().toLowerCase() === String(region ?? "").trim().toLowerCase(),
  );
  const options = transportesForRegion.length ? transportesForRegion : activeTransportes;
  const hasSavedValue = value && !options.some(
    (transporte) => transporte.nombreTransporte === value,
  );

  return (
    <select
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
      className="w-40 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    >
      <option value="">Selecciona transporte</option>
      {hasSavedValue ? <option value={value}>{value}</option> : null}
      {options.map((transporte) => (
        <option key={transporte.idTransporte} value={transporte.nombreTransporte}>
          {transporte.nombreTransporte}
          {transporte.unidades ? ` · ${transporte.unidades}` : ""}
        </option>
      ))}
    </select>
  );
}
