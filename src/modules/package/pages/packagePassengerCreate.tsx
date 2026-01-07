import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import {
  TextControlled,
  SelectControlled,
  DateInput,
  AutocompleteControlled,
} from "../../../components/ui/inputs";
import { usePackageStore } from "../store/packageStore";
import { useDialogStore } from "../../../app/store/dialogStore";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

type SelectOption = { value: string; label: string };
type CanalOption = SelectOption & {
  contacto?: string;
  telefono?: string;
  email?: string;
  auxiliar?: string;
};

type FormValues = {
  nombreCompleto: string;
  documentoTipo: string;
  documentoNumero: string;
  celular?: string;
  email?: string;
  telefono?: string;
  cantPax: number;
  fechaViaje: string;
  fechaPago?: string;
  fechaEmision?: string;
  moneda?: string;
  origen?: string;
  canalVenta?: CanalOption | null;
  counter?: string;
  condicion?: SelectOption | null;
  puntoPartida?: string;
  otrosPartidas?: string;
  hotel?: string;
  horaPresentacion?: string;
  visitas?: string;
  tarifaTour?: string;
  precioBase?: number;
  precioUnit?: number;
  cantidad?: number;
  subTotal?: number;
  actividad1?: string;
  actividad2?: string;
  actividad3?: string;
  traslados?: string;
  entradas?: string;
  impuesto?: number;
  cargosExtras?: number;
  acuenta?: number;
  cobroExtraSol?: number;
  cobroExtraDol?: number;
  deposito?: number;
  medioPago?: string;
  entidadBancaria?: string;
  nroOperacion?: string;
  notas?: string;
  salida?: string;
};

