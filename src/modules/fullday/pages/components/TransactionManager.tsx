import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";

const TransactionManager = () => {
  const [account, setAccount] = useState("");
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: "05/02/2026",
      paymentForm: "EFECTIVO",
      currency: "SOLES",
      exchangeRate: "0.000",
      amount: "50.00",
      bankEntity: "",
    },
    {
      id: 2,
      date: "05/02/2026",
      paymentForm: "EFECTIVO",
      currency: "SOLES",
      exchangeRate: "0.000",
      amount: "400.00",
      bankEntity: "",
    },
  ]);

  const addTransaction = () => {
    const newTransaction = {
      id: transactions.length + 1,
      date: new Date().toLocaleDateString("es-PE"),
      paymentForm: "EFECTIVO",
      currency: "SOLES",
      exchangeRate: "0.000",
      amount: "0.00",
      bankEntity: "",
    };
    setTransactions([...transactions, newTransaction]);
  };

  const removeTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const updateTransaction = (id, field, value) => {
    setTransactions(
      transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const calculateTotals = () => {
    const total = transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0,
    );
    return {
      efectivo: 0.0,
      deposito: 0.0,
      totalEfectivo: 0.0,
      totalGeneral: total,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>

      {/* Header Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <label className="block mb-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
          A Cuenta
        </label>
        <input
          type="text"
          className="w-full max-w-md px-3 py-2 text-sm border-2 border-slate-200 rounded-lg 
                   focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 
                   transition-all font-medium"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="Ingrese número de cuenta"
        />
        <div className="flex gap-3 mt-3">
          <button
            className="px-4 py-2 bg-slate-600 text-white text-xs font-semibold rounded-lg 
                           hover:bg-slate-700 hover:shadow-md transition-all duration-200"
          >
            Activar
          </button>
          <button
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg 
                           hover:bg-slate-800 hover:shadow-md transition-all duration-200"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Transactions Table */}
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
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      className="w-full min-w-[90px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 focus:bg-slate-50 transition-all"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
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
                      className="w-full min-w-[110px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 bg-white cursor-pointer transition-all"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                      value={transaction.paymentForm}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "paymentForm",
                          e.target.value,
                        )
                      }
                    >
                      <option value="EFECTIVO">EFECTIVO</option>
                      <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                      <option value="TARJETA">TARJETA</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      className="w-full min-w-[90px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 bg-white cursor-pointer transition-all"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
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
                      <option value="DOLARES">DÓLARES</option>
                      <option value="EUROS">EUROS</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      className="w-full min-w-[80px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 focus:bg-slate-50 transition-all"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
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
                      type="text"
                      className="w-full min-w-[90px] px-2.5 py-1.5 text-xs text-right font-semibold 
                               border border-slate-200 rounded focus:outline-none focus:border-slate-400 
                               focus:bg-slate-50 transition-all"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      value={transaction.amount}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "amount",
                          e.target.value,
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      className="w-full min-w-[100px] px-2.5 py-1.5 text-xs border border-slate-200 rounded 
                               focus:outline-none focus:border-slate-400 focus:bg-slate-50 transition-all"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      value={transaction.bankEntity}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "bankEntity",
                          e.target.value,
                        )
                      }
                      placeholder="-"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded 
                               transition-all duration-200"
                      onClick={() => removeTransaction(transaction.id)}
                      title="Eliminar transacción"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          className="w-full px-4 py-2.5 mt-3 mb-3 mx-3 max-w-[calc(100%-1.5rem)] bg-slate-50 
                   border-2 border-dashed border-slate-300 rounded-lg text-slate-600 text-xs 
                   font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all 
                   duration-200 flex items-center justify-center gap-2"
          onClick={addTransaction}
        >
          <Plus size={18} />
          Agregar Transacción
        </button>
      </div>

      {/* Totals Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Efectivo */}
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Efectivo
            </span>
            <div className="flex gap-4 items-center">
              <span
                className="text-sm font-semibold text-slate-900"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ${totals.efectivo.toFixed(2)}
              </span>
              <span
                className="text-sm font-semibold text-purple-600"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                S/. {totals.efectivo.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Deposito */}
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Deposito
            </span>
            <div className="flex gap-4 items-center">
              <span
                className="text-sm font-semibold text-slate-900"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ${totals.deposito.toFixed(2)}
              </span>
              <span
                className="text-sm font-semibold text-purple-600"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                S/. {totals.deposito.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Totales */}
          <div
            className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 
                        rounded-lg text-white"
          >
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Totales
            </span>
            <div className="flex gap-4 items-center">
              <span
                className="text-sm font-semibold text-slate-300"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ${totals.totalEfectivo.toFixed(2)}
              </span>
              <span
                className="text-lg font-bold text-white"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                S/. {totals.totalGeneral.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManager;
