import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Checkbox, FormControlLabel } from "@mui/material";

import DndTable from "@/components/dataTabla/DndTable";
import { useDialogStore } from "@/app/store/dialogStore";
import { showToast } from "@/components/ui/AppToast";
import { queueServiciosRefresh } from "@/app/db/serviciosSync";
import { serviciosDB } from "@/app/db/serviciosDB";
import { AutocompleteControlled, TextControlled } from "@/components/ui/inputs";
import MaintenancePageFrame from "../../components/MaintenancePageFrame";
import {
  type SalesChannelDetail,
  type SaveSalesChannelPayload,
  useSalesChannels,
} from "../hooks/useSalesChannels";
import { useMaintenanceAccessResolver } from "../../permissions/useMaintenanceAccessResolver";

const emailRegex = /^[^\s@]+@[^\s@]+\.com$/i;

type CanalVentaDialogValues = {
  ruc: string;
  razonSocial: string;
  label: string;
  direccion: string;
  region: string;
  contacto: string;
  contacto02: string;
  telefono: string;
  celular: string;
  email: string;
  webSite: string;
  clasificacion: string;
  categoria: string;
  fechaAniversario: string;
  representanteLegal: string;
  fechaNacimiento: string;
  nota: string;
  permiteLiquidacionCredito: boolean;
  logo: string;
  limiteCredito: string;
  fechaLimiteCredito: string;
  productoId: string;
  precioDolares: string;
  precioSoles: string;
};

type CanalVentaDialogPayload = Partial<CanalVentaDialogValues> & {
  value?: string;
  search?: string;
  editingValue?: string;
  imageFile?: File | null;
  imagePreview?: string;
};

const parsePriceValue = (value: unknown) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseCreditDaysValue = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