const documentoOptions = [
  { value: "DNI", label: "DNI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "CE", label: "C.E." },
];

const CANAL_LIST_ENDPOINT = "http://localhost:5000/api/v1/Canal/list";

const canalVentaOptions: CanalOption[] = [];

const estadoPagoOptions: SelectOption[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PAGADO", label: "Pagado" },
  { value: "PARCIAL", label: "Pago parcial" },
];

const monedaOptions = [
  { value: "PEN", label: "Soles" },
  { value: "USD", label: "Dólares" },
];

const origenOptions = [
  { value: "LIMA", label: "Lima" },
  { value: "AREQUIPA", label: "Arequipa" },
  { value: "CUSCO", label: "Cusco" },
];

const impuestoOptions = [
  { value: "IGV", label: "IGV" },
  { value: "EXENTO", label: "Exento" },
];

const puntoPartidaOptions = [
  { value: "LIMA", label: "Lima" },
  { value: "MIRAFLORES", label: "Miraflores" },
  { value: "SAN_ISIDRO", label: "San Isidro" },
];

const hotelOptions = [
  { value: "-", label: "-" },
  { value: "HOTEL_A", label: "Hotel A" },
  { value: "HOTEL_B", label: "Hotel B" },
];

const tarifaTourOptions = [
  { value: "TOUR_FULL_DAY", label: "Tour Full Day" },
  { value: "TOUR_MEDIO_DIA", label: "Tour Medio Día" },
];

const actividadOptions = [
  { value: "-", label: "-" },
  { value: "ACT1", label: "Actividad 01" },
  { value: "ACT2", label: "Actividad 02" },
  { value: "ACT3", label: "Actividad 03" },
];

const medioPagoOptions = [
  { value: "", label: "(SELECCIONE)" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA", label: "Tarjeta" },
];

const bancoOptions = [
  { value: "", label: "(SELECCIONE)" },
  { value: "BCP", label: "BCP" },
  { value: "BBVA", label: "BBVA" },
  { value: "INTERBANK", label: "Interbank" },
];

const parseCanalPayload = (payload: unknown): CanalOption[] => {
  const fromDelimitedRow = (row: string, idx: number): CanalOption | null => {
    if (!row) return null;
    const columns = row.split("|").map((col) => col.trim());
    if (columns.length >= 2) {
      const [id, nombre, contacto, telefono, email] = columns;
      const value = id || nombre || `CANAL_${idx + 1}`;
      const label = nombre || value;
      return {
        value,
        label,
        contacto: contacto && contacto !== "-" ? contacto : undefined,
        telefono: telefono && telefono !== "-" ? telefono : undefined,
        email: email && email !== "-" ? email : undefined,
        auxiliar: nombre,
      };
    }

    const trimmed = row.trim();
    if (!trimmed) return null;
    return { value: trimmed, label: trimmed };
  };

  if (typeof payload === "string") {
    const rows = payload
      .split(/¬|\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean);

    return rows
      .map((row, idx) => fromDelimitedRow(row, idx))
      .filter(Boolean) as CanalOption[];
  }

  if (Array.isArray(payload)) {
    return payload
      .map((item, idx) => {
        if (typeof item === "string") return fromDelimitedRow(item, idx);
        if (item && typeof item === "object") {
          const valueCandidate =
            (item as any).value ??
            (item as any).IdCanal ??
            (item as any).codigo ??
            (item as any).code ??
            (item as any).id ??
            (item as any).Id ??
            (item as any).slug ??
            (item as any).CanalNombre ??
            (item as any).nombre ??
            (item as any).name;
          const labelCandidate =
            (item as any).label ??
            (item as any).descripcion ??
            (item as any).descripcionCanal ??
            (item as any).CanalNombre ??
            (item as any).nombre ??
            (item as any).name ??
            valueCandidate;
          const contacto = (item as any).Contacto ?? (item as any).contacto;
          const telefono = (item as any).Telefono ?? (item as any).telefono;
          const email = (item as any).Email ?? (item as any).email;

          if (!valueCandidate && !labelCandidate) return null;
          return {
            value: String(
              valueCandidate ?? labelCandidate ?? `CANAL_${idx + 1}`
            ),
            label: String(
              labelCandidate ?? valueCandidate ?? `Canal ${idx + 1}`
            ),
            contacto: contacto ? String(contacto) : undefined,
            telefono: telefono ? String(telefono) : undefined,
            email: email ? String(email) : undefined,
            auxiliar: (item as any).auxiliar
              ? String((item as any).auxiliar)
              : undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as CanalOption[];
  }

  if (payload && typeof payload === "object") {
    const data = (payload as any).data;
    if (typeof data === "string" || Array.isArray(data)) {
      return parseCanalPayload(data);
    }
  }

  return [];
};

const PackagePassengerCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pkg = usePackageStore((state) => state.getPackageById(Number(id)));
  const addPassenger = usePackageStore((state) => state.addPassenger);
  const openDialog = useDialogStore((state) => state.openDialog);

  const {
    control,
    handleSubmit,
    watch,
    register,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      nombreCompleto: "",
      documentoTipo: "DNI",
      documentoNumero: "",
      celular: "",
      telefono: "",
      email: "",
      cantPax: 1,
      fechaViaje: pkg?.fecha ?? new Date().toISOString().slice(0, 10),
      fechaPago: new Date().toISOString().slice(0, 10),
      fechaEmision: new Date().toISOString().slice(0, 10),
      moneda: "PEN",
      origen: "LIMA",
      canalVenta: null,
      counter: "ANDRE RAMIREZ",
      condicion: null,
      puntoPartida: "",
      otrosPartidas: "",
      hotel: "",
      horaPresentacion: "",
      visitas: pkg?.destino ?? "",
      tarifaTour: "",
      actividad1: "-",
      actividad2: "-",
      actividad3: "-",
      traslados: "",
      entradas: "",
      precioUnit: 0,
      cantidad: 1,
      subTotal: 0,
      precioBase: 0,
      impuesto: 0,
      cargosExtras: 0,
      acuenta: 0,
      cobroExtraSol: 0,
      cobroExtraDol: 0,
      deposito: 0,
      medioPago: "",
      entidadBancaria: "",
      nroOperacion: "",
      notas: "",
    },
    mode: "onBlur",
  });

  const [canalVentaList, setCanalVentaList] =
    useState<CanalOption[]>(canalVentaOptions);
  const precioBase = watch("precioBase");
  const impuesto = watch("impuesto");
  const cargosExtras = watch("cargosExtras");
  const acuenta = watch("acuenta");
  const precioUnit = watch("precioUnit");
  const cantidad = watch("cantidad");

  const extractOptionValue = (option?: SelectOption | CanalOption | null) =>
    typeof option === "string" ? option : option?.value ?? "";

  const totals = useMemo(() => {
    const precio = Number(precioBase ?? 0);
    const imp = Number(impuesto ?? 0);
    const extras = Number(cargosExtras ?? 0);
    const aCuenta = Number(acuenta ?? 0);
    const total = precio + imp + extras - aCuenta;
    return {
      total: total > 0 ? total : 0,
      saldo: total > 0 ? total : 0,
      subTotal: Number(precioUnit ?? 0) * Number(cantidad ?? 0),
    };
  }, [precioBase, impuesto, cargosExtras, acuenta, precioUnit, cantidad]);

  const handleAddCanalVenta = () => {
    openDialog({
      title: "Nuevo canal de venta",
      description: "Crea un canal de venta sin salir del formulario.",
      size: "md",
      initialPayload: {
        label: "",
        value: "",
        contacto: "",
        telefono: "",
        email: "",
        search: "",
        editingValue: "",
      },
      confirmLabel: "Guardar canal",
      content: ({ payload, setPayload, close }) => {
        const search = String(payload.search ?? "").toLowerCase();
        const filtered = canalVentaList.filter((opt) => {
          const haystack = [
            opt.label,
            opt.contacto ?? "",
            opt.telefono ?? "",
            opt.email ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(search);
        });

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Nombre</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.label ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, label: e.target.value })
                  }
                  placeholder="Ej: AEROMAR TRAVEL"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">
                  Código interno (opcional)
                </span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.value ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, value: e.target.value })
                  }
                  placeholder="Ej: WEB_PERU"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Contacto</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.contacto ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, contacto: e.target.value })
                  }
                  placeholder="Ej: DIANA"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Teléfono</span>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.telefono ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, telefono: e.target.value })
                  }
                  placeholder="Ej: 984821760"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
                <span className="font-semibold text-slate-800">Email</span>
                <input
                  type="email"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={String(payload.email ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, email: e.target.value })
                  }
                  placeholder="Ej: contacto@canal.com"
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  Lista de canales
                </label>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Buscar..."
                  value={String(payload.search ?? "")}
                  onChange={(e) =>
                    setPayload({ ...payload, search: e.target.value })
                  }
                />
              </div>
              <div className="border border-slate-200 rounded-lg max-h-64 overflow-auto divide-y divide-slate-200">
                {filtered.length === 0 && (
                  <p className="text-sm text-slate-500 px-3 py-2">
                    No hay canales para mostrar.
                  </p>
                )}
                {filtered.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-800">
                        {opt.label}
                      </p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
                        {opt.contacto && <span>Contacto: {opt.contacto}</span>}
                        {opt.telefono && <span>Teléfono: {opt.telefono}</span>}
                        {opt.email && <span>Email: {opt.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                        onClick={() =>
                          setPayload({
                            ...payload,
                            label: opt.label,
                            value: opt.value,
                            contacto: opt.contacto ?? "",
                            telefono: opt.telefono ?? "",
                            email: opt.email ?? "",
                            editingValue: opt.value,
                          })
                        }
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        onClick={() => {
                          setValue("canalVenta", opt);
                          close();
                        }}
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },
      onConfirm: (data) => {
        const label = String(data.label ?? "").trim();
        const customValue = String(data.value ?? "").trim();
        const contacto = String(data.contacto ?? "").trim();
        const telefono = String(data.telefono ?? "").trim();
        const email = String(data.email ?? "").trim();
        const editingValue = String(data.editingValue ?? "").trim();

        if (!label) {
          alert("Ingresa el nombre del canal de venta.");
          throw new Error("Nombre de canal de venta requerido");
        }

        const newOption = {
          label,
          value: customValue || label.trim().toUpperCase().replace(/\s+/g, "_"),
          contacto: contacto || undefined,
          telefono: telefono || undefined,
          email: email || undefined,
          auxiliar: label,
        };

        setCanalVentaList((prev) => {
          const targetIndex = editingValue
            ? prev.findIndex(
                (opt) => opt.value.toLowerCase() === editingValue.toLowerCase()
              )
            : -1;

          if (targetIndex >= 0) {
            const next = [...prev];
            next[targetIndex] = newOption;
            return next;
          }

          const exists = prev.some(
            (opt) =>
              opt.value.toLowerCase() === newOption.value.toLowerCase() ||
              opt.label.toLowerCase() === newOption.label.toLowerCase()
          );
          if (exists) return prev;
          return [...prev, newOption];
        });
        setValue("canalVenta", newOption);
      },
    });
  };

  if (!pkg) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <p className="text-sm text-rose-600">Paquete no encontrado.</p>
        <button
          className="mt-3 text-sm text-blue-600 underline"
          onClick={() => navigate("/package")}
        >
          Volver a paquetes
        </button>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    addPassenger(pkg.id, {
      ...values,
      canalVenta: extractOptionValue(values.canalVenta),
      condicion: extractOptionValue(values.condicion),
      precioBase: Number(values.precioBase ?? 0),
      impuesto: Number(values.impuesto ?? 0),
      cargosExtras: Number(values.cargosExtras ?? 0),
      acuenta: Number(values.acuenta ?? 0),
      cobroExtraSol: Number(values.cobroExtraSol ?? 0),
      cobroExtraDol: Number(values.cobroExtraDol ?? 0),
      deposito: Number(values.deposito ?? 0),
      cantPax: Number(values.cantPax ?? 1),
      fechaViaje: values.fechaViaje,
      fechaPago: values.fechaPago,
      total: totals.total,
      subTotal: totals.subTotal,
      actividades: [
        values.actividad1 ?? "-",
        values.actividad2 ?? "-",
        values.actividad3 ?? "-",
      ],
    });
    navigate("/package");
  });
  console.log("Rerendering PackagePassengerCreate", pkg);
  const [tab, setTab] = useState(0);
  const [tarifaRows, setTarifaRows] = useState([
    {
      id: "tarifaTour",
      label: "Tarifa de Tour:",
      type: "select",
      precioUnit: 99,
      cantidad: 0,
    },
    {
      id: "actividad1",
      label: "• Actividad 01:",
      type: "select",
      precioUnit: 0,
      cantidad: 0,
    },
    {
      id: "actividad2",
      label: "• Actividad 02:",
      type: "select",
      precioUnit: 0,
      cantidad: 0,
    },
    {
      id: "actividad3",
      label: "• Actividad 03:",
      type: "select",
      precioUnit: 0,
      cantidad: 0,
    },
    {
      id: "traslados",
      label: "• Traslados:",
      type: "input",
      precioUnit: 0,
      cantidad: 0,
    },
    {
      id: "entradas",
      label: "Entradas:",
      type: "input",
      precioUnit: 0,
      cantidad: 0,
    },
  ]);
  useEffect(() => {
    const controller = new AbortController();

    const fetchCanales = async () => {
      try {
        const response = await fetch(CANAL_LIST_ENDPOINT, {
          headers: { accept: "application/json, text/plain" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const rawText = await response.text();
        const parsed = (() => {
          try {
            return JSON.parse(rawText);
          } catch {
            return rawText;
          }
        })();

        const mapped: SelectOption[] = parseCanalPayload(parsed);

        if (mapped.length === 0) return;

        setCanalVentaList((prev) => {
          const existing = new Map(
            prev.map((opt) => [opt.value.toLowerCase(), opt])
          );
          mapped.forEach((opt) => {
            const key = opt.value.toLowerCase();
            if (!existing.has(key)) {
              existing.set(key, opt);
            }
          });
          return Array.from(existing.values());
        });
      } catch (error) {
        if ((error as any).name === "AbortError") return;
        console.error("No se pudo cargar canales de venta", error);
      }
    };

    fetchCanales();

    return () => controller.abort();
  }, []);

  const updateRow = (
    id: string,
    key: "precioUnit" | "cantidad",
    value: number
  ) => {
    setTarifaRows((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, [key]: Number(value) || 0 } : row
      )
    );
  };

  const tarifaTotal = useMemo(
    () =>
      tarifaRows.reduce(
        (acc, row) => acc + (row.precioUnit ?? 0) * (row.cantidad ?? 0),
        0
      ),
    [tarifaRows]
  );

  const [comprobanteName, setComprobanteName] = useState(
    "Sin archivos seleccionados"
  );
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprobanteName(file.name);
    } else {
      setComprobanteName("Sin archivos seleccionados");
    }
  };

  const focusNext = (
    current?: HTMLElement | null,
    form?: HTMLElement | null
  ) => {
    if (!current) return;
    const scope = form ?? current.closest("form");
    if (!scope) return;
    const focusables = Array.from(
      scope.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    const currentIndex = focusables.indexOf(current);
    if (currentIndex >= 0) {
      const next = focusables[currentIndex + 1] ?? focusables[0];
      next.focus();
    }
  };

  const handleEnterFocus = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    // Avoid interfering with buttons/submit
    if (target.tagName === "BUTTON") return;
    e.preventDefault();

    focusNext(target, target.closest("form"));
  };

  const handleAdvanceAfterChange = (e: ChangeEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    setTimeout(() => focusNext(target, target.closest("form")), 0);
  };
  const handleSelectAdvanceCapture = (e: ChangeEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "SELECT") {
      setTimeout(() => focusNext(target, target.closest("form")), 0);
    }
  };
  return (
    <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm max-w-8xl mx-auto">
      <form
        onSubmit={onSubmit}
        onKeyDown={handleEnterFocus}
        onChangeCapture={handleSelectAdvanceCapture}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  Datos del paquete
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
                    {pkg.destino}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold">
                    {new Date(pkg.fecha).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <TextControlled
                  name="visitas"
                  disabled
                  control={control}
                  size="small"
                  label="Destino"
                />
                <SelectControlled
                  name="moneda"
                  control={control}
                  label="Moneda"
                  options={monedaOptions}
                  required
                  size="small"
                />
                <SelectControlled
                  name="origen"
                  control={control}
                  label="Salida"
                  options={origenOptions}
                  required
                  size="small"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="col-span-2">
                    <DateInput
                      name="fechaViaje"
                      control={control}
                      label="Fecha de viaje"
                      required
                      disabled
                      size="small"
                    />
                  </div>
                  <div className="h-full flex items-center text-xs text-slate-600">
                    Disp:{" "}
                    <span className="ml-1 font-semibold text-emerald-700">
                      {pkg.disponibles}
                    </span>
                  </div>
                </div>
                <DateInput
                  name="fechaEmision"
                  control={control}
                  label="Fecha de emisión"
                  required
                  size="small"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AutocompleteControlled
                  name="canalVenta"
                  control={control}
                  label="Canal de venta"
                  options={canalVentaList}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  inputEndAdornment={
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                      onClick={handleAddCanalVenta}
                    >
                      Nuevo
                    </button>
                  }
                  required
                  size="small"
                  className="w-full"
                />
                <TextControlled
                  name="counter"
                  control={control}
                  label="Counter"
                  disabled
                  size="small"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <TextControlled
                  name="telefono"
                  control={control}
                  label="Teléfono"
                  size="small"
                />
                <AutocompleteControlled
                  name="condicion"
                  control={control}
                  label="Condición"
                  options={estadoPagoOptions}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) =>
                    option.value === value.value
                  }
                  required
                  size="small"
                />
              </div>
            </div>
            <Divider />
            <div className="rounded-2xl border border-slate-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-800">
                  Contacto y actividades del pax
                </h2>
                <span className="text-xs text-slate-500">
                  Datos mínimos para reservar
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
                <div className="col-span-3">
                  <TextControlled
                    name="nombreCompleto"
                    control={control}
                    label="Nombre completo"
                    required
                    size="small"
                  />
                </div>
                <div className="col-span-2">
                  <TextControlled
                    name="documentoNumero"
                    control={control}
                    label="Número de documento"
                    required
                    size="small"
                  />
                </div>
                <div className="col-span-1">
                  <TextControlled
                    name="celular"
                    control={control}
                    label="Celular Pax"
                    required
                    size="small"
                  />
                </div>
                <div>
                  <TextControlled
                    name="cantPax"
                    control={control}
                    label="Cant"
                    type="number"
                    required
                    size="small"
                  />
                </div>
              </div>
            </div>
            <Divider />
            <Paper
              elevation={0}
              className="border border-slate-100 rounded-xl shadow-sm"
            >
              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Detalles" />
              </Tabs>
              <div className="p-2.5">
                {tab === 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <label className="flex flex-col text-sm text-slate-700">
                        <span className="font-semibold mb-1">
                          Punto partida
                        </span>
                        <select
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          {...register("puntoPartida", {
                            onChange: handleAdvanceAfterChange,
                          })}
                        >
                          {puntoPartidaOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col text-sm text-slate-700">
                        <span className="font-semibold mb-1">Hotel</span>
                        <select
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          {...register("hotel", {
                            onChange: handleAdvanceAfterChange,
                          })}
                        >
                          {hotelOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
                        <span className="font-semibold mb-1">
                          Otros partidas
                        </span>
                        <input
                          className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ingresa punto alterno"
                          {...register("otrosPartidas")}
                        />
                      </label>

                      <label className="flex flex-col text-sm text-slate-700">
                        <span className="font-semibold mb-1">Hora P.</span>
                        <input
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="HH:MM"
                          {...register("horaPresentacion")}
                        />
                      </label>

                      <label className="flex flex-col text-sm text-slate-700 md:col-span-3">
                        <span className="font-semibold mb-1">
                          Visitas y excursiones
                        </span>
                        <textarea
                          className="rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          rows={2}
                          {...register("visitas")}
                        />
                      </label>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border border-slate-300 text-xs bg-white">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-300 px-1.5 py-1 w-32"></th>
                            <th className="border border-slate-300 px-1.5 py-1 text-left font-semibold text-slate-800">
                              DETALLE DE TARIFA:
                            </th>
                            <th className="border border-slate-300 px-1.5 py-1 text-center font-semibold text-amber-700 w-16">
                              Pre Uni.
                            </th>
                            <th className="border border-slate-300 px-1.5 py-1 text-center font-semibold text-amber-700 w-16">
                              Cantidad
                            </th>
                            <th className="border border-slate-300 px-1.5 py-1 text-center font-semibold text-amber-700 w-16">
                              Sub Total.
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tarifaRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50">
                              <td className="border border-slate-300 px-1.5 py-1">
                                <div
                                  className={`${
                                    row.id === "tarifaTour"
                                      ? "bg-orange-500"
                                      : "bg-orange-400"
                                  } text-white px-2.5 py-1.5 rounded font-semibold text-[11px] sm:text-xs whitespace-nowrap`}
                                >
                                  {row.label}
                                </div>
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1">
                                {row.type === "select" ? (
                                  <select
                                    className="w-full rounded border border-slate-300 px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 text-[11px] sm:text-xs"
                                    {...register(
                                      row.id === "tarifaTour"
                                        ? "tarifaTour"
                                        : (row.id as keyof FormValues),
                                      { onChange: handleAdvanceAfterChange }
                                    )}
                                  >
                                    <option value="">(SELECCIONE)</option>
                                    {row.id === "tarifaTour"
                                      ? tarifaTourOptions.map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </option>
                                        ))
                                      : actividadOptions.map((opt) => (
                                          <option
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    className="w-full rounded border border-slate-300 px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500 text-[11px] sm:text-xs"
                                    placeholder="-"
                                    {...register(row.id as keyof FormValues)}
                                  />
                                )}
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.precioUnit}
                                  onChange={(e) =>
                                    updateRow(
                                      row.id,
                                      "precioUnit",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-orange-500 text-[11px] sm:text-xs"
                                />
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1">
                                <input
                                  type="number"
                                  value={row.cantidad}
                                  onChange={(e) =>
                                    updateRow(
                                      row.id,
                                      "cantidad",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-orange-500 text-[11px] sm:text-xs"
                                />
                              </td>
                              <td className="border border-slate-300 px-1.5 py-1 text-right font-semibold">
                                {(row.precioUnit * row.cantidad).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Paper>
          </div>
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <SelectControlled
                  name="documentoTipo"
                  control={control}
                  label="Documento cobranza"
                  options={documentoOptions}
                  size="small"
                />
              </div>
              <div>
                <TextControlled
                  name="documentoNumero"
                  control={control}
                  label="N° documento"
                  size="small"
                />
              </div>
              <div>
                <SelectControlled
                  name="documentoTipo"
                  control={control}
                  label="Documento cobranza"
                  options={documentoOptions}
                  size="small"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-2">
                Precio De Liquidación
              </p>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="grid grid-cols-3 border-b border-slate-300">
                  <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
                    TOTAL A PAGAR S/ :
                  </div>
                  <div className="px-3 py-2 text-right font-semibold">
                    {totals.total.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-300">
                  <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
                    ACUENTA:
                  </div>
                  <div className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                      {...register("acuenta", { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-300">
                  <div className="bg-amber-300 text-amber-900 font-semibold px-3 py-2 col-span-2">
                    SALDO S/ :
                  </div>
                  <div className="px-3 py-2 text-right font-semibold">
                    {(totals.total - (watch("acuenta") || 0)).toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 border-b border-slate-300">
                  <div className="bg-amber-50 text-amber-900 font-semibold px-3 py-2 col-span-2">
                    Cobro Extra Sol:
                  </div>
                  <div className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                      {...register("cobroExtraSol", { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="bg-amber-50 text-amber-900 font-semibold px-3 py-2 col-span-2">
                    Cobro Extra Dol:
                  </div>
                  <div className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full rounded border border-slate-200 px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                      {...register("cobroExtraDol", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Medio de pago
                </p>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  Cobranza
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DateInput
                    name="fechaPago"
                    control={control}
                    label="Fecha de adelanto"
                    size="small"
                  />
                  <TextControlled
                    name="nroOperacion"
                    control={control}
                    label="Nro Operación"
                    size="small"
                  />
                  <SelectControlled
                    name="medioPago"
                    control={control}
                    label="Medio de pago"
                    options={medioPagoOptions}
                    size="small"
                  />
                  <SelectControlled
                    name="entidadBancaria"
                    control={control}
                    label="Entidad bancaria"
                    options={bancoOptions}
                    size="small"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <TextControlled
                    name="deposito"
                    control={control}
                    label="Depósito S/"
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    size="small"
                  />
                  <TextControlled
                    name="cobroExtraSol"
                    control={control}
                    label="Efectivo S/"
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    size="small"
                  />
                  <TextControlled
                    name="cobroExtraDol"
                    control={control}
                    label="Efectivo $"
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    size="small"
                  />
                </div>

                {/** <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Adjuntar comprobante
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label
                      htmlFor="comprobante"
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-sm font-medium"
                    >
                      Seleccionar archivo
                    </label>
                    <input
                      id="comprobante"
                      type="file"
                      accept=".pdf,.jpg,.png"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <span className="text-xs text-slate-600 truncate">
                      {comprobanteName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    PDF, JPG o PNG (máx. 5MB)
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PackagePassengerCreate;
