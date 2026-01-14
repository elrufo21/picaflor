import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { pdf } from "@react-pdf/renderer";
import { Plus, Save, Printer } from "lucide-react";
import { showToast } from "../../../components/ui/AppToast";
import PdfDocument, { buildInvoiceData } from "@/components/invoice/Invoice";
import { usePackageStore } from "../store/fulldayStore";
import { useDialogStore } from "../../../app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { useCanalVenta } from "../hooks/useCanalVenta";
import { usePackageData } from "../hooks/usePackageData";
import { PackageHeader } from "../components/create-passenger/FullDayHeader";
import { PassengerDetails } from "../components/create-passenger/PassengerDetails";
import { ServicesTable } from "../components/create-passenger/ServicesTable";
import { PaymentSummary } from "../components/create-passenger/PaymentSummary";
import {
  buildLegacyPayloadString,
  buildOrdenPayload,
  parseLegacyPayloadString,
} from "../utils/payloadBuilder";
import type { CanalOption, SelectOption } from "../hooks/canalUtils";
import { DateInput, TextControlled } from "@/components/ui/inputs";

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
  precioVenta?: number;
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
  efectivo?: number;
  medioPago?: string;
  entidadBancaria?: string;
  nroOperacion?: string;
  documentoCobranza?: string;
  nserie?: string;
  ndocumento?: string;
  notas?: string;
  mensajePasajero?: string;
  salida?: string;
  destino?: string;
};