const CanalVentaDialogForm = ({
  payload,
  setPayload,
  fetchAuxiliarProductPrice,
  fetchAuxiliarProductPrices,
}: {
  payload: CanalVentaDialogPayload;
  setPayload: (
    next:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => void;
  fetchAuxiliarProductPrice: (
    idProducto: number,
    idAuxiliar: number,
  ) => Promise<{ precioDolares: number; precioSoles: number } | null>;
  fetchAuxiliarProductPrices: (idProducto: number) => Promise<
    {
      idAuxiliar: number;
      precioDolares: number;
      precioSoles: number;
      estado?: string;
    }[]
  >;
}) => {
  const { control, setValue } = useForm<CanalVentaDialogValues>({
    defaultValues: {
      ruc: String(payload.ruc ?? ""),
      razonSocial: String(payload.razonSocial ?? ""),
      label: String(payload.label ?? ""),
      direccion: String(payload.direccion ?? ""),
      region: String(payload.region ?? ""),
      contacto: String(payload.contacto ?? ""),
      contacto02: String(payload.contacto02 ?? ""),
      telefono: String(payload.telefono ?? ""),
      celular: String(payload.celular ?? ""),
      email: String(payload.email ?? ""),
      webSite: String(payload.webSite ?? ""),
      clasificacion: String(payload.clasificacion ?? ""),
      categoria: String(payload.categoria ?? ""),
      fechaAniversario: String(payload.fechaAniversario ?? ""),
      representanteLegal: String(payload.representanteLegal ?? ""),
      fechaNacimiento: String(payload.fechaNacimiento ?? ""),
      nota: String(payload.nota ?? ""),
      permiteLiquidacionCredito: Boolean(payload.permiteLiquidacionCredito),
      logo: String(payload.logo ?? ""),
      limiteCredito: String(payload.limiteCredito ?? ""),
      fechaLimiteCredito: String(payload.fechaLimiteCredito ?? ""),
      productoId: String(payload.productoId ?? ""),
      precioDolares: String(payload.precioDolares ?? ""),
      precioSoles: String(payload.precioSoles ?? ""),
    },
  });
  const [productOptions, setProductOptions] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [productPrices, setProductPrices] = useState<
    {
      idAuxiliar: number;
      precioDolares: number;
      precioSoles: number;
      estado?: string;
    }[]
  >([]);
  const [isLoadingProductPrices, setIsLoadingProductPrices] = useState(false);
  const selectedProductId = useWatch({
    control,
    name: "productoId",
  });
  const editingAuxiliarId = Number(payload.editingValue ?? payload.value ?? 0);
  const logoUrl = String(payload.logo ?? "").trim();
  const filePreview = String(payload.imagePreview ?? "").trim();
  const imagePreview =
    payload.imageFile instanceof File ? filePreview : logoUrl || filePreview;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result ?? "");
      setPayload({
        ...payload,
        imageFile: file,
        imagePreview: preview,
      });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let canceled = false;
    serviciosDB.productos
      .toArray()
      .then((items) => {
        if (canceled) return;
        setProductOptions(items);
      })
      .catch((error) => {
        console.error("Error loading products for sales channel form", error);
      });

    return () => {
      canceled = true;
    };
  }, []);

  const productIds = useMemo(
    () => productOptions.map((product) => String(product.id)),
    [productOptions],
  );
  const productLabelsById = useMemo(() => {
    const labels = new Map<string, string>();
    productOptions.forEach((product) => {
      labels.set(
        String(product.id),
        String(product.nombre ?? "").trim() || `Producto ${product.id}`,
      );
    });
    return labels;
  }, [productOptions]);

  useEffect(() => {
    const productId = Number(selectedProductId);
    if (!Number.isFinite(productId) || productId <= 0) {
      setValue("precioDolares", "");
      setValue("precioSoles", "");
      return;
    }

    if (!Number.isFinite(editingAuxiliarId) || editingAuxiliarId <= 0) {
      return;
    }

    let canceled = false;
    fetchAuxiliarProductPrice(productId, editingAuxiliarId)
      .then((price) => {
        if (canceled) return;
        const nextPrecioDolares =
          price && Number.isFinite(price.precioDolares)
            ? String(price.precioDolares)
            : "";
        const nextPrecioSoles =
          price && Number.isFinite(price.precioSoles)
            ? String(price.precioSoles)
            : "";

        setValue("precioDolares", nextPrecioDolares, {
          shouldDirty: false,
          shouldValidate: false,
        });
        setValue("precioSoles", nextPrecioSoles, {
          shouldDirty: false,
          shouldValidate: false,
        });
        setPayload((prev) => ({
          ...prev,
          precioDolares: nextPrecioDolares,
          precioSoles: nextPrecioSoles,
        }));
      })
      .catch((error) => {
        if (canceled) return;
        console.error("Error loading auxiliar product price", error);
      });

    return () => {
      canceled = true;
    };
  }, [
    editingAuxiliarId,
    fetchAuxiliarProductPrice,
    selectedProductId,
    setPayload,
    setValue,
  ]);

  useEffect(() => {
    const productId = Number(selectedProductId);
    if (!Number.isFinite(productId) || productId <= 0) {
      setProductPrices([]);
      setIsLoadingProductPrices(false);
      return;
    }

    let canceled = false;
    setIsLoadingProductPrices(true);
    fetchAuxiliarProductPrices(productId)
      .then((rows) => {
        if (canceled) return;
        setProductPrices(rows);
      })
      .catch((error) => {
        if (canceled) return;
        console.error("Error loading auxiliar prices by product", error);
        setProductPrices([]);
      })
      .finally(() => {
        if (canceled) return;
        setIsLoadingProductPrices(false);
      });

    return () => {
      canceled = true;
    };
  }, [fetchAuxiliarProductPrices, selectedProductId]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextControlled<CanalVentaDialogValues>
          name="ruc"
          control={control}
          label="RUC"
          placeholder="Ej: 20123456789"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, ruc: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="region"
          control={control}
          label="Región"
          placeholder="Ej: LIMA"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, region: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="label"
            control={control}
            label="Nombre"
            placeholder="Ej: AEROMAR TRAVEL"
            required
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, label: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="direccion"
            control={control}
            label="Dirección"
            placeholder="Ej: AV. PRINCIPAL 123 - LIMA"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, direccion: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          {" "}
          <TextControlled<CanalVentaDialogValues>
            name="razonSocial"
            control={control}
            label="Razón social"
            placeholder="Ej: AEROMAR TRAVEL SAC"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, razonSocial: e.target.value });
            }}
          />
        </div>

        <TextControlled<CanalVentaDialogValues>
          name="contacto"
          control={control}
          label="Contacto"
          placeholder="Ej: DIANA"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, contacto: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="contacto02"
          control={control}
          label="Contacto 02"
          placeholder="Ej: MARIA"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, contacto02: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="telefono"
          control={control}
          label="Telefono"
          placeholder="Ej: 984821760"
          required
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, telefono: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="celular"
          control={control}
          label="Celular"
          placeholder="Ej: 984821760"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, celular: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="email"
            control={control}
            label="Email"
            type="email"
            disableAutoUppercase
            placeholder="Ej: contacto@canal.com"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, email: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="webSite"
            control={control}
            label="Web site"
            disableAutoUppercase
            placeholder="Ej: https://canal.com"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, webSite: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="logo"
            control={control}
            label="Logo"
            disableAutoUppercase
            placeholder="Ej: https://cdn.demo.com/logo.png"
            size="small"
            onChange={(e) => {
              setPayload({
                ...payload,
                logo: e.target.value,
              });
            }}
          />
        </div>
        <div className="md:col-span-2 rounded-md border border-slate-200 p-3">
          <div className="mb-2 text-sm font-medium text-slate-700">
            Imagen (logo)
          </div>
          {imagePreview ? (
            <div className="mb-3 h-36 w-full overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              <img
                src={imagePreview}
                alt="Logo del canal"
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            <Upload className="h-4 w-4" />
            Seleccionar imagen
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <TextControlled<CanalVentaDialogValues>
          name="clasificacion"
          control={control}
          label="Clasificación"
          placeholder="Ej: A"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, clasificacion: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="categoria"
          control={control}
          label="Categoría"
          placeholder="Ej: PREMIUM"
          size="small"
          onChange={(e) => {
            setPayload({ ...payload, categoria: e.target.value });
          }}
        />

        <TextControlled<CanalVentaDialogValues>
          name="fechaLimiteCredito"
          control={control}
          label="Limite credito (dias)"
          size="small"
          type="number"
          inputProps={{ min: 0, step: "1" }}
          onChange={(e) => {
            setPayload({ ...payload, fechaLimiteCredito: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <AutocompleteControlled<CanalVentaDialogValues, string>
            name="productoId"
            control={control}
            label="Producto"
            size="small"
            options={productIds}
            getOptionLabel={(option) => productLabelsById.get(option) ?? option}
            isOptionEqualToValue={(option, value) => option === value}
            noOptionsText="No hay productos"
            onValueChange={(value) => {
              setPayload({
                ...payload,
                productoId: value ?? "",
              });
            }}
          />
        </div>
        {selectedProductId ? (
          <>
            <TextControlled<CanalVentaDialogValues>
              name="precioDolares"
              control={control}
              label="Precio Dolares"
              size="small"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              onChange={(e) => {
                setPayload({ ...payload, precioDolares: e.target.value });
              }}
            />
            <TextControlled<CanalVentaDialogValues>
              name="precioSoles"
              control={control}
              label="Precio Soles"
              size="small"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              onChange={(e) => {
                setPayload({ ...payload, precioSoles: e.target.value });
              }}
            />
            <div className="md:col-span-2 rounded-md border border-slate-200">
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
                Precios configurados para este producto
              </div>
              {isLoadingProductPrices ? (
                <p className="px-3 py-3 text-sm text-slate-500">Cargando...</p>
              ) : productPrices.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="px-3 py-2 text-left font-medium">
                          Auxiliar
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Precio Dolares
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Precio Soles
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productPrices.map((row) => (
                        <tr
                          key={`${row.idAuxiliar}-${row.precioDolares}-${row.precioSoles}`}
                          className="border-t border-slate-100"
                        >
                          <td className="px-3 py-2">{row.idAuxiliar}</td>
                          <td className="px-3 py-2">{row.precioDolares}</td>
                          <td className="px-3 py-2">{row.precioSoles}</td>
                          <td className="px-3 py-2">{row.estado ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-3 py-3 text-sm text-slate-500">
                  No hay precios registrados para este producto.
                </p>
              )}
            </div>
          </>
        ) : null}
        <TextControlled<CanalVentaDialogValues>
          name="fechaAniversario"
          control={control}
          label="Fecha aniversario"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => {
            setPayload({ ...payload, fechaAniversario: e.target.value });
          }}
        />
        <TextControlled<CanalVentaDialogValues>
          name="fechaNacimiento"
          control={control}
          label="Fecha nacimiento"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => {
            setPayload({ ...payload, fechaNacimiento: e.target.value });
          }}
        />
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="representanteLegal"
            control={control}
            label="Representante legal"
            placeholder="Ej: JUAN PEREZ"
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, representanteLegal: e.target.value });
            }}
          />
        </div>
        <div className="md:col-span-2">
          <Controller
            name="permiteLiquidacionCredito"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={(_, checked) => {
                      field.onChange(checked);
                      setPayload({
                        ...payload,
                        permiteLiquidacionCredito: checked,
                      });
                    }}
                    size="small"
                  />
                }
                label="Permite liquidación crédito"
                sx={{
                  margin: 0,
                  ".MuiFormControlLabel-label": {
                    fontSize: "0.9rem",
                  },
                }}
              />
            )}
          />
        </div>
        <div className="md:col-span-2">
          <TextControlled<CanalVentaDialogValues>
            name="nota"
            control={control}
            label="Nota"
            placeholder="Comentarios adicionales"
            multiline
            rows={3}
            size="small"
            onChange={(e) => {
              setPayload({ ...payload, nota: e.target.value });
            }}
          />
        </div>
      </div>
    </form>
  );
};

