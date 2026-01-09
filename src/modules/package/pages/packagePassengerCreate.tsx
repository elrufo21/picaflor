import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { showToast } from "../../../components/ui/AppToast";
import { usePackageStore } from "../store/packageStore";
import { useDialogStore } from "../../../app/store/dialogStore";
import { useAuthStore } from "@/store/auth/auth.store";
import { useCanalVenta } from "../hooks/useCanalVenta";
import { usePackageData } from "../hooks/usePackageData";
import { PackageHeader } from "../components/create-passenger/PackageHeader";
import { PassengerDetails } from "../components/create-passenger/PassengerDetails";
import { ServicesTable } from "../components/create-passenger/ServicesTable";
import { PaymentSummary } from "../components/create-passenger/PaymentSummary";
import { buildOrdenPayload } from "../utils/payloadBuilder";
import type { CanalOption, SelectOption } from "../hooks/canalUtils";

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
  destino?: string;
};

const documentoOptions = [
  { value: "DNI", label: "DNI" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "CE", label: "C.E." },
];

const estadoPagoOptions = [
  { value: "Cancelado", label: "Cancelado" },
  { value: "Crédito", label: "Crédito" },
  { value: "A Cuenta", label: "A Cuenta" },
  { value: "Canje", label: "Canje" },
  { value: "Plataforma", label: "Plataforma" },
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
      fechaViaje: date,
      fechaPago: new Date().toISOString().slice(0, 10),
      fechaEmision: new Date().toISOString().slice(0, 10),
      moneda: "PEN",
      origen: "LIMA",
      canalVenta: null,
      counter: user?.username,
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
    actividades,
    almuerzos,
    trasladosOptions,
    preciosActividades,
    preciosAlmuerzo,
    preciosTraslado,
  } = usePackageData(id, setValue);

  useEffect(() => {
    if (pkg?.destino) {
      setValue("destino", pkg.destino);
    }
  }, [pkg, setValue]);

  const canalVentaSelected = watch("canalVenta");

  useEffect(() => {
    if (!canalVentaSelected) return;
    if (canalVentaSelected.telefono)
      setValue("telefono", canalVentaSelected.telefono);
    if (canalVentaSelected.email) setValue("email", canalVentaSelected.email);
  }, [canalVentaSelected, setValue]);

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

  const cobroExtraSol = watch("cobroExtraSol");
  const tarifaTourValue = watch("tarifaTour");
  const trasladosValue = watch("traslados");
  const actividad1Value = watch("actividad1");
  const actividad2Value = watch("actividad2");
  const actividad3Value = watch("actividad3");
  const acuenta = watch("acuenta") || 0;

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
    if (!preciosAlmuerzo) return;
    const map = new Map(preciosAlmuerzo.map((p) => [String(p.id), p]));
    const key = String(tarifaTourValue ?? "").trim();
    const precioObj = map.get(key);
    const precio = precioObj ? Number(precioObj.precioSol ?? 0) : 0;

    setTarifaRows((rows) =>
      rows.map((r) =>
        r.id === "tarifaTour" ? { ...r, precioUnit: precio } : r
      )
    );
  }, [tarifaTourValue, preciosAlmuerzo]);

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

  const onSubmit = handleSubmit(async (values) => {
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

    console.log("PAYLOAD FOR BACKEND:", JSON.stringify(ordenPayload, null, 2));

    /*
    const extractOptionValue = (option?: any) => typeof option === "string" ? option : option?.value ?? "";
    
    addPassenger(Number(id), {
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
      total: totalPagar,
      subTotal: tarifaTotal,
      actividades: [
        values.actividad1 ?? "-",
        values.actividad2 ?? "-",
        values.actividad3 ?? "-",
      ],
    });
    navigate("/package");
    */
  });

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
            <PackageHeader
              pkg={pkg}
              control={control}
              monedaOptions={monedaOptions}
              canalVentaList={canalVentaList}
              estadoPagoOptions={estadoPagoOptions}
              handleAddCanalVenta={handleAddCanalVenta}
            />
            <PassengerDetails control={control} />
            <ServicesTable
              partidas={partidas}
              hoteles={hoteles}
              almuerzos={almuerzos}
              trasladosOptions={trasladosOptions}
              actividades={actividades}
              tarifaRows={tarifaRows}
              register={register}
              updateRow={updateRow}
              handleAdvanceAfterChange={handleAdvanceAfterChange}
            />
          </div>
          <PaymentSummary
            control={control}
            register={register}
            documentoOptions={documentoOptions}
            totalPagar={totalPagar}
            saldo={saldo}
            medioPagoOptions={medioPagoOptions}
            bancoOptions={bancoOptions}
            isSubmitting={isSubmitting}
            documentoCobranzaOptions={[
              { label: "Boleta", value: "BOLETA" },
              { label: "Factura", value: "FACTURA" },
            ]}
          />
        </div>
      </form>
    </div>
  );
};

export default PackagePassengerCreate;
