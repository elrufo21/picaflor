import { useCallback, useEffect, useMemo, useRef } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import { formatCurrency } from "@/shared/helpers/formatCurrency";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import ProductFormDialog, {
  buildProductPayload,
  type ProductFormValues,
} from "../components/ProductFormDialog";
import { useProductSublineas } from "../useProductSublineas";
import { saveProductApi, updateProductApi } from "../products.api";
import { Pencil, Trash2 } from "lucide-react";
import { queueServiciosRefresh } from "@/app/db/serviciosSync";
import { showToast } from "@/components/ui/AppToast";
import { useAuthStore } from "@/store/auth/auth.store";
import type { UseFormReturn } from "react-hook-form";
import type { Product } from "@/types/maintenance";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";

type RequiredProductField = {
  key: keyof ProductFormValues;
  label: string;
};

const getMissingRequiredFields = (
  values: ProductFormValues,
): RequiredProductField[] => {
  const missing: RequiredProductField[] = [];

  if (!String(values.categoria ?? "").trim()) {
    missing.push({ key: "categoria", label: "Categoría" });
  }

  if (!String(values.region ?? "").trim()) {
    missing.push({ key: "region", label: "Región" });
  }

  if (!String(values.descripcion ?? "").trim()) {
    missing.push({ key: "descripcion", label: "Producto" });
  }

  return missing;
};

const ProductList = () => {
  const products = useMaintenanceStore((state) => state.products);
  const fetchProducts = useMaintenanceStore((state) => state.fetchProducts);
  const deleteProduct = useMaintenanceStore((state) => state.deleteProduct);
  const { user } = useAuthStore();
  const { data: sublineas = [] } = useProductSublineas();
  const openDialog = useDialogStore((state) => state.openDialog);
  const formRef = useRef<UseFormReturn<ProductFormValues> | null>(null);

  useEffect(() => {
    if (products.length) return;
    fetchProducts();
  }, [products.length, fetchProducts]);

  const username = user?.displayName?.trim() || user?.username || "sistema";

  const openProductModal = useCallback(
    (mode: "create" | "edit", product?: Product) => {
      if (formRef.current) {
        formRef.current.reset();
      }
      openDialog({
        title: mode === "create" ? "Nuevo producto" : "Editar producto",
        description:
          mode === "create"
            ? "Registra un nuevo producto desde este formulario."
            : "Actualiza la información del producto seleccionado.",
        size: "lg",
        confirmLabel: mode === "create" ? "Crear" : "Guardar",
        cancelLabel: "Cancelar",
        content: () => (
          <ProductFormDialog formRef={formRef} initialData={product} />
        ),
        onConfirm: () => {
          if (!formRef.current) return;
          return formRef.current.handleSubmit(async (values) => {
            formRef.current?.clearErrors([
              "categoria",
              "region",
              "descripcion",
            ]);
            const missingFields = getMissingRequiredFields(values);
            if (missingFields.length > 0) {
              missingFields.forEach((field) => {
                formRef.current?.setError(field.key, {
                  type: "required",
                  message: `${field.label} es obligatorio.`,
                });
              });
              const firstMissing = missingFields[0];
              if (firstMissing) {
                formRef.current?.setFocus(firstMissing.key);
              }
              showToast({
                title: "Campos obligatorios",
                description: `Completa: ${missingFields.map((item) => item.label).join(", ")}.`,
                type: "warning",
              });
              throw new Error("Faltan campos obligatorios del producto");
            }

            const payload = buildProductPayload(
              values,
              username,
              product,
              sublineas,
            );
            const isEditMode = Boolean(product?.id);

            try {
              if (isEditMode) {
                await updateProductApi(payload);
              } else {
                await saveProductApi(payload);
              }
              await fetchProducts();
              queueServiciosRefresh();
              showToast({
                title:
                  mode === "create"
                    ? "Producto registrado"
                    : "Producto actualizado",
                description:
                  mode === "create"
                    ? "El producto se guardó correctamente."
                    : "Los cambios se guardaron correctamente.",
                type: "success",
              });
            } catch (error) {
              const description =
                error instanceof Error
                  ? error.message
                  : "Revisa tu conexión e inténtalo de nuevo.";
              showToast({
                title: "No se pudo guardar el producto",
                description,
                type: "error",
              });
              throw error;
            }
          })();
        },
      });
    },
    [openDialog, username, fetchProducts, sublineas],
  );

  const handleDeleteProduct = useCallback(
    (product: Product) => {
      if (!product?.id) return;
      openDialog({
        title: "Eliminar producto",
        size: "sm",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        onConfirm: async () => {
          const success = await deleteProduct(product.id);
          if (!success) {
            showToast({
              title: "No se pudo eliminar el producto",
              description: "Intenta nuevamente más tarde.",
              type: "error",
            });
            throw new Error("No se pudo eliminar el producto");
          }
          queueServiciosRefresh();
        },
        content: () => (
          <p className="text-sm text-slate-700">
            ¿Deseas eliminar {product.descripcion || product.codigo}?
          </p>
        ),
      });
    },
    [deleteProduct, openDialog],
  );

  const columnHelper = createColumnHelper<Product>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("codigo", {
        header: "Código",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("descripcion", {
        header: "Producto",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("categoria", {
        header: "Categoría",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("precio", {
        header: "Precio base",
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor("ventaSoles", {
        header: "Venta S/.",
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor("ventaDolar", {
        header: "Venta USD",
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor("cantidad", {
        header: "Cantidad",
        cell: (info) => info.getValue().toString(),
      }),
      columnHelper.accessor("cantMaxPax", {
        header: "Máx. pax",
        cell: (info) => info.getValue().toString(),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openProductModal("edit", row.original)}
              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteProduct(row.original)}
              className="text-red-600 hover:text-red-800 flex items-center gap-1"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </div>
        ),
      }),
    ],
    [columnHelper, openProductModal, handleDeleteProduct],
  );

  return (
    <MaintenancePageFrame title="Productos">
      <DndTable
        data={products}
        columns={columns}
        enableDateFilter={false}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            onClick={() => openProductModal("create")}
            title="Nuevo producto"
            aria-label="Nuevo producto"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default ProductList;
