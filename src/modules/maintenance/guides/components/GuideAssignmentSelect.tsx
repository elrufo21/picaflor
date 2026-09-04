import type { Guia } from "../hooks/useGuias";

type GuideAssignmentSelectProps = {
  guides: Guia[];
  value: string;
  region?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export default function GuideAssignmentSelect({
  guides,
  value,
  region,
  disabled = false,
  onChange,
}: GuideAssignmentSelectProps) {
  const activeGuides = guides.filter((guide) => guide.activo);
  const guidesForRegion = activeGuides.filter(
    (guide) => guide.region.trim().toLowerCase() === String(region ?? "").trim().toLowerCase(),
  );
  const options = guidesForRegion.length ? guidesForRegion : activeGuides;
  const hasSavedValue = value && !options.some((guide) => guide.nombre === value);

  return (
    <select
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
      className="w-40 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    >
      <option value="">Selecciona guía</option>
      {hasSavedValue ? <option value={value}>{value}</option> : null}
      {options.map((guide) => (
        <option key={guide.idGuia} value={guide.nombre}>
          {guide.nombre} · {guide.region}
        </option>
      ))}
    </select>
  );
}
