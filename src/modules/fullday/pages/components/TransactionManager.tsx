import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  FieldValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { formatCurrency, roundCurrency } from "@/shared/helpers/formatCurrency";
import { usePackageStore } from "../../store/fulldayStore";
import { useAuthStore } from "@/store/auth/auth.store";
import {
  eliminarLiquidacion,
  fetchLiquidacionNota,
  insertarLiquidacion,
} from "../../api/fulldayApi";
import { showToast } from "@/components/ui/AppToast";
import { useParams } from "react-router";

type TransactionRow = {
  id: number;
  date: string;
  paymentMethod: string;
  currency: string;
  exchangeRate: string;
  amount: string;
  bankName: string;
  operationCode: string;
  status?: string;
  persisted?: boolean;
};

type TransactionManagerProps = {
  watch: UseFormWatch<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
};

const BANK_METHODS = ["DEPOSITO", "YAPE", "TARJETA", "TRANSFERENCIA", "CHEQUE"];

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toAmountString = (value: unknown) =>
  roundCurrency(toNumber(value)).toFixed(2);

const todayDate = () => new Date().toLocaleDateString("es-PE");

const toExchangeRateString = (value: unknown) =>
  toNumber(value).toFixed(3);

const toApiDate = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const dmyMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const sanitizeDelimitedValue = (value: unknown) =>
  String(value ?? "").replace(/[|;]/g, " ").trim();

const normalizeCurrencyForApi = (value: unknown) => {
  const currency = normalizeText(value);
  if (currency === "SOLES") return "SOL";
  if (currency === "DOLARES") return "DOL";
  return currency;
};

const normalizeLegacyCurrencyToUi = (value: unknown) => {
  const currency = normalizeText(value);
  if (currency === "SOL" || currency === "SOLES") return "SOLES";
  if (currency === "DOL" || currency === "DOLAR" || currency === "DOLARES") {
    return "DOLARES";
  }
  return currency || "SOLES";
};

const parseLegacyMoney = (value: unknown) => {
  const raw = String(value ?? "").trim().replace(/,/g, "");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseLegacyMoneyString = (value: unknown, decimals = 2) =>
  parseLegacyMoney(value).toFixed(decimals);

const parseLiquidacionNotaPayload = (
  payload: string | null | undefined,
): TransactionRow[] => {
  const raw = String(payload ?? "").trim();
  if (!raw || raw === "~") return [];

  let normalizedRaw = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") normalizedRaw = parsed;
  } catch {
    // respuesta no JSON
  }

  const rows = normalizedRaw
    .replace(/~/g, "¬")
    .split("¬")
    .map((row) => row.trim())
    .filter((row) => row && row !== "~");

  return rows
    .map((row, index) => {
      const fields = row.split("|");
      const liquidaId = Math.trunc(parseLegacyMoney(fields[0])) || index + 1;
      const estado = normalizeText(fields[9]);
      if (estado === "A") return null;

      const paymentMethod = normalizeText(fields[2]) || "-";
      const requiresBankData = BANK_METHODS.includes(paymentMethod);

      return {
        id: liquidaId,
        date: String(fields[1] ?? "").trim(),
        paymentMethod,
        currency: normalizeLegacyCurrencyToUi(fields[3]),
        exchangeRate: parseLegacyMoneyString(fields[4], 3),
        amount: parseLegacyMoneyString(fields[5], 2),
        bankName: requiresBankData ? String(fields[6] ?? "").trim() : "-",
        operationCode: requiresBankData ? String(fields[7] ?? "").trim() : "",
        status: estado || "P",
        persisted: true,
      } as TransactionRow;
    })
    .filter((row): row is TransactionRow => Boolean(row));
};

const applyPaymentRules = (row: TransactionRow): TransactionRow => {
  const method = normalizeText(row.paymentMethod);

  if (method === "EFECTIVO") {
    return {
      ...row,
      paymentMethod: "EFECTIVO",
      bankName: "-",
      operationCode: "",
    };
  }

  if (BANK_METHODS.includes(method)) {
    return {
      ...row,
      paymentMethod: method,
      bankName: row.bankName === "-" ? "" : String(row.bankName ?? ""),
    };
  }

  if (method === "-" || method === "") {
    return {
      ...row,
      paymentMethod: method,
      bankName: "",
      operationCode: "",
    };
  }

  return {
    ...row,
    paymentMethod: method,
  };
};

