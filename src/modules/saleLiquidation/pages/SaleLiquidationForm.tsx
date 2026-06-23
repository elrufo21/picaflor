import { useCallback, useMemo, useRef, type ReactNode, type Ref } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";

import { useDialogStore, type DialogPayload } from "@/app/store/dialogStore";
import DndTable from "@/components/dataTabla/DndTable";
import { showToast } from "@/components/ui/AppToast";
import { formatCurrency } from "@/shared/helpers/formatCurrency";
import { queryClient } from "@/shared/queryClient";
import {
  formatDate,
  formatDateForInput,
  getTodayDateInputValue,
} from "@/shared/helpers/formatDate";
import { useAuthStore } from "@/store/auth/auth.store";
import {
  deleteLiquidationPayment,
  fetchLiquidationPaymentDetail,
  saveLiquidationPayment,
  type SaleLiquidationDetail,
  type SaleLiquidationPayment,
} from "../api";

const LIQUIDACIONES_STALE_STORAGE_KEY =
  "fullday:programacion-liquidaciones:stale:v1";

const markLiquidacionesAsStale = () => {
  try {
    window.sessionStorage.setItem(LIQUIDACIONES_STALE_STORAGE_KEY, "1");
  } catch {
    // no bloquear el pago si el navegador no deja escribir sessionStorage
  }
};

type PaymentFormPayload = DialogPayload & {
  liquidaId?: number;
  recibido?: string;
  formaPago?: string;
  moneda?: string;
  tipoCambio?: string;
  importe?: string;
  entidadBancaria?: string;
  nroOperacion?: string;
};
type SaleLiquidationLocationState = {
  fromSaleList?: boolean;
  returnTo?: string;
  returnState?: unknown;
};

type PaymentTableRow = SaleLiquidationPayment & { id: number };
type SelectOption = string | { value: string; label: string };

const money = (value?: number) => formatCurrency(value ?? 0) || "0.00";
const twoDigits = (value: number) => String(value).padStart(2, "0");
const formatDateTime = (value?: string | number | Date | null) => {
  const date = formatDate(value);
  if (!date) return "";

  if (value instanceof Date) {
    return `${date} ${twoDigits(value.getHours())}:${twoDigits(value.getMinutes())}`;
  }

  const raw = String(value ?? "").trim();
  const timeMatch = raw.match(/(?:T|\s)(\d{2}:\d{2})/);
  return timeMatch ? `${date} ${timeMatch[1]}` : date;
};
const medioPagoOptions: SelectOption[] = [
  { value: "", label: "(SELECCIONE)" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "DEPOSITO", label: "Deposito" },
  { value: "YAPE", label: "Yape" },
];
const bancoOptions: SelectOption[] = [
  { value: "", label: "(SELECCIONE)" },
  { value: "-", label: "-" },
  { value: "BCP", label: "BCP" },
  { value: "BBVA", label: "BBVA" },
  { value: "INTERBANK", label: "Interbank" },
];

const emptyPaymentPayload = (moneda?: string): PaymentFormPayload => ({
  liquidaId: 0,
  recibido: getTodayDateInputValue(),
  formaPago: "",
  moneda: normalizeCurrency(moneda),
  tipoCambio: "1",
  importe: "",
  entidadBancaria: "",
  nroOperacion: "",
});

const textValue = (value: unknown) => String(value ?? "");
const THREE_DECIMAL_NUMBER = /^\d*(?:\.\d{0,3})?$/;
const normalizePaymentMethod = (value: unknown) =>
  textValue(value).trim().toUpperCase();
const normalizeOperation = (value: unknown) =>
  textValue(value).replace(/\s/g, "").toUpperCase();
const requiresBankData = (value: unknown) =>
  normalizePaymentMethod(value) === "DEPOSITO";
const paymentBankValue = (formaPago: unknown, entidadBancaria: unknown) => {
  const method = normalizePaymentMethod(formaPago);
  if (method === "DEPOSITO") return textValue(entidadBancaria).trim();
  if (method === "EFECTIVO") return "-";
  return "";
};
const toAmount = (value: unknown) => {
  const amount = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
};
const isDollarCurrency = (moneda: unknown) => {
  const value = textValue(moneda).trim().toUpperCase();
  return value === "DOLARES" || value === "DOLARS" || value === "USD";
};
const normalizeCurrency = (moneda: unknown) =>
  isDollarCurrency(moneda) ? "DOLARES" : "SOLES";
