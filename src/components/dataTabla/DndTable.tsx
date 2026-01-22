import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  X,
} from "lucide-react";

// ============================================
// TABLA PRINCIPAL - COMPONENTE REUTILIZABLE
// ============================================
const DndTable = ({
  data = [],
  columns = [],
  enableSorting = false,
  enableFiltering = false,
  enableDateFilter = false,
  dateField = "fecha",
  enablePagination = true,
  enableRowSelection = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onRowClick = null,
  isLoading = false,
  emptyMessage = "No hay datos disponibles",
  className = "",
  dataFilterFn = null,
  enableSearching = true,
  onSelectionChange = null,
  searchColumns = null,
  dateFilterComponent = null,
}) => {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [dateFilter, setDateFilter] = useState("");
  const searchColumnsKey = (searchColumns ?? []).join(",");
  const searchColumnSet = useMemo(() => {
    if (!searchColumnsKey) return null;
    return new Set(searchColumns);
  }, [searchColumnsKey, searchColumns]);

  const filteredData = useMemo(() => {
    if (!enableDateFilter || !dateField) return data;
    return data.filter((row) => {
      const rawDate = row?.[dateField];
      if (!rawDate) return true;
      if (!dateFilter) return true;
      const valueDate = new Date(rawDate);
      const filterDate = new Date(dateFilter);
      if (
        Number.isNaN(valueDate.getTime()) ||
        Number.isNaN(filterDate.getTime())
      )
        return true;
      return valueDate.toDateString() === filterDate.toDateString();
    });
  }, [data, dateField, dateFilter, enableDateFilter]);
  useEffect(() => {
    if (!onSelectionChange) return;

    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);

    onSelectionChange(selectedRows);
  }, [rowSelection]);

  useEffect(() => {
    if (enableRowSelection) return;
    setRowSelection({});
  }, [enableRowSelection]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [dateFilter]);

  const shouldFilter =
    enableFiltering || // actual column filters
    enableSearching; // allow string search even without filtering

  const customGlobalFilterFn = useMemo(() => {
    if (!enableSearching) return undefined;
    return (row, columnId, filterValue) => {
      const rawValue = String(filterValue ?? "").trim();
      if (!rawValue) return true;
      const targetColumns = searchColumnSet
        ? Array.from(searchColumnSet)
        : row
            .getVisibleCells()
            .map((cell) => cell.column.id)
            .filter(Boolean);
      const normalizedFilter = rawValue.toLowerCase();
      return targetColumns.some((colId) => {
        const value =
          searchColumnSet && row.original
            ? row.original[colId]
            : row.getValue(colId);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(normalizedFilter);
      });
    };
  }, [enableSearching, searchColumnSet]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.idDetalle || row.id,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection,
      pagination,
      dateFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: shouldFilter ? getFilteredRowModel() : undefined,
    globalFilterFn: customGlobalFilterFn,
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
    enableRowSelection,
  });

  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      {/* Header con búsqueda y acciones */}
      {(enableFiltering || enableSearching) && (
        <TableHeader
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          selectedRows={Object.keys(rowSelection).length}
          totalRows={filteredData.length}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          enableDateFilter={enableDateFilter && Boolean(dateField)}
          enableSearching={enableSearching}
          enableFiltering={enableFiltering}
          dateFilterComponent={dateFilterComponent}
        />
      )}

      {/* Contenedor de la tabla con scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHead table={table} enableSorting={enableSorting} />
          <TableBody
            table={table}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            enableRowSelection={enableRowSelection}
          />
        </table>
      </div>

      {/* Paginación */}
      {enablePagination && (
        <TablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  );
};