const TransactionManager = ({ watch, setValue }: TransactionManagerProps) => {
  const { isEditing } = usePackageStore();
  const user = useAuthStore((state) => state.user);
  const { liquidacionId } = useParams();
  const [savedPayments, setSavedPayments] = useState<TransactionRow[]>([]);
  const [hasSavedSnapshot, setHasSavedSnapshot] = useState(false);
  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);

  const transactions =
    (watch("transactions") as TransactionRow[] | undefined) ?? [];
  const totalToPay = toNumber(watch("totalGeneral") ?? watch("precioTotal"));
  const monedaPrincipal = normalizeText(watch("moneda")) || "SOLES";
  const currencySymbol = monedaPrincipal === "DOLARES" ? "USD$" : "S/.";
  const notaIdRaw = watch("notaId") ?? liquidacionId;
  const notaImagen = sanitizeDelimitedValue(watch("notaImagen") ?? "");

  const setTransactions = (rows: TransactionRow[], shouldDirty = true) => {
    setValue("transactions", rows, {
      shouldDirty,
      shouldTouch: shouldDirty,
    });
  };

  const syncFormAmountsFromTransactions = (rows: TransactionRow[]) => {
    const validRows = rows.filter((row) => normalizeText(row.status) !== "A");

    const acuentaTotal = roundCurrency(
      validRows.reduce((acc, row) => acc + toNumber(row.amount), 0),
    );
    const efectivoTotal = roundCurrency(
      validRows
        .filter((row) => normalizeText(row.paymentMethod) === "EFECTIVO")
        .reduce((acc, row) => acc + toNumber(row.amount), 0),
    );
    const depositoTotal = roundCurrency(
      validRows
        .filter((row) => BANK_METHODS.includes(normalizeText(row.paymentMethod)))
        .reduce((acc, row) => acc + toNumber(row.amount), 0),
    );
    const saldoTotal = roundCurrency(toNumber(totalToPay) - acuentaTotal);

    setValue("acuenta", acuentaTotal, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    setValue("saldo", saldoTotal, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    setValue("efectivo", efectivoTotal, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    setValue("deposito", depositoTotal, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  };

  const addTransaction = () => {
    const nextId = transactions.length
      ? Math.max(...transactions.map((item) => Number(item.id) || 0)) + 1
      : 1;

    const lastRow = transactions[transactions.length - 1];
    const newRow = applyPaymentRules({
      id: nextId,
      date: todayDate(),
      paymentMethod: lastRow?.paymentMethod ?? "EFECTIVO",
      currency: lastRow?.currency ?? monedaPrincipal,
      exchangeRate: lastRow?.exchangeRate ?? "0.000",
      amount: toAmountString(totalToPay),
      bankName: lastRow?.bankName ?? "",
      operationCode: "",
      status: "P",
      persisted: false,
    });

    setTransactions([...transactions, newRow], true);
  };

  const removeTransactionLocal = (id: number) => {
    const target = transactions.find((transaction) => transaction.id === id);
    if (!target) return;
    if (target.persisted) return;

    setTransactions(
      transactions.filter((transaction) => transaction.id !== id),
      true,
    );
  };

  const handleDeleteTransaction = async (row: TransactionRow) => {
    if (!isEditing) return;
    if (deletingRowId !== null || isSavingPayments) return;

    if (!row.persisted) {
      removeTransactionLocal(row.id);
      return;
    }

    const notaId = Math.trunc(toNumber(notaIdRaw));
    const liquidaId = Math.trunc(toNumber(row.id));
    if (notaId <= 0 || liquidaId <= 0) {
      showToast({
        title: "Liquidaciones",
        description: "No se pudo determinar NotaId o LiquidaId para eliminar.",
        type: "error",
      });
      return;
    }

    const usuario =
      sanitizeDelimitedValue(user?.displayName) ||
      sanitizeDelimitedValue(user?.username) ||
      sanitizeDelimitedValue(watch("counter"));

    if (!usuario) {
      showToast({
        title: "Liquidaciones",
        description: "No se pudo determinar el usuario para eliminar pagos.",
        type: "error",
      });
      return;
    }

    const estado = sanitizeDelimitedValue(row.status || "P") || "P";
    const confirmDelete = window.confirm(
      `¿Deseas eliminar la liquidacion #${liquidaId}?`,
    );
    if (!confirmDelete) return;

    const remainingRows = transactions.filter(
      (transaction) =>
        transaction.id !== row.id && normalizeText(transaction.status) !== "A",
    );

    const acuentaG = roundCurrency(
      remainingRows.reduce((acc, transaction) => acc + toNumber(transaction.amount), 0),
    );
    const acuentaE = roundCurrency(
      remainingRows
        .filter((transaction) => normalizeText(transaction.paymentMethod) === "EFECTIVO")
        .reduce((acc, transaction) => acc + toNumber(transaction.amount), 0),
    );
    const acuentaD = roundCurrency(
      remainingRows
        .filter((transaction) =>
          BANK_METHODS.includes(normalizeText(transaction.paymentMethod)),
        )
        .reduce((acc, transaction) => acc + toNumber(transaction.amount), 0),
    );
    const notaSaldo = roundCurrency(toNumber(totalToPay) - acuentaG);

    const valores = [
      String(liquidaId),
      String(notaId),
      acuentaG.toFixed(2),
      acuentaE.toFixed(2),
      acuentaD.toFixed(2),
      notaSaldo.toFixed(2),
      usuario,
      estado,
    ].join("|");

    setDeletingRowId(liquidaId);
    try {
      await eliminarLiquidacion(valores);

      const latestPayload = await fetchLiquidacionNota(notaId);
      const nextTransactions = parseLiquidacionNotaPayload(latestPayload);
      setTransactions(nextTransactions, false);
      syncFormAmountsFromTransactions(nextTransactions);
      setSavedPayments(nextTransactions);
      setHasSavedSnapshot(true);

      showToast({
        title: "Liquidaciones",
        description: "Liquidacion eliminada correctamente.",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la liquidacion.";
      showToast({
        title: "Liquidaciones",
        description: message,
        type: "error",
      });
    } finally {
      setDeletingRowId(null);
    }
  };

  const updateTransaction = (
    id: number,
    field: keyof TransactionRow,
    value: string,
  ) => {
    const updatedRows = transactions.map((transaction) => {
      if (transaction.id !== id) return transaction;

      const updatedRow = applyPaymentRules({
        ...transaction,
        [field]:
          field === "paymentMethod" || field === "currency"
            ? normalizeText(value)
            : value,
      });

      return updatedRow;
    });

    setTransactions(updatedRows, true);
  };

  const totals = useMemo(() => {
    const totalGeneral = roundCurrency(
      transactions.reduce((acc, row) => acc + toNumber(row.amount), 0),
    );

    const efectivo = roundCurrency(
      transactions
        .filter((row) => normalizeText(row.paymentMethod) === "EFECTIVO")
        .reduce((acc, row) => acc + toNumber(row.amount), 0),
    );

    const deposito = roundCurrency(
      transactions
        .filter((row) =>
          BANK_METHODS.includes(normalizeText(row.paymentMethod)),
        )
        .reduce((acc, row) => acc + toNumber(row.amount), 0),
    );

    return {
      efectivo,
      deposito,
      totalGeneral,
    };
  }, [transactions]);

  const savedTotals = useMemo(() => {
    const totalGeneral = roundCurrency(
      savedPayments.reduce((acc, row) => acc + toNumber(row.amount), 0),
    );

    const efectivo = roundCurrency(
      savedPayments
        .filter((row) => normalizeText(row.paymentMethod) === "EFECTIVO")
        .reduce((acc, row) => acc + toNumber(row.amount), 0),
    );

    const deposito = roundCurrency(
      savedPayments
        .filter((row) => BANK_METHODS.includes(normalizeText(row.paymentMethod)))
        .reduce((acc, row) => acc + toNumber(row.amount), 0),
    );

    return {
      efectivo,
      deposito,
      totalGeneral,
    };
  }, [savedPayments]);

  const handleSavePayments = async () => {
    if (isSavingPayments) return;

    const notaId = Math.trunc(toNumber(notaIdRaw));
    if (notaId <= 0) {
      showToast({
        title: "Liquidaciones",
        description: "No se pudo determinar el NotaId para guardar pagos.",
        type: "error",
      });
      return;
    }

    const usuario =
      sanitizeDelimitedValue(user?.displayName) ||
      sanitizeDelimitedValue(user?.username) ||
      sanitizeDelimitedValue(watch("counter"));

    if (!usuario) {
      showToast({
        title: "Liquidaciones",
        description: "No se pudo determinar el usuario para registrar pagos.",
        type: "error",
      });
      return;
    }

    const snapshot = transactions.map((row) =>
      applyPaymentRules({
        ...row,
        amount: toAmountString(row.amount),
      }),
    );

    const rowsToPersist = snapshot.filter(
      (row) => normalizeText(row.status) !== "A",
    );
    if (rowsToPersist.length === 0) {
      setSavedPayments(snapshot);
      setHasSavedSnapshot(true);
      showToast({
        title: "Liquidaciones",
        description: "No hay pagos válidos para guardar.",
        type: "info",
      });
      return;
    }

    const valoresBatch: string[] = [];

    for (let index = 0; index < rowsToPersist.length; index++) {
      const row = rowsToPersist[index];
      const liquidaId = row.persisted ? Math.trunc(toNumber(row.id)) : 0;
      const method = normalizeText(row.paymentMethod);
      const date = toApiDate(row.date);
      const amount = toAmountString(row.amount);
      const exchangeRate = toExchangeRateString(row.exchangeRate);

      if (row.persisted && liquidaId <= 0) {
        showToast({
          title: "Liquidaciones",
          description: `Fila ${index + 1}: LiquidaId inválido para edición.`,
          type: "warning",
        });
        return;
      }

      if (!date) {
        showToast({
          title: "Liquidaciones",
          description: `Fila ${index + 1}: fecha inválida. Use formato yyyy-MM-dd o dd/MM/yyyy.`,
          type: "warning",
        });
        return;
      }

      if (!method || method === "-") {
        showToast({
          title: "Liquidaciones",
          description: `Fila ${index + 1}: seleccione una forma de pago válida.`,
          type: "warning",
        });
        return;
      }

      if (toNumber(amount) <= 0) {
        showToast({
          title: "Liquidaciones",
          description: `Fila ${index + 1}: el importe debe ser mayor a 0.`,
          type: "warning",
        });
        return;
      }

      const requiresBankData = BANK_METHODS.includes(method);
      const bankName = requiresBankData
        ? sanitizeDelimitedValue(row.bankName)
        : "-";
      const operationCode = requiresBankData
        ? sanitizeDelimitedValue(row.operationCode)
        : "";

      if (requiresBankData && (!bankName || bankName === "-")) {
        showToast({
          title: "Liquidaciones",
          description: `Fila ${index + 1}: complete Entidad Bancaria.`,
          type: "warning",
        });
        return;
      }

      if (requiresBankData && !operationCode) {
        showToast({
          title: "Liquidaciones",
          description: `Fila ${index + 1}: complete Nro Operación.`,
          type: "warning",
        });
        return;
      }

      const valores = [
        String(liquidaId),
        String(notaId),
        date,
        sanitizeDelimitedValue(method),
        normalizeCurrencyForApi(row.currency || monedaPrincipal),
        exchangeRate,
        amount,
        bankName,
        operationCode,
        amount,
        usuario,
        notaImagen,
      ].join("|");

      valoresBatch.push(valores);
    }

    setIsSavingPayments(true);
    try {
      const listaPagos = valoresBatch.join(";");
      await insertarLiquidacion(listaPagos);

      const latestPayload = await fetchLiquidacionNota(notaId);
      const nextTransactions = parseLiquidacionNotaPayload(latestPayload);
      setTransactions(nextTransactions, false);
      syncFormAmountsFromTransactions(nextTransactions);
      setSavedPayments(nextTransactions);
      setHasSavedSnapshot(true);
      showToast({
        title: "Liquidaciones",
        description: `Se procesaron ${valoresBatch.length} pago(s).`,
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar pagos.";
      showToast({
        title: "Liquidaciones",
        description: message,
        type: "error",
      });
    } finally {
      setIsSavingPayments(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Recibido
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  FormaPago
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Moneda
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  TipoCambio
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  Importe
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  EntidadBancaria
                </th>
                <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  NroOperacion
                </th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const method = normalizeText(transaction.paymentMethod);
                const rowLocked = normalizeText(transaction.status) === "E";
                const requiresBankData = BANK_METHODS.includes(method);
                const bankDisabled = !isEditing || rowLocked || !requiresBankData;
                const operationDisabled =
                  !isEditing ||
                  rowLocked ||
                  !requiresBankData ||
                  !transaction.bankName ||
                  transaction.bankName === "-";

                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        disabled={!isEditing || rowLocked}
                        className="w-full min-w-[90px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 focus:bg-slate-50 transition-all disabled:opacity-60"
                        value={transaction.date}
                        onChange={(e) =>
                          updateTransaction(
                            transaction.id,
                            "date",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        disabled={!isEditing || rowLocked}
                        className="w-full min-w-[110px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 bg-white cursor-pointer transition-all disabled:opacity-60"
                        value={transaction.paymentMethod}
                        onChange={(e) =>
                          updateTransaction(
                            transaction.id,
                            "paymentMethod",
                            e.target.value,
                          )
                        }
                      >
                        <option value="-">-</option>
                        <option value="EFECTIVO">EFECTIVO</option>
                        <option value="DEPOSITO">DEPOSITO</option>
                        <option value="YAPE">YAPE</option>
                        <option value="TARJETA">TARJETA</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        disabled={!isEditing || rowLocked}
                        className="w-full min-w-[90px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 bg-white cursor-pointer transition-all disabled:opacity-60"
                        value={transaction.currency}
                        onChange={(e) =>
                          updateTransaction(
                            transaction.id,
                            "currency",
                            e.target.value,
                          )
                        }
                      >
                        <option value="SOLES">SOLES</option>
                        <option value="DOLARES">DOLARES</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        disabled={!isEditing || rowLocked}
                        className="w-full min-w-[80px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 focus:bg-slate-50 transition-all disabled:opacity-60"
                        value={transaction.exchangeRate}
                        onChange={(e) =>
                          updateTransaction(
                            transaction.id,
                            "exchangeRate",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={!isEditing || rowLocked}
                        className="w-full min-w-[90px] px-2.5 py-1.5 text-xs text-right font-semibold 
                               border border-slate-200 rounded focus:outline-none focus:border-slate-400 
                               focus:bg-slate-50 transition-all disabled:opacity-60"
                        value={transaction.amount}
                        onChange={(e) =>
                          updateTransaction(
                            transaction.id,
                            "amount",
                            e.target.value,
                          )
                        }
                        onBlur={(e) =>
                          updateTransaction(
                            transaction.id,
                            "amount",
                            toAmountString(e.target.value),
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        disabled={bankDisabled}
                        className="w-full min-w-[110px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 bg-white cursor-pointer transition-all disabled:opacity-60"
                        value={transaction.bankName}
                        onChange={(e) =>
                          updateTransaction(
                            transaction.id,
                            "bankName",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">(SELECCIONE)</option>
                        <option value="-">-</option>
                        <option value="BCP">BCP</option>
                        <option value="BBVA">BBVA</option>
                        <option value="INTERBANK">INTERBANK</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        disabled={operationDisabled}
                        className="w-full min-w-[110px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 focus:bg-slate-50 transition-all disabled:opacity-60"
                        value={transaction.operationCode}
                        onChange={(e) =>
                          updateTransaction(
                            transaction.id,
                            "operationCode",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        disabled={
                          !isEditing ||
                          isSavingPayments ||
                          deletingRowId === transaction.id
                        }
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded 
                               transition-all duration-200 disabled:opacity-40 disabled:hover:bg-transparent"
                        onClick={() => void handleDeleteTransaction(transaction)}
                        title="Eliminar transaccion"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 mb-3 mx-3 max-w-[calc(100%-1.5rem)] grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!isEditing}
            className="px-4 py-2.5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 text-xs 
                     font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 
                     flex items-center justify-center gap-2 disabled:opacity-60"
            onClick={addTransaction}
          >
            <Plus size={18} />
            Agregar pago con total del formulario
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60"
            onClick={handleSavePayments}
            disabled={!isEditing || transactions.length === 0 || isSavingPayments}
          >
            {isSavingPayments ? "Guardando..." : "Guardar pagos"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Efectivo
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {currencySymbol} {formatCurrency(totals.efectivo)}
            </span>
          </div>

          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Deposito
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {currencySymbol} {formatCurrency(totals.deposito)}
            </span>
          </div>

          <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg text-white">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Totales
            </span>
            <span className="text-lg font-bold text-white">
              {currencySymbol} {formatCurrency(totals.totalGeneral)}
            </span>
          </div>
        </div>
      </div>

      {hasSavedSnapshot && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-800">
              Pagos guardados
            </p>
            <span className="text-xs font-medium text-emerald-700">
              {savedPayments.length} registro(s)
            </span>
          </div>

          {savedPayments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No hay pagos para mostrar.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {savedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <span>Fecha: {payment.date}</span>
                    <span>Metodo: {payment.paymentMethod || "-"}</span>
                    <span>Banco: {payment.bankName || "-"}</span>
                    <span>Operacion: {payment.operationCode || "-"}</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {payment.currency === "DOLARES" ? "USD$" : "S/."}{" "}
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="rounded-md bg-slate-100 px-3 py-2 text-xs">
                  Efectivo: {currencySymbol} {formatCurrency(savedTotals.efectivo)}
                </div>
                <div className="rounded-md bg-slate-100 px-3 py-2 text-xs">
                  Deposito: {currencySymbol} {formatCurrency(savedTotals.deposito)}
                </div>
                <div className="rounded-md bg-slate-900 px-3 py-2 text-xs text-white font-semibold">
                  Total: {currencySymbol} {formatCurrency(savedTotals.totalGeneral)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