const parseCanalId = (value?: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveSalesChannelId = (channel?: Partial<SalesChannelDetail>) => {
  const parsed = Number(
    channel?.idAuxiliar ?? channel?.idCanal ?? channel?.id ?? 0,
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildPayload = (
  values: Partial<CanalVentaDialogValues> & { imageFile?: File | null },
  idAuxiliar: number,
): SaveSalesChannelPayload => ({
  idAuxiliar,
  auxiliar: String(values.label ?? "").trim(),
  ruc: String(values.ruc ?? "").trim(),
  razonSocial: String(values.razonSocial ?? "").trim(),
  direccion: String(values.direccion ?? "").trim(),
  region: String(values.region ?? "").trim(),
  telefono: String(values.telefono ?? "").trim(),
  celular: String(values.celular ?? "").trim(),
  contacto: String(values.contacto ?? "").trim(),
  contacto02: String(values.contacto02 ?? "").trim(),
  email: String(values.email ?? "").trim(),
  webSite: String(values.webSite ?? "").trim(),
  clasificacion: String(values.clasificacion ?? "").trim(),
  categoria: String(values.categoria ?? "").trim(),
  fechaAniversario: String(values.fechaAniversario ?? "").trim(),
  representanteLegal: String(values.representanteLegal ?? "").trim(),
  fechaNacimiento: String(values.fechaNacimiento ?? "").trim(),
  nota: String(values.nota ?? "").trim(),
  permiteLiquidacionCredito: Boolean(values.permiteLiquidacionCredito),
  logo: String(values.logo ?? "").trim(),
  limiteCredito: parsePriceValue(values.limiteCredito),
  fechaLimiteCredito: parseCreditDaysValue(values.fechaLimiteCredito),
  imageFile: values.imageFile instanceof File ? values.imageFile : null,
  // Compatibilidad con backend legacy mientras migra el contrato.
  PermiteLiquidacionCredito: Boolean(values.permiteLiquidacionCredito),
});

const SalesChannelPage = () => {
  const {
    channels,
    isLoading,
    error,
    refresh,
    saveChannel,
    deleteChannel,
    saveAuxiliarProductPrice,
    getAuxiliarProductPrice,
    getAuxiliarProductPrices,
  } = useSalesChannels();
  const openDialog = useDialogStore((state) => state.openDialog);
  const resolveAccess = useMaintenanceAccessResolver();
  const access = resolveAccess("maintenance.sales_channel");
  const fetchAuxiliarProductPriceForDialog = useCallback(
    async (idProducto: number, idAuxiliar: number) => {
      const current = await getAuxiliarProductPrice(idProducto, idAuxiliar);
      if (!current) return null;
      return {
        precioDolares: Number(current.precioDolares || 0),
        precioSoles: Number(current.precioSoles || 0),
      };
    },
    [getAuxiliarProductPrice],
  );
  const fetchAuxiliarProductPricesForDialog = useCallback(
    async (idProducto: number) => {
      const prices = await getAuxiliarProductPrices(idProducto);
      return prices.map((item) => ({
        idAuxiliar: Number(item.idAuxiliar || 0),
        precioDolares: Number(item.precioDolares || 0),
        precioSoles: Number(item.precioSoles || 0),
        estado: item.estado,
      }));
    },
    [getAuxiliarProductPrices],
  );

  const openDeleteSalesChannelDialog = useCallback(
    (channel?: SalesChannelDetail) => {
      if (!access.delete) return;
      const id = resolveSalesChannelId(channel);
      if (!id) {
        showToast({
          title: "Atencion",
          description: "No se pudo determinar el canal a eliminar.",
          type: "warning",
        });
        return;
      }

      openDialog({
        title: "Autorizacion de eliminacion",
        description:
          "Confirma la eliminacion del canal. Esta accion no se puede deshacer.",
        size: "sm",
        confirmLabel: "Autorizar y eliminar",
        cancelLabel: "Cancelar",
        content: () => (
          <p className="text-sm text-slate-700">
            ¿Deseas eliminar el canal{" "}
            <span className="font-semibold">{channel?.canalNombre ?? "-"}</span>
            ?
          </p>
        ),
        onConfirm: async () => {
          try {
            await deleteChannel(id);
            await refresh();
            queueServiciosRefresh();
            showToast({
              title: "Exito",
              description: "Canal eliminado correctamente.",
              type: "success",
            });
            return true;
          } catch (deleteError) {
            const message =
              deleteError instanceof Error
                ? deleteError.message
                : "No se pudo eliminar el canal de venta.";

            showToast({
              title: "Error",
              description: message,
              type: "error",
            });
            return false;
          }
        },
      });
    },
    [access.delete, deleteChannel, openDialog, refresh],
  );

  const openSalesChannelModal = useCallback(
    (mode: "create" | "edit", channel?: SalesChannelDetail) => {
      if (mode === "create" && !access.create) return;
      if (mode === "edit" && !access.edit) return;
      const editingValue =
        mode === "edit"
          ? String(channel?.idAuxiliar ?? channel?.idCanal ?? "")
          : "";

      openDialog({
        title:
          mode === "create" ? "Crear canal de venta" : "Editar canal de venta",
        description:
          mode === "create"
            ? "Crea un canal de venta sin salir del formulario."
            : "Actualiza los datos del canal de venta.",
        size: "md",
        initialPayload: {
          ruc: channel?.ruc ?? "",
          razonSocial: channel?.razonSocial ?? "",
          label: channel?.canalNombre ?? "",
          direccion: channel?.direccion ?? "",
          region: channel?.region ?? "",
          value: editingValue,
          contacto: channel?.contacto ?? "",
          contacto02: channel?.contacto02 ?? "",
          telefono: channel?.telefono ?? "",
          celular: channel?.celular ?? "",
          email: channel?.email ?? "",
          webSite: channel?.webSite ?? "",
          logo: channel?.logo ?? "",
          limiteCredito:
            channel?.limiteCredito !== undefined
              ? String(channel.limiteCredito)
              : "",
          clasificacion: channel?.clasificacion ?? "",
          categoria: channel?.categoria ?? "",
          fechaLimiteCredito:
            channel?.fechaLimiteCredito !== undefined
              ? String(channel.fechaLimiteCredito)
              : "",
          fechaAniversario: channel?.fechaAniversario ?? "",
          representanteLegal: channel?.representanteLegal ?? "",
          fechaNacimiento: channel?.fechaNacimiento ?? "",
          nota: channel?.nota ?? "",
          permiteLiquidacionCredito: Boolean(
            channel?.permiteLiquidacionCredito ??
            channel?.PermiteLiquidacionCredito,
          ),
          productoId: "",
          precioDolares: "",
          precioSoles: "",
          imageFile: null,
          imagePreview: channel?.logo ?? "",
          search: "",
          editingValue,
        },
        confirmLabel: "Guardar canal",
        cancelLabel: "Cancelar",
        dangerLabel:
          mode === "edit" && access.delete ? "Eliminar canal" : undefined,
        content: ({ payload, setPayload }) => (
          <CanalVentaDialogForm
            payload={payload as CanalVentaDialogPayload}
            setPayload={setPayload}
            fetchAuxiliarProductPrice={fetchAuxiliarProductPriceForDialog}
            fetchAuxiliarProductPrices={fetchAuxiliarProductPricesForDialog}
          />
        ),
        onDanger:
          mode === "edit" && access.delete
            ? async () => {
                openDeleteSalesChannelDialog(channel);
                return false;
              }
            : undefined,
        onConfirm: async (data) => {
          const ruc = String(data.ruc ?? "").trim();
          const razonSocial = String(data.razonSocial ?? "").trim();
          const label = String(data.label ?? "").trim();
          const direccion = String(data.direccion ?? "").trim();
          const region = String(data.region ?? "").trim();
          const contacto = String(data.contacto ?? "").trim();
          const contacto02 = String(data.contacto02 ?? "").trim();
          const telefono = String(data.telefono ?? "").trim();
          const celular = String(data.celular ?? "").trim();
          const email = String(data.email ?? "").trim();
          const webSite = String(data.webSite ?? "").trim();
          const logo = String(data.logo ?? "").trim();
          const limiteCredito = String(data.limiteCredito ?? "").trim();
          const clasificacion = String(data.clasificacion ?? "").trim();
          const categoria = String(data.categoria ?? "").trim();
          const fechaLimiteCredito = String(
            data.fechaLimiteCredito ?? "",
          ).trim();
          const fechaAniversario = String(data.fechaAniversario ?? "").trim();
          const representanteLegal = String(
            data.representanteLegal ?? "",
          ).trim();
          const fechaNacimiento = String(data.fechaNacimiento ?? "").trim();
          const nota = String(data.nota ?? "").trim();
          const permiteLiquidacionCredito = Boolean(
            data.permiteLiquidacionCredito,
          );
          const productoId = parseCanalId(String(data.productoId ?? ""));
          const precioDolares = parsePriceValue(data.precioDolares);
          const precioSoles = parsePriceValue(data.precioSoles);
          const idAuxiliar = parseCanalId(
            String(data.editingValue ?? editingValue),
          );

          if (!label) {
            showToast({
              title: "Atencion",
              description: "Ingresa el nombre del canal de venta.",
              type: "warning",
            });
            throw new Error("Nombre de canal de venta requerido");
          }

          if (!contacto) {
            showToast({
              title: "Atencion",
              description: "Ingresa el contacto del canal de venta.",
              type: "warning",
            });
            throw new Error("Contacto de canal de venta requerido");
          }

          if (!telefono) {
            showToast({
              title: "Atencion",
              description: "Ingresa el telefono del canal de venta.",
              type: "warning",
            });
            throw new Error("Telefono de canal de venta requerido");
          }

          if (email && !emailRegex.test(email)) {
            showToast({
              title: "Atencion",
              description:
                "Si ingresas correo, debe tener un formato valido con @ y .com",
              type: "warning",
            });
            throw new Error("Formato de email invalido");
          }

          try {
            const payload = buildPayload(
              {
                ruc,
                razonSocial,
                label,
                direccion,
                region,
                contacto,
                contacto02,
                telefono,
                celular,
                email,
                webSite,
                logo,
                limiteCredito,
                clasificacion,
                categoria,
                fechaLimiteCredito,
                fechaAniversario,
                representanteLegal,
                fechaNacimiento,
                nota,
                permiteLiquidacionCredito,
                imageFile:
                  data.imageFile instanceof File ? data.imageFile : null,
              },
              idAuxiliar,
            );
            const savedId = await saveChannel(payload);

            if (productoId > 0) {
              const priceSaved = await saveAuxiliarProductPrice({
                idProducto: productoId,
                idAuxiliar: savedId,
                precioDolares,
                precioSoles,
                estado: "A",
              });

              if (!priceSaved) {
                throw new Error(
                  "No se pudo guardar el precio del producto para este canal.",
                );
              }
            }

            await refresh();
            queueServiciosRefresh();

            showToast({
              title: "Exito",
              description: `Canal guardado correctamente (ID ${savedId}).`,
              type: "success",
            });
            return true;
          } catch (saveError) {
            const message =
              saveError instanceof Error
                ? saveError.message
                : "No se pudo guardar el canal de venta.";

            showToast({
              title: "Error",
              description: message,
              type: "error",
            });
            throw saveError;
          }
        },
      });
    },
    [
      access.create,
      access.delete,
      access.edit,
      openDeleteSalesChannelDialog,
      openDialog,
      refresh,
      fetchAuxiliarProductPriceForDialog,
      fetchAuxiliarProductPricesForDialog,
      getAuxiliarProductPrice,
      getAuxiliarProductPrices,
      saveAuxiliarProductPrice,
      saveChannel,
    ],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<SalesChannelDetail>();

    return [
      columnHelper.accessor("canalNombre", {
        header: "Canal",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("ruc", {
        header: "RUC",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("region", {
        header: "Región",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("contacto", {
        header: "Contacto",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("contacto02", {
        header: "Contacto 2",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("telefono", {
        header: "Telefono",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("celular", {
        header: "Celular",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("PermiteLiquidacionCredito", {
        header: "Crédito",
        cell: (info) => (info.getValue() ? "Sí" : "No"),
      }),
      columnHelper.display({
        id: "acciones",
        header: "Acciones",
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={!access.edit}
              onClick={(event) => {
                event.stopPropagation();
                openSalesChannelModal("edit", row.original);
              }}
              className="text-blue-600 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!access.delete}
              onClick={(event) => {
                event.stopPropagation();
                openDeleteSalesChannelDialog(row.original);
              }}
              className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-40"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ];
  }, [
    access.delete,
    access.edit,
    openDeleteSalesChannelDialog,
    openSalesChannelModal,
  ]);

  return (
    <MaintenancePageFrame
      title="Canal de venta"
      description="Registra y actualiza canales de venta para los viajes."
    >
      {error ? (
        <p className="px-1 pb-2 text-sm text-red-600">
          No se pudo cargar el listado: {error.message}
        </p>
      ) : null}

      <DndTable
        columns={columns}
        data={channels}
        isLoading={isLoading}
        enableDateFilter={false}
        emptyMessage="No hay canales cargados"
        onRowClick={(row) => openSalesChannelModal("edit", row)}
        headerAction={
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8612A] text-white shadow-sm transition-colors hover:bg-[#d55320]"
            disabled={!access.create}
            onClick={() => openSalesChannelModal("create")}
            title="Crear canal de venta"
            aria-label="Crear canal de venta"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />
    </MaintenancePageFrame>
  );
};

export default SalesChannelPage;