const documentoOptions = [
  { value: "DNI", label: "DNI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "CE", label: "C.E." },
];

const estadoPagoOptions = [
  { value: "Cancelado", label: "Cancelado" },
  { value: "A Cuenta", label: "A Cuenta" },
  { value: "Crédito", label: "Crédito" },
];

const monedaOptions = [
  { value: "PEN", label: "Soles" },
  { value: "USD", label: "Dólares" },
];

const medioPagoOptions = [
  { value: "", label: "(SELECCIONE)" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "DEPOSITO", label: "Deposito" },
  { value: "YAPE", label: "Yape" },
];

const bancoOptions = [
  { value: "", label: "(SELECCIONE)" },
  { value: "-", label: "-" },
  { value: "BCP", label: "BCP" },
  { value: "BBVA", label: "BBVA" },
  { value: "INTERBANK", label: "Interbank" },
];

const PackagePassengerCreate = () => {
  const { user } = useAuthStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const addPassenger = usePackageStore((s) => s.addPassenger);
  const openDialog = useDialogStore((s) => s.openDialog);
  const { date } = usePackageStore();

  const {
    control,
    handleSubmit,
    watch,
    register,
    setFocus,
    setValue,
    getValues,
    setError,
    clearErrors,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {
      nombreCompleto: "",
      documentoTipo: "DNI",
      documentoNumero: "",
      celular: "",
      telefono: "",
      email: "",
      cantPax: 0,
      fechaViaje: date,
      fechaPago: new Date().toISOString().slice(0, 10),
      fechaEmision: new Date().toISOString().slice(0, 10),
      moneda: "PEN",
      origen: "LIMA",
      canalVenta: null,
      counter: user?.displayName,
      condicion: null,
      puntoPartida: "",
      otrosPartidas: "",
      hotel: "",
      horaPresentacion: "",
      visitas: "",
      tarifaTour: "",
      actividad1: "-",
      actividad2: "-",
      actividad3: "-",
      traslados: "",
      entradas: "",
      precioUnit: 0,
      cantidad: 1,
      subTotal: 0,
      precioVenta: 0,
      impuesto: 0,
      cargosExtras: 0,
      acuenta: 0,
      cobroExtraSol: 0,
      cobroExtraDol: 0,
      deposito: 0,
      efectivo: 0,
      medioPago: "",
      entidadBancaria: "",
      nroOperacion: "",
      documentoCobranza: "DOCUMENTO DE COBRANZA",
      nserie: "",
      ndocumento: "",
      notas: "",
      mensajePasajero: "",
      destino: "",
    },
    mode: "onBlur",
  });

  // Hooks
  const { canalVentaList, addCanalToList } = useCanalVenta();
  const {
    pkg,
    partidas,
    hoteles,
    direccionesHotel,
    actividades,
    almuerzos,
    trasladosOptions,
    horasPartida,
    preciosActividades,
    preciosAlmuerzo,
    preciosTraslado,
  } = usePackageData(id, setValue);
  const loadPackages = usePackageStore((s) => s.loadPackages);

  useEffect(() => {
    if (pkg?.destino) {
      setValue("destino", pkg.destino);
    }
  }, [pkg, setValue]);

  useEffect(() => {
    if (!pkg && Number.isFinite(Number(id))) {
      loadPackages(date).catch(() => {
        // swallow; error handled in store
      });
    }
  }, [pkg, id, loadPackages, date]);

  useEffect(() => {
    if (pkg) {
      setFocus("canalVenta");
    }
  }, [pkg, setFocus]);

  const canalVentaSelected = watch("canalVenta");

  useEffect(() => {
    if (!canalVentaSelected) return;
    if (canalVentaSelected.telefono)
      setValue("telefono", canalVentaSelected.telefono);
    if (canalVentaSelected.email) setValue("email", canalVentaSelected.email);
    setFocus("telefono");
  }, [canalVentaSelected, setFocus, setValue]);

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
      content: ({ payload, setPayload, close }: any) => {
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
                {filtered?.map((opt) => (
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
      onConfirm: (data: any) => {
        const label = String(data.label ?? "").trim();
        const customValue = String(data.value ?? "").trim();
        const contacto = String(data.contacto ?? "").trim();
        const telefono = String(data.telefono ?? "").trim();
        const email = String(data.email ?? "").trim();
        const editingValue = String(data.editingValue ?? "").trim();

        if (!label) {
          showToast({
            title: "Atención",
            description: "Ingresa el nombre del canal de venta.",
            type: "warning",
          });
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

        addCanalToList(newOption, editingValue);
        setValue("canalVenta", newOption);
      },
    });
  };

  const [tarifaRows, setTarifaRows] = useState([
    {
      id: "tarifaTour",
      label: "Tarifa de Tour:",
      type: "select",
      precioUnit: 0,
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
      type: "select",
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
  const [precioError, setPrecioError] = useState(false);

  const cobroExtraSol = watch("cobroExtraSol");
  const tarifaTourValue = watch("tarifaTour");
  const trasladosValue = watch("traslados");
  const actividad1Value = watch("actividad1");
  const actividad2Value = watch("actividad2");
  const actividad3Value = watch("actividad3");
  const precioVentaValue = watch("precioVenta") || 0;
  const acuenta = watch("acuenta") || 0;
  const cantPaxValue = watch("cantPax") || 0;
  const partidaValue = watch("puntoPartida") || "";
  const hotelValue = watch("hotel") || "";
  const isIslasSelected = useMemo(
    () =>
      [actividad1Value, actividad2Value, actividad3Value]
        .map((value) => String(value ?? "").trim())
        .includes("1"),
    [actividad1Value, actividad2Value, actividad3Value]
  );

  const direccionHotelMap = useMemo(
    () =>
      new Map(
        (direccionesHotel ?? []).map((direccion) => [
          String(direccion.idHotel),
          direccion.direccion,
        ])
      ),
    [direccionesHotel]
  );
  const prevCantPaxRef = useRef(0);

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

  useEffect(() => {
    if (!hotelValue || hotelValue === "-") {
      setValue("otrosPartidas", "", {
        shouldDirty: false,
        shouldTouch: false,
      });
      return;
    }
    const direccion = direccionHotelMap.get(String(hotelValue));
    if (!direccion) {
      setValue("otrosPartidas", "", {
        shouldDirty: false,
        shouldTouch: false,
      });
      return;
    }
    setValue("otrosPartidas", direccion, {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [hotelValue, direccionHotelMap, setValue]);

  useEffect(() => {
    const pax = Number(cantPaxValue) || 0;
    const prevPax = prevCantPaxRef.current;
    setTarifaRows((rows) =>
      rows.map((row) => {
        const current = Number(row.cantidad) || 0;
        let nextCantidad = current;

        if (pax <= 0) {
          nextCantidad = 0;
        } else if (prevPax === 0 && current === 0) {
          nextCantidad = pax;
        } else if (current === prevPax && prevPax > 0) {
          nextCantidad = pax;
        } else if (current > pax) {
          nextCantidad = pax;
        }

        if (nextCantidad === current) return row;
        return { ...row, cantidad: nextCantidad };
      })
    );
    prevCantPaxRef.current = pax;
  }, [cantPaxValue]);

  // Pricing synchronization effects
  useEffect(() => {
    if (!preciosActividades) return;
    const map = new Map(preciosActividades.map((p) => [String(p.idActi), p]));

    const applyPrecio = (actividadId: unknown, rowId: string) => {
      const key = String(actividadId ?? "").trim();
      const precioObj = map.get(key);
      const precio = precioObj ? Number(precioObj.precioSol ?? 0) : 0;
      setTarifaRows((rows) =>
        rows.map((r) => (r.id === rowId ? { ...r, precioUnit: precio } : r))
      );
    };

    applyPrecio(actividad1Value, "actividad1");
    applyPrecio(actividad2Value, "actividad2");
    applyPrecio(actividad3Value, "actividad3");
  }, [actividad1Value, actividad2Value, actividad3Value, preciosActividades]);

  useEffect(() => {
    const map = new Map((preciosAlmuerzo ?? []).map((p) => [String(p.id), p]));
    const key = String(tarifaTourValue ?? "").trim();
    const precioObj = map.get(key);
    const almuerzo = precioObj ? Number(precioObj.precioSol ?? 0) : 0;
    const base = Number(precioVentaValue) || 0;
    const precio = base + almuerzo;

    setTarifaRows((rows) =>
      rows.map((r) =>
        r.id === "tarifaTour" ? { ...r, precioUnit: precio } : r
      )
    );
  }, [tarifaTourValue, preciosAlmuerzo, precioVentaValue]);

  useEffect(() => {
    if (!preciosTraslado) return;
    const map = new Map(preciosTraslado.map((p) => [String(p.id), p]));
    const key = String(trasladosValue ?? "").trim();
    const precioObj = map.get(key);
    const precio = precioObj ? Number(precioObj.precioSol ?? 0) : 0;

    setTarifaRows((rows) =>
      rows.map((r) => (r.id === "traslados" ? { ...r, precioUnit: precio } : r))
    );
  }, [trasladosValue, preciosTraslado]);

  useEffect(() => {
    if (!isIslasSelected) {
      setValue("entradas", "", {
        shouldDirty: false,
        shouldTouch: false,
      });
      setTarifaRows((rows) =>
        rows.map((row) =>
          row.id === "entradas" ? { ...row, precioUnit: 0 } : row
        )
      );
      return;
    }

    setValue("entradas", "IMPTOS DE ISLAS + MUELLE", {
      shouldDirty: false,
      shouldTouch: false,
    });
    setTarifaRows((rows) =>
      rows.map((row) =>
        row.id === "entradas" ? { ...row, precioUnit: 16 } : row
      )
    );
  }, [isIslasSelected, setValue]);

  const tarifaTotal = useMemo(
    () =>
      tarifaRows.reduce(
        (acc, row) => acc + (row.precioUnit ?? 0) * (row.cantidad ?? 0),
        0
      ),
    [tarifaRows]
  );

  const totalPagar = useMemo(
    () => tarifaTotal + Number(cobroExtraSol ?? 0),
    [tarifaTotal, cobroExtraSol]
  );

  const saldo = totalPagar - acuenta;

  const horaByPartida = useMemo(() => {
    const map = new Map<string, string>();
    (horasPartida ?? []).forEach((h) => {
      map.set(String(h.idParti), h.hora);
    });
    return map;
  }, [horasPartida]);

  const handlePartidaChange = (value: string) => {
    setValue("hotel", "-");
    if (value === "HOTEL" || value === "OTROS") {
      setValue("horaPresentacion", "");
      return;
    }
    const hora = horaByPartida.get(String(value)) ?? "";
    setValue("horaPresentacion", hora);
  };

  const isEmptyText = (value: unknown) => !String(value ?? "").trim();
  const hasSelectedOption = (option: unknown) => {
    if (!option) return false;
    if (typeof option === "string") return option.trim() !== "";
    const typed = option as { value?: string; label?: string };
    return Boolean(String(typed.value ?? typed.label ?? "").trim());
  };

  const validateRequired = (values: FormValues) => {
    clearErrors([
      "canalVenta",
      "condicion",
      "nombreCompleto",
      "celular",
      "cantPax",
      "puntoPartida",
      "horaPresentacion",
      "medioPago",
      "tarifaTour",
    ]);

    const missing: string[] = [];
    const markMissing = (field: keyof FormValues, label: string) => {
      missing.push(label);
      setError(field as any, {
        type: "required",
        message: `${label} es obligatorio`,
      });
    };

    if (!hasSelectedOption(values.canalVenta))
      markMissing("canalVenta", "Canal de venta");
    if (!hasSelectedOption(values.condicion))
      markMissing("condicion", "Condición");
    if (isEmptyText(values.nombreCompleto))
      markMissing("nombreCompleto", "Nombre completo");
    if (isEmptyText(values.celular)) markMissing("celular", "Teléfono");
    if ((Number(values.cantPax) || 0) < 1) markMissing("cantPax", "Cantidad");
    if (isEmptyText(values.puntoPartida))
      markMissing("puntoPartida", "Punto de partida");
    if (isEmptyText(values.horaPresentacion))
      markMissing("horaPresentacion", "Hora de partida del tour");
    const tarifaTourValue = String(values.tarifaTour ?? "").trim();
    if (!tarifaTourValue || tarifaTourValue === "-")
      markMissing("tarifaTour", "Incluye almuerzo");
    if (isEmptyText(values.medioPago))
      markMissing("medioPago", "Medio de pago");
    const tarifaTourRow = tarifaRows.find((row) => row.id === "tarifaTour");
    const precioInvalid = (Number(tarifaTourRow?.precioUnit) || 0) <= 0;
    if (precioInvalid) missing.push("Precio");
    setPrecioError(precioInvalid);

    return missing;
  };

  const getCondicionKey = (value: unknown) => {
    const text =
      typeof value === "string"
        ? value
        : typeof value === "object"
        ? String((value as { label?: string; value?: string }).label ?? "")
        : "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const validateBusinessRules = (values: FormValues, total: number) => {
    const errors: string[] = [];

    if (!pkg) {
      errors.push("Selecciona un Full Day válido antes de continuar.");
    }

    if (!hasSelectedOption(values.canalVenta)) {
      errors.push("Asocia un canal de venta para proceder con la reserva.");
    }

    if (!hasSelectedOption(values.condicion)) {
      errors.push("Define la condición comercial del servicio.");
    }

    const medioPago = String(values.medioPago ?? "").trim().toUpperCase();
    if (!medioPago) {
      errors.push("Indica el medio de pago elegido para esta operación.");
    }

    if (medioPago === "DEPOSITO") {
      if (!String(values.entidadBancaria ?? "").trim()) {
        errors.push("Especifica la entidad bancaria cuando seleccionas depósito.");
      }
      if (!String(values.nroOperacion ?? "").trim()) {
        errors.push("Anota el número de operación bancario para respaldar el depósito.");
      }
    }

    if (total <= 0) {
      errors.push("El total a pagar debe ser mayor que cero antes de guardar.");
    }

    const condicionKey = getCondicionKey(values.condicion);
    if (condicionKey.includes("cuenta")) {
      const acuentaAmount = Number(values.acuenta) || 0;
      if (acuentaAmount <= 0) {
        errors.push("Ingresa el monto del adelanto cuando la condición es a cuenta.");
      }
      if (acuentaAmount > total) {
        errors.push("El adelanto no puede superar el total a pagar.");
      }
    }

    return errors;
  };

  const renderValidationList = (items: string[]) => (
    <div>
      <p className="text-xs text-slate-600">Corrige los siguientes puntos:</p>
      <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 space-y-0.5">
        {items.map((field) => (
          <li key={field}>{field}</li>
        ))}
      </ul>
    </div>
  );

  const handleInvalidSubmit = () => {
    const missing = validateRequired(getValues());
    if (missing.length > 0) {
      showToast({
        title: "Campos obligatorios",
      description: renderValidationList(missing),
        type: "warning",
      });
      return;
    }
    showToast({
      title: "Campos obligatorios",
      description: "Revisa los campos resaltados.",
      type: "warning",
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    const missing = validateRequired(values);
    if (missing.length > 0) {
      showToast({
        title: "Campos obligatorios",
      description: renderValidationList(missing),
        type: "warning",
      });
      return;
    }

    const businessMessages = validateBusinessRules(values, Number(totalPagar));
    if (businessMessages.length > 0) {
      showToast({
        title: "Validaciones previas",
        description: renderValidationList(businessMessages),
        type: "warning",
      });
      return;
    }

    const ordenPayload = buildOrdenPayload({
      values,
      user,
      pkg,
      id,
      partidas,
      hoteles,
      almuerzos,
      actividades,
      trasladosOptions,
      tarifaRows,
      tarifaTotal,
    });
    const invoiceData = buildInvoiceData({
      values,
      pkg,
      tarifaRows,
      tarifaTotal,
      totalPagar,
      saldo,
      partidas,
      almuerzos,
      actividades,
      trasladosOptions,
    });
    console.log("PAYLOAD FOR BACKEND:", JSON.stringify(ordenPayload, null, 2));
    const legacyPayload = buildLegacyPayloadString(ordenPayload);
    console.log("LEGACY PAYLOAD:", legacyPayload);
    console.log("LEGACY PARSED:", parseLegacyPayloadString(legacyPayload));
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/programacion/agregar-viaje",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valores: legacyPayload }),
        }
      );
      if (!response) {
        showToast({
          title: "Error",
          description: "La caja está cerrada.",
          type: "error",
        });
        return;
      }
      const responseText = await response.text();
      if (!response.ok) {
        showToast({
          title: "Error",
          description: responseText || "Error al enviar el viaje",
          type: "error",
        });
        return;
      }
      if (String(responseText ?? "").trim().toLowerCase() === "false") {
        showToast({
          title: "Caja cerrada",
          description: "La caja está cerrada y no se puede registrar el viaje.",
          type: "warning",
        });
        return;
      }
      showToast({
        title: "Enviado",
        description: responseText || "Viaje registrado correctamente",
        type: "success",
      });
      navigate(`/fullday/${id}/passengers/preview`, {
        state: {
          invoiceData,
          backendPayload: responseText,
        },
      });
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error?.message ?? "No se pudo enviar el viaje",
        type: "error",
      });
    }
    return;

    /*
    const extractOptionValue = (option?: any) => typeof option === "string" ? option : option?.value ?? "";
    
    addPassenger(Number(id), {
      ...values,
      canalVenta: extractOptionValue(values.canalVenta),
      condicion: extractOptionValue(values.condicion),
      precioVenta: Number(values.precioVenta ?? 0),
      impuesto: Number(values.impuesto ?? 0),
      cargosExtras: Number(values.cargosExtras ?? 0),
      acuenta: Number(values.acuenta ?? 0),
      cobroExtraSol: Number(values.cobroExtraSol ?? 0),
      cobroExtraDol: Number(values.cobroExtraDol ?? 0),
      deposito: Number(values.deposito ?? 0),
      cantPax: Number(values.cantPax ?? 1),
      total: totalPagar,
      subTotal: tarifaTotal,
      actividades: [
        values.actividad1 ?? "-",
        values.actividad2 ?? "-",
        values.actividad3 ?? "-",
      ],
    });
    navigate("/fullday");
    */
  }, handleInvalidSubmit);

  const handleNew = () => {
    reset();
    setPrecioError(false);
    if (pkg?.destino) {
      setValue("destino", pkg.destino);
    }
    setValue("fechaViaje", date);
    setValue("fechaPago", new Date().toISOString().slice(0, 10));
    setValue("fechaEmision", new Date().toISOString().slice(0, 10));
    setTimeout(() => {
      setFocus("canalVenta");
    }, 0);
  };

  const handlePrint = async () => {
    try {
      const values = getValues();
      const invoiceData = buildInvoiceData({
        values,
        pkg,
        tarifaRows,
        tarifaTotal,
        totalPagar,
        saldo,
        partidas,
        almuerzos,
        actividades,
        trasladosOptions,
      });
      const blob = await pdf(<PdfDocument data={invoiceData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const popup = window.open(url, "_blank");
      if (!popup) {
        URL.revokeObjectURL(url);
        showToast({
          title: "Atención",
          description: "Permite las ventanas emergentes para ver la factura.",
          type: "warning",
        });
        return;
      }
      popup.focus();
      const revoke = () => URL.revokeObjectURL(url);
      popup.addEventListener("beforeunload", revoke);
      setTimeout(revoke, 60000);
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error?.message ?? "No se pudo generar la factura.",
        type: "error",
      });
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
    if (target.tagName === "BUTTON") return;
    const nextSelector =
      target.getAttribute("data-focus-next") ??
      target
        .closest<HTMLElement>("[data-focus-next]")
        ?.getAttribute("data-focus-next");
    if (nextSelector) {
      e.preventDefault();
      setTimeout(() => {
        const next = document.querySelector<HTMLElement>(nextSelector);
        next?.focus();
      }, 0);
      return;
    }
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

  if (!pkg) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <p className="text-sm text-rose-600">Full Day no encontrado.</p>
        <button
          className="mt-3 text-sm text-blue-600 underline"
          onClick={() => navigate("/fullday")}
        >
          Volver a Full Day
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto">
      {/* CARD GENERAL */}
      <div
        className="
          rounded-2xl 
          border border-slate-200 
          bg-white 
          shadow-sm
          overflow-hidden
    "
      >
        <form
          onSubmit={onSubmit}
          onKeyDown={handleEnterFocus}
          onChangeCapture={handleSelectAdvanceCapture}
          noValidate
        >
          <fieldset disabled={isSubmitting} className="contents">
            <input type="hidden" {...register("precioVenta")} />
            <input type="hidden" {...register("mensajePasajero")} />

            <div
              className="flex items-center justify-between gap-3
  rounded-xl border border-emerald-200 bg-emerald-50/70
  px-4 py-2 shadow-sm"
            >
              {/* ================= INFO ================= */}
              <div className="flex items-center gap-4 min-w-0">
                {/* DESTINO */}
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-slate-500 text-xs">Destino:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[460px]">
                    {watch("destino")}
                  </span>
                </div>

                {/* FECHA VIAJE */}
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-slate-500 text-xs">Viaje:</span>
                  <span className="text-sm font-medium text-slate-700">
                    {watch("fechaViaje")}
                  </span>
                </div>

                {/* FECHA EMISIÓN */}
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span className="text-slate-500 text-xs">Emisión:</span>
                  <span className="text-sm font-medium text-slate-700">
                    {watch("fechaEmision")}
                  </span>
                </div>

                {/* DISPONIBLES */}
                <div
                  className="flex items-center gap-1 rounded-md bg-white px-2 py-1
                   border border-emerald-200 whitespace-nowrap"
                >
                  <span className="text-xs text-slate-500">Disp:</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {pkg.disponibles}
                  </span>
                </div>
              </div>

              {/* ================= ACCIONES ================= */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  title="Guardar"
                  className="inline-flex items-center gap-1 rounded-lg
                  bg-emerald-600 px-3 py-2 text-white
                  shadow-sm ring-1 ring-emerald-600/30
                  hover:bg-emerald-700 transition"
                >
                  <Save size={16} />
                  <span className="text-sm hidden sm:inline">Guardar</span>
                </button>

                <button
                  type="button"
                  onClick={handleNew}
                  title="Nuevo"
                  className="inline-flex items-center gap-1 rounded-lg
        bg-slate-100 px-3 py-2 text-slate-700
        ring-1 ring-slate-200 hover:bg-slate-200 transition"
                >
                  <Plus size={16} />
                  <span className="text-sm hidden sm:inline">Nuevo</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  title="Imprimir"
                  className="inline-flex items-center gap-1 rounded-lg
        bg-white px-3 py-2 text-slate-700
        ring-1 ring-slate-200 hover:bg-slate-50 transition"
                >
                  <Printer size={16} />
                  <span className="text-sm hidden sm:inline">Imprimir</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-4 space-y-3">
                  <PackageHeader
                    pkg={pkg}
                    control={control}
                    monedaOptions={monedaOptions}
                    canalVentaList={canalVentaList}
                    estadoPagoOptions={estadoPagoOptions}
                    handleAddCanalVenta={handleAddCanalVenta}
                  />

                  <PassengerDetails
                    control={control}
                    setValue={setValue}
                    disponibles={pkg?.disponibles}
                  />

                  <ServicesTable
                    partidas={partidas}
                    hoteles={hoteles}
                    almuerzos={almuerzos}
                    trasladosOptions={trasladosOptions}
                    actividades={actividades}
                    tarifaRows={tarifaRows}
                    cantPaxValue={Number(cantPaxValue) || 0}
                    control={control}
                    register={register}
                    errors={errors}
                    precioError={precioError}
                    updateRow={updateRow}
                    handleAdvanceAfterChange={handleAdvanceAfterChange}
                    onPartidaChange={handlePartidaChange}
                    activitySelections={{
                      actividad1: actividad1Value,
                      actividad2: actividad2Value,
                      actividad3: actividad3Value,
                    }}
                    enableHotelHora={
                      partidaValue === "HOTEL" || partidaValue === "OTROS"
                    }
                  />
                </div>

                <PaymentSummary
                  control={control}
                  register={register}
                  setValue={setValue}
                  documentoOptions={documentoOptions}
                  totalPagar={totalPagar}
                  saldo={saldo}
                  medioPagoOptions={medioPagoOptions}
                  bancoOptions={bancoOptions}
                  isSubmitting={isSubmitting}
                  watch={watch}
                  documentoCobranzaOptions={[
                    {
                      label: "Documento de Cobranza",
                      value: "DOCUMENTO DE COBRANZA",
                    },
                    { label: "Boleta", value: "BOLETA" },
                    { label: "Factura", value: "FACTURA" },
                  ]}
                />
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default PackagePassengerCreate;