const needsExchangeRate = (paymentCurrency: unknown, originCurrency: unknown) =>
  normalizeCurrency(paymentCurrency) !== normalizeCurrency(originCurrency);
const currencySymbol = (moneda: unknown) =>
  isDollarCurrency(moneda) ? "$" : "S/";
const appliedAmount = (payload: PaymentFormPayload, originCurrency: unknown) => {
  const importe = toAmount(payload.importe);
  const tipoCambio = toAmount(payload.tipoCambio) || 1;
  if (!needsExchangeRate(payload.moneda, originCurrency)) return importe;
  return isDollarCurrency(originCurrency)
    ? importe / tipoCambio
    : importe * tipoCambio;
};
const paymentToPayload = (
  payment: SaleLiquidationPayment,
): PaymentFormPayload => ({
  liquidaId: payment.liquidaId,
  recibido: formatDateForInput(payment.recibido),
  formaPago: textValue(payment.formaPago) || "EFECTIVO",
  moneda: normalizeCurrency(payment.moneda),
  tipoCambio: textValue(payment.tipoCambio || 1),
  importe: textValue(payment.importe),
  entidadBancaria: paymentBankValue(payment.formaPago, payment.entidadBancaria),
  nroOperacion: requiresBankData(payment.formaPago)
    ? normalizeOperation(payment.nroOperacion)
    : "",
});
const paymentSignature = (payload: PaymentFormPayload) =>
  JSON.stringify([
    textValue(payload.recibido).trim(),
    normalizePaymentMethod(payload.formaPago),
    normalizeCurrency(payload.moneda),
    toAmount(payload.tipoCambio) || 1,
    toAmount(payload.importe),
    paymentBankValue(payload.formaPago, payload.entidadBancaria),
    requiresBankData(payload.formaPago)
      ? normalizeOperation(payload.nroOperacion)
      : "",
  ]);

const SaleLiquidationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as SaleLiquidationLocationState | null;
  const { id } = useParams();
  const authUser = useAuthStore((state) => state.user);
  const openDialog = useDialogStore((state) => state.openDialog);
  const {
    data: detail,
    isLoading: loading,
    isError,
  } = useQuery<SaleLiquidationDetail>({
    queryKey: ["sale-liquidations", "detail", id],
    queryFn: () => fetchLiquidationPaymentDetail(id!),
    enabled: Boolean(id),
    staleTime: Infinity,
  });

  const paymentRows = useMemo<PaymentTableRow[]>(
    () =>
      (detail?.pagos ?? []).map((payment) => ({
        ...payment,
        id: payment.liquidaId,
      })),
    [detail?.pagos],
  );

  const totals = useMemo(
    () =>
      paymentRows.reduce(
        (acc, pago) => {
          const formaPago = String(pago.formaPago ?? "").toUpperCase();
          const moneda = String(pago.moneda ?? "").toUpperCase();
          const bucket = formaPago === "EFECTIVO" ? "efectivo" : "otros";
          const currency =
            moneda.includes("DOLAR") || moneda === "USD" ? "Usd" : "Pen";
          const key = `${bucket}${currency}` as keyof typeof acc;
          acc[key] += Number(pago.importe) || 0;
          return acc;
        },
        { efectivoPen: 0, efectivoUsd: 0, otrosPen: 0, otrosUsd: 0 },
      ),
    [paymentRows],
  );
  const patchedReturnState = useMemo(() => {
    const state = locationState?.returnState;
    if (!detail || !state || typeof state !== "object") return state;

    const formData = (state as { formData?: Record<string, unknown> }).formData;
    if (!formData || typeof formData !== "object") return state;

    const efectivo = paymentRows
      .filter((payment) => normalizePaymentMethod(payment.formaPago) === "EFECTIVO")
      .reduce((sum, payment) => sum + Number(payment.acuenta || 0), 0);
    const deposito = paymentRows
      .filter((payment) => normalizePaymentMethod(payment.formaPago) !== "EFECTIVO")
      .reduce((sum, payment) => sum + Number(payment.acuenta || 0), 0);

    return {
      ...state,
      formData: {
        ...formData,
        acuenta: detail.acuenta,
        saldo: detail.saldo,
        efectivo,
        deposito,
        estado: detail.estado,
      },
    };
  }, [detail, locationState?.returnState, paymentRows]);
  const firstAccountPaymentId =
    textValue(detail?.condicion).replace(/\s+/g, "").toUpperCase() === "ACUENTA"
      ? paymentRows[0]?.liquidaId
      : undefined;
  const isPaymentReadOnly =
    textValue(detail?.estado).trim().toUpperCase() === "PAGADO";

  const openPaymentDialog = useCallback(
    (payment?: SaleLiquidationPayment) => {
      if (isPaymentReadOnly) return;
      if (!id) return;
      const isEdit = Boolean(payment?.liquidaId);
      const lockAmount =
        firstAccountPaymentId !== undefined &&
        payment?.liquidaId === firstAccountPaymentId;
      const maxAmount = (detail?.saldo ?? 0) + (payment?.acuenta ?? 0);

      openDialog({
        title: isEdit ? "Editar pago" : "Agregar pago",
        description: `Registro ${detail?.documento ?? id}`,
        size: "lg",
        confirmLabel: isEdit ? "Guardar cambios" : "Guardar pago",
        initialPayload: payment
          ? paymentToPayload(payment)
          : emptyPaymentPayload(detail?.moneda),
        onConfirm: async (payload) => {
          const form = payload as PaymentFormPayload;
          const importe = toAmount(form.importe);
          const tipoCambio = toAmount(form.tipoCambio);
          const formaPago = normalizePaymentMethod(form.formaPago);
          const entidadBancaria = textValue(form.entidadBancaria).trim();
          const nroOperacion = normalizeOperation(form.nroOperacion);

          const recibido = textValue(form.recibido) || getTodayDateInputValue();

          if (
            payment &&
            paymentSignature(form) ===
              paymentSignature(paymentToPayload(payment))
          ) {
            return true;
          }

          if (!Number.isFinite(importe) || importe <= 0) {
            showToast({
              title: "Datos incompletos",
              description: "Ingresa un importe valido.",
              type: "warning",
            });
            return false;
          }
          if (!formaPago) {
            showToast({
              title: "Medio de pago requerido",
              description: "Selecciona el medio de pago.",
              type: "warning",
            });
            return false;
          }
          if (requiresBankData(formaPago)) {
            if (!entidadBancaria || entidadBancaria === "-") {
              showToast({
                title: "Entidad bancaria requerida",
                description: "Selecciona la entidad bancaria para el deposito.",
                type: "warning",
              });
              return false;
            }
            if (!nroOperacion) {
              showToast({
                title: "Operacion requerida",
                description: "Ingresa el numero de operacion del deposito.",
                type: "warning",
              });
              return false;
            }
            if (
              paymentRows.some(
                (row) =>
                  row.liquidaId !== Number(form.liquidaId ?? 0) &&
                  textValue(row.entidadBancaria).trim().toUpperCase() ===
                    entidadBancaria.toUpperCase() &&
                  normalizeOperation(row.nroOperacion) === nroOperacion,
              )
            ) {
              showToast({
                title: "Operacion duplicada",
                description: `La operacion ${nroOperacion} ya existe para ${entidadBancaria}.`,
                type: "warning",
              });
              return false;
            }
          }
          if (
            needsExchangeRate(form.moneda, detail?.moneda) &&
            (!THREE_DECIMAL_NUMBER.test(textValue(form.tipoCambio)) ||
              tipoCambio <= 0)
          ) {
            showToast({
              title: "Tipo de cambio requerido",
              description:
                "Ingresa un tipo de cambio mayor a cero y con hasta 3 decimales.",
              type: "warning",
            });
            return false;
          }
          if (appliedAmount(form, detail?.moneda) > maxAmount) {
            showToast({
              title: "Importe excedido",
              description: "El importe no debe superar el monto a pagar.",
              type: "warning",
            });
            return false;
          }

          try {
            await saveLiquidationPayment({
              liquidaId: Number(form.liquidaId ?? 0),
              notaId: Number(id),
              recibido,
              formaPago,
              moneda: textValue(form.moneda),
              tipoCambio: tipoCambio || 1,
              importe,
              acuenta: appliedAmount(form, detail?.moneda),
              entidadBancaria: paymentBankValue(formaPago, entidadBancaria),
              nroOperacion: requiresBankData(formaPago) ? nroOperacion : "",
              imagen: "",
              usuario: authUser?.displayName || authUser?.username || "admin",
            });
          } catch (error) {
            showToast({
              title: "No se pudo guardar el pago",
              description:
                error instanceof Error ? error.message : "Intenta nuevamente.",
              type: "error",
            });
            return false;
          }
          showToast({
            title: isEdit ? "Pago actualizado" : "Pago registrado",
            description: "La liquidacion fue actualizada.",
            type: "success",
          });
          await queryClient.invalidateQueries({
            queryKey: ["sale-liquidations"],
          });
          markLiquidacionesAsStale();
          return true;
        },
        content: ({ payload, setPayload }) => (
          <PaymentDialogForm
            payload={payload as PaymentFormPayload}
            setPayload={(next) => setPayload(next)}
            saldo={detail?.saldo ?? 0}
            maxAmount={maxAmount}
            lockAmount={lockAmount}
            originCurrency={detail?.moneda}
          />
        ),
      });
    },
    [
      authUser?.displayName,
      authUser?.username,
      detail?.documento,
      detail?.moneda,
      detail?.saldo,
      firstAccountPaymentId,
      id,
      isPaymentReadOnly,
      openDialog,
      paymentRows,
    ],
  );

  const confirmDeletePayment = useCallback(
    (payment: SaleLiquidationPayment) => {
      if (isPaymentReadOnly) return;
      if (!id) return;

      openDialog({
        title: "Eliminar pago",
        description: `Pago #${payment.liquidaId}`,
        size: "sm",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        onConfirm: async () => {
          await deleteLiquidationPayment(payment.liquidaId, Number(id));
          showToast({
            title: "Pago eliminado",
            description: "La liquidacion fue actualizada.",
            type: "success",
          });
          await queryClient.invalidateQueries({
            queryKey: ["sale-liquidations"],
          });
          markLiquidacionesAsStale();
          return true;
        },
        content: () => (
          <p className="text-sm text-slate-700">
            Esta accion elimina el pago y recalcula el saldo del registro.
          </p>
        ),
      });
    },
    [id, isPaymentReadOnly, openDialog],
  );

  const columns = useMemo(() => {
    const helper = createColumnHelper<PaymentTableRow>();

    return [
      helper.accessor("recibido", {
        header: "Recibido",
        cell: (info) => formatDate(info.getValue()),
      }),
      helper.accessor("formaPago", { header: "Forma pago" }),
      helper.accessor("moneda", { header: "Moneda" }),
      helper.accessor("tipoCambio", {
        header: "T.C.",
        cell: (info) => info.getValue(),
        meta: { align: "right" },
      }),
      helper.accessor("importe", {
        header: "Importe",
        cell: (info) => money(info.getValue()),
        meta: { align: "right" },
      }),
      helper.accessor("entidadBancaria", { header: "Banco" }),
      helper.accessor("nroOperacion", { header: "Operacion" }),
      helper.accessor("acuenta", {
        header: "A cuenta",
        cell: (info) => money(info.getValue()),
        meta: { align: "right" },
      }),
      helper.display({
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            {!isPaymentReadOnly &&
              row.original.liquidaId !== firstAccountPaymentId && (
              <button
                type="button"
                onClick={() => openPaymentDialog(row.original)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                title="Editar pago"
                aria-label="Editar pago"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {!isPaymentReadOnly &&
              row.original.liquidaId !== firstAccountPaymentId && (
              <button
                type="button"
                onClick={() => confirmDeletePayment(row.original)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 hover:text-red-800"
                title="Eliminar pago"
                aria-label="Eliminar pago"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
        meta: { align: "center" },
      }),
    ];
  }, [
    confirmDeletePayment,
    firstAccountPaymentId,
    isPaymentReadOnly,
    openPaymentDialog,
  ]);

  if (!id) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Selecciona una liquidacion pendiente para ver el detalle.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Cargando liquidacion...
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700">
        No se pudo cargar la liquidacion.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm text-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() =>
            locationState?.returnTo
              ? navigate(locationState.returnTo, {
                  state: patchedReturnState,
                })
              : navigate("/sale-liquidations", {
                  state: { useCache: Boolean(locationState?.fromSaleList) },
                })
          }
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-base font-semibold text-slate-950">
              {detail.notaId}- {detail.documento}
            </div>
            <div className="text-sm text-slate-500">
              {detail.cliente} · {detail.servicio}
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3">
            <Field
              label="Fecha registro"
              value={formatDateTime(detail.fechaRegistro)}
            />
            <Field label="Fecha viaje" value={formatDate(detail.fechaViaje)} />
            <Field label="Telefono" value={detail.telefono} />
            <Field label="Counter" value={detail.counter} />
            <Field label="Canal de venta" value={detail.auxiliar} />
            <Field label="Condicion" value={detail.condicion} />
            <Field label="Forma pago" value={detail.formaPago} />
            <Field label="Moneda" value={detail.moneda} />
            <Field
              label="Credito"
              value={
                textValue(detail.condicion).trim().toUpperCase() === "CREDITO"
                  ? "SI"
                  : "NO"
              }
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Precio De Liquidacion
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
            <AmountRow
              label="TOTAL A PAGAR"
              value={money(detail.total)}
              strong
            />
            <AmountRow label="ACUENTA" value={money(detail.acuenta)} strong />
            <AmountRow
              label="SALDO"
              value={money(detail.saldo)}
              strong
              danger
            />
            <AmountRow label="ESTADO" value={detail.estado || "-"} />
          </div>
        </div>
      </section>

      <DndTable
        data={paymentRows}
        columns={columns}
        enableSearching={false}
        emptyMessage="Sin pagos registrados"
        dateFilterComponent={() =>
          isPaymentReadOnly ? null : (
            <button
              type="button"
              onClick={() => openPaymentDialog()}
              className="ml-auto inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#E8612A] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#d55320]"
              title="Agregar pago"
              aria-label="Agregar pago"
            >
              <Plus className="h-5 w-5" />
              AGREGAR PAGO
            </button>
          )
        }
      />

      <section className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-right font-semibold md:grid-cols-4">
        <Summary label="Efectivo $/" value={money(totals.efectivoUsd)} />
        <Summary label="Efectivo S/" value={money(totals.efectivoPen)} />
        <Summary label="Deposito $/" value={money(totals.otrosUsd)} />
        <Summary label="Deposito S/" value={money(totals.otrosPen)} />
      </section>
    </div>
  );
};

const PaymentDialogForm = ({
  payload,
  setPayload,
  saldo,
  maxAmount,
  lockAmount,
  originCurrency,
}: {
  payload: PaymentFormPayload;
  setPayload: (payload: PaymentFormPayload) => void;
  saldo: number;
  maxAmount: number;
  lockAmount: boolean;
  originCurrency?: string;
}) => {
  const importeRef = useRef<HTMLInputElement>(null);
  const formaPago = textValue(payload.formaPago).toUpperCase();
  const isDeposito = requiresBankData(formaPago);
  const exchangeRateNeeded = needsExchangeRate(payload.moneda, originCurrency);
  const importe = toAmount(payload.importe);
  const tipoCambio = toAmount(payload.tipoCambio) || 1;
  const totalAplicado = appliedAmount(payload, originCurrency);
  const saldoFinal = Math.max((Number(saldo) || 0) - totalAplicado, 0);
  const update = (key: keyof PaymentFormPayload, value: string) =>
    setPayload({ ...payload, [key]: value });
  const updateMoneda = (value: string) =>
    setPayload({
      ...payload,
      moneda: value,
      tipoCambio: needsExchangeRate(value, originCurrency) ? "" : "1",
    });
  const updateFormaPago = (value: string) => {
    setPayload({
      ...payload,
      formaPago: value,
      entidadBancaria: requiresBankData(value)
        ? textValue(payload.entidadBancaria) === "-"
          ? ""
          : payload.entidadBancaria
        : value === "EFECTIVO"
          ? "-"
          : "",
      nroOperacion: requiresBankData(value) ? payload.nroOperacion : "",
    });
    if (value === "EFECTIVO") importeRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <AmountRow label="SALDO ACTUAL" value={money(saldo)} strong danger />
        <AmountRow
          label={`IMPORTE ${currencySymbol(payload.moneda)}`}
          value={money(importe)}
        />
        <AmountRow
          label={`TOTAL APLICADO ${currencySymbol(originCurrency)}`}
          value={money(totalAplicado)}
          strong
        />
        <AmountRow
          label="SALDO DESPUES DEL PAGO"
          value={money(saldoFinal)}
          strong
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <p className="text-sm font-semibold text-slate-900">Medio Pago</p>
          <span className="text-[11px] uppercase tracking-wide text-slate-500">
            Cobranza
          </span>
        </div>
        <div className="p-3">
          <div className="grid divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
            <DialogField label="Fecha de adelanto">
              <Input
                type="date"
                value={textValue(payload.recibido) || getTodayDateInputValue()}
                onChange={(value) => update("recibido", value)}
              />
            </DialogField>
            <DialogField label="Medio de pago">
              <Select
                value={textValue(payload.formaPago)}
                onChange={updateFormaPago}
                options={medioPagoOptions}
              />
            </DialogField>
            <DialogField label="Moneda">
              <Select
                value={textValue(payload.moneda)}
                onChange={updateMoneda}
                options={["SOLES", "DOLARES"]}
              />
            </DialogField>
            <DialogField label="Tipo cambio">
              <Input
                type="number"
                value={textValue(payload.tipoCambio)}
                onChange={(value) =>
                  THREE_DECIMAL_NUMBER.test(value) &&
                  update("tipoCambio", value)
                }
                step="0.001"
                alignRight
                disabled={!exchangeRateNeeded}
              />
            </DialogField>
            <DialogField label="Importe">
              <Input
                inputRef={importeRef}
                type="number"
                value={textValue(payload.importe)}
                onChange={(value) => update("importe", value)}
                step="0.01"
                max={
                  exchangeRateNeeded
                    ? isDollarCurrency(originCurrency)
                      ? maxAmount * tipoCambio
                      : maxAmount / tipoCambio
                    : maxAmount
                }
                alignRight
                disabled={lockAmount}
              />
            </DialogField>
            <DialogField label={`Total aplicado ${currencySymbol(originCurrency)}`}>
              <input
                value={money(totalAplicado)}
                disabled
                className="h-9 w-full rounded border border-slate-300 bg-slate-100 px-2 text-right text-sm font-semibold text-slate-700"
              />
            </DialogField>
            <DialogField label="Entidad bancaria">
              <Select
                value={textValue(payload.entidadBancaria)}
                onChange={(value) => update("entidadBancaria", value)}
                options={
                  isDeposito
                    ? bancoOptions.filter(
                        (option) => optionValue(option) !== "-",
                      )
                    : bancoOptions
                }
                disabled={!isDeposito}
              />
            </DialogField>
            <DialogField label="Nro Operacion">
              <Input
                value={textValue(payload.nroOperacion)}
                onChange={(value) =>
                  update("nroOperacion", normalizeOperation(value))
                }
                disabled={!isDeposito}
              />
            </DialogField>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <div className="text-xs font-semibold uppercase text-slate-500">
      {label}
    </div>
    <div className="mt-1 text-sm font-medium text-slate-900">
      {value || "-"}
    </div>
  </div>
);

const Summary = ({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) => (
  <div className="bg-white px-4 py-3">
    <div className="text-xs font-semibold uppercase text-slate-500">
      {label}
    </div>
    <div
      className={`mt-1 text-lg font-bold ${
        tone === "danger" ? "text-red-700" : "text-slate-950"
      }`}
    >
      {value}
    </div>
  </div>
);

const AmountRow = ({
  label,
  value,
  strong = false,
  danger = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) => (
  <div className="grid grid-cols-[1fr_132px] border-b border-slate-300 last:border-b-0">
    <div
      className={`px-3 py-2 text-sm font-semibold ${
        strong ? "bg-amber-300 text-amber-900" : "bg-amber-50 text-amber-900"
      }`}
    >
      {label} :
    </div>
    <div
      className={`px-3 py-2 text-right ${strong ? "font-bold" : "font-semibold"} ${
        danger ? "text-red-700" : "text-slate-950"
      }`}
    >
      {value}
    </div>
  </div>
);

const DialogField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="grid grid-cols-1 items-center sm:grid-cols-[170px_1fr]">
    <div className="flex h-full items-center bg-blue-600/90 px-3 py-2 text-xs font-semibold text-white">
      {label}
    </div>
    <div className="bg-white px-2 py-1">{children}</div>
  </div>
);

const Input = ({
  value,
  onChange,
  type = "text",
  placeholder,
  step,
  max,
  inputRef,
  alignRight = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  step?: string;
  max?: number;
  inputRef?: Ref<HTMLInputElement>;
  alignRight?: boolean;
  disabled?: boolean;
}) => (
  <input
    ref={inputRef}
    type={type}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    step={step}
    max={max}
    disabled={disabled}
    className={`h-9 w-full rounded border border-slate-300 px-2 text-sm text-slate-900 outline-none focus:border-[#E8612A] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-400 ${
      alignRight ? "text-right" : ""
    }`}
  />
);

const optionValue = (option: SelectOption) =>
  typeof option === "string" ? option : option.value;
const optionLabel = (option: SelectOption) =>
  typeof option === "string" ? option : option.label;

const Select = ({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
}) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    className="h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-[#E8612A] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-400"
  >
    {options.map((option) => (
      <option key={optionValue(option)} value={optionValue(option)}>
        {optionLabel(option)}
      </option>
    ))}
  </select>
);

export default SaleLiquidationForm;
