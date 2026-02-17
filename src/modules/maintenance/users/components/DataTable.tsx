import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDialogStore } from "@/app/store/dialogStore";

interface DataTableProps<T> {
  columns: any[];
  data: T[];
  onRowClick?: (row: T) => void;
  filterKeys?: (keyof T & string)[];
  tdClassName?: string | ((cell: any) => string | undefined);
  renderFilters?: ReactNode;
}

export default function DataTable<T>({
  columns,
  data,
  onRowClick,
  filterKeys,
  tdClassName,
  renderFilters,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const previousDataLength = useRef(data?.length ?? 0);
  const dialogOpen = useDialogStore((s) => s.isOpen);
  const previousDialogOpen = useRef(dialogOpen);

  const focusSearch = () => {
    const input = searchRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const length = input.value?.length ?? 0;
    try {
      input.setSelectionRange(length, length);
    } catch {
      // ignore selection issues on non-text inputs
    }
  };

  useEffect(() => {
    focusSearch();
  }, []);

  const dataLength = data?.length ?? 0;
  useEffect(() => {
    if (dataLength < previousDataLength.current) {
      focusSearch();
    }
    previousDataLength.current = dataLength;
  }, [dataLength]);

  useEffect(() => {
    if (previousDialogOpen.current && !dialogOpen) {
      focusSearch();
    }
    previousDialogOpen.current = dialogOpen;
  }, [dialogOpen]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, _columnId, filterValue) => {
      const term = String(filterValue ?? "")
        .toLowerCase()
        .trim();
      if (!term) return true;

      if (!filterKeys || filterKeys.length === 0) {
        return Object.values(row.original ?? {}).some((value) =>
          String(value ?? "").toLowerCase().includes(term),
        );
      }

      return filterKeys.some((key) =>
        String((row.original as any)?.[key] ?? "")
          .toLowerCase()
          .includes(term),
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getTdClassName = (cell: any) =>
    typeof tdClassName === "function" ? tdClassName(cell) : tdClassName;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="p-3 flex items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-200">
        <input
          ref={searchRef}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#E8612A]"
          placeholder="Buscar..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        {renderFilters}
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-100/80 text-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left font-semibold border-b border-slate-200"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1 cursor-pointer select-none hover:text-[#E8612A]">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: "?",
                          desc: "?",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-3 py-2 text-slate-800 ${getTdClassName(cell) ?? ""}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-slate-500"
                >
                  No hay registros para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <span>
            Pagina {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
        </div>
        <div>Registros: {data?.length ?? 0}</div>
      </div>
    </div>
  );
}