// ============================================
// HEADER DE LA TABLA
// ============================================
const TableHeader = ({
  globalFilter,
  setGlobalFilter,
  selectedRows,
  totalRows,
  dateFilter,
  setDateFilter,
  enableDateFilter,
  enableSearching,
  enableFiltering,
  dateFilterComponent,
}) => {
  return (
    <div className="p-4 sm:p-6 border-b border-slate-200">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md w-full">
          {enableSearching && (
            <>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar en toda la tabla..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {dateFilterComponent
            ? dateFilterComponent()
            : enableDateFilter && (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter("")}
                      className="text-xs text-slate-600 underline"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              )}
          {selectedRows > 0 && (
            <span className="text-sm text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
              {selectedRows} seleccionado{selectedRows > 1 ? "s" : ""}
            </span>
          )}
          {enableFiltering && (
            <>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Filter className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-slate-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// HEAD DE LA TABLA
// ============================================
const TableHead = ({ table, enableSorting }) => {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              className={`px-4 sm:px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                header.column.columnDef.meta?.align === "center"
                  ? "text-center"
                  : header.column.columnDef.meta?.align === "right"
                    ? "text-right"
                    : "text-left"
              }`}
            >
              {header.isPlaceholder ? null : (
                <div
                  className={`flex items-center gap-2 ${
                    header.column.columnDef.meta?.align === "center"
                      ? "justify-center"
                      : header.column.columnDef.meta?.align === "right"
                        ? "justify-end"
                        : "justify-start"
                  } ${
                    header.column.getCanSort() && enableSorting
                      ? "cursor-pointer select-none hover:text-emerald-600"
                      : ""
                  }`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {enableSorting && header.column.getCanSort() && (
                    <SortIcon sorted={header.column.getIsSorted()} />
                  )}
                </div>
              )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
};

// ============================================
// ICONO DE ORDENAMIENTO
// ============================================
const SortIcon = ({ sorted }) => {
  if (sorted === "asc") {
    return <ChevronUp className="w-4 h-4 text-emerald-600" />;
  }
  if (sorted === "desc") {
    return <ChevronDown className="w-4 h-4 text-emerald-600" />;
  }
  return <ChevronsUpDown className="w-4 h-4 text-slate-400" />;
};

// ============================================
// BODY DE LA TABLA
// ============================================
const TableBody = ({
  table,
  isLoading,
  emptyMessage,
  onRowClick,
  rowSelection,
  setRowSelection,
  enableRowSelection,
}) => {
  if (isLoading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={table.getAllColumns().length}
            className="text-center py-12"
          >
            <LoadingSpinner />
          </td>
        </tr>
      </tbody>
    );
  }

  if (table.getRowModel().rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={table.getAllColumns().length}
            className="text-center py-12"
          >
            <EmptyState message={emptyMessage} />
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-slate-200 bg-white">
      {table.getRowModel().rows.map((row) => (
        <tr
          key={row.id}
          onClick={() => {
            if (enableRowSelection) {
              setRowSelection(row.getIsSelected() ? {} : { [row.id]: true });
            }
            onRowClick && onRowClick(row.original);
          }}
          className={`
    
    transition-colors
    ${row.getIsSelected() ? "bg-emerald-50" : "hover:bg-slate-50"}
  `}
        >
          {row.getVisibleCells().map((cell) => (
            <td
              key={cell.id}
              className={`px-4 sm:px-6 py-4 text-sm text-slate-700 whitespace-nowrap ${
                cell.column.columnDef.meta?.align === "center"
                  ? "text-center"
                  : cell.column.columnDef.meta?.align === "right"
                    ? "text-right"
                    : "text-left"
              }`}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

// ============================================
// LOADING SPINNER
// ============================================
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="text-slate-600">Cargando datos...</p>
    </div>
  );
};

// ============================================
// ESTADO VACÍO
// ============================================
const EmptyState = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <Search className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-600">{message}</p>
    </div>
  );
};

// ============================================
// PAGINACIÓN
// ============================================
const TablePagination = ({ table, pageSizeOptions }) => {
  return (
    <div className="px-4 sm:px-6 py-4 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Info de filas */}
        <div className="flex items-center gap-4">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} filas
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-600">
            Mostrando{" "}
            <span className="font-medium">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}
            </span>{" "}
            de{" "}
            <span className="font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            resultados
          </span>
        </div>

        {/* Controles de paginación */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          <span className="text-sm text-slate-600 px-2">
            Página{" "}
            <span className="font-medium">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
            de <span className="font-medium">{table.getPageCount()}</span>
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DndTable;
