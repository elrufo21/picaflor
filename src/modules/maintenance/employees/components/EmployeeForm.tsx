import { useEffect, useMemo, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import { useForm } from "react-hook-form";
import { Camera, Plus, Save, Trash2, Upload, X } from "lucide-react";

import {
  DateInput,
  SelectControlled,
  TextControlled,
} from "@/components/ui/inputs";
import { focusFirstInput } from "@/shared/helpers/focusFirstInput";
import { useMaintenanceStore } from "@/store/maintenance/maintenance.store";
import type { Personal } from "@/types/employees";

type EmployeeFormProps = {
  initialData?: Partial<Personal>;
  mode: "create" | "edit";
  onSave: (
    data: Personal & { imageFile?: File | null; imageRemoved?: boolean }
  ) => void | Promise<void>;
  onNew?: () => void;
  onDelete?: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

const formatDateForInput = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.toString().trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
};

const buildDefaults = (data?: Partial<Personal>): Personal => ({
  personalId: data?.personalId ?? 0,
  personalNombres: data?.personalNombres ?? "",
  personalApellidos: data?.personalApellidos ?? "",
  areaId: data?.areaId ?? 0,
  personalCodigo: data?.personalCodigo ?? "",
  personalNacimiento:
    formatDateForInput(data?.personalNacimiento) || today(),
  personalIngreso: formatDateForInput(data?.personalIngreso),
  personalDni: data?.personalDni ?? "",
  personalDireccion: data?.personalDireccion ?? "",
  personalTelefono: data?.personalTelefono ?? "",
  personalTelefonoAsi: (data as any)?.personalTelefonoAsi ?? "",
  personalEmail: data?.personalEmail ?? "",
  personalEstado: data?.personalEstado ?? "ACTIVO",
  personalImagen: data?.personalImagen ?? "",
  companiaId: data?.companiaId ?? 1,
  personalBajaFecha: (data as any)?.personalBajaFecha ?? "",
  personalRuc: (data as any)?.personalRuc ?? "",
  personalLicencia: (data as any)?.personalLicencia ?? "",
  personalSueldo: (data as any)?.personalSueldo ?? null,
  gerencia: (data as any)?.gerencia ?? null,
});

const fallbackImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='20' font-family='Arial, sans-serif'>No image</text></svg>";

export default function EmployeeForm({
  initialData,
  mode,
  onSave,
  onNew,
  onDelete,
}: EmployeeFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const { areas, fetchAreas } = useMaintenanceStore();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);

  const areaOptions = useMemo(
    () =>
      areas.map((a) => ({
        value: a.id,
        label: a.area,
      })),
    [areas]
  );

  const defaults = useMemo(() => buildDefaults(initialData), [initialData]);

  const form = useForm<Personal>({
    defaultValues: defaults,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    reset(buildDefaults(initialData));
    focusFirstInput(formRef.current);
    setImageFile(null);
    setImageRemoved(false);
  }, [initialData, reset]);

  useEffect(
    () => () => {
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      stream?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  const watchedImagen = watch("personalImagen") ?? "";
  const watchedNacimiento = watch("personalNacimiento");

  const companyOptions = useMemo(() => {
    const base = [{ value: 1, label: "Compania 1" }];
    if (
      initialData?.companiaId &&
      !base.some((c) => Number(c.value) === Number(initialData.companiaId))
    ) {
      return [
        { value: Number(initialData.companiaId), label: `Compania ${initialData.companiaId}` },
        ...base,
      ];
    }
    return base;
  }, [initialData?.companiaId]);

  const calculateAge = (value?: string | null) => {
    if (!value) return "";
    const birth = new Date(value);
    if (Number.isNaN(birth.getTime())) return "";
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anios`;
  };

  const submit = async (values: Personal) => {
    const payload: Personal = {
      ...values,
      personalNombres: values.personalNombres?.toUpperCase() ?? "",
      personalApellidos: values.personalApellidos?.toUpperCase() ?? "",
      personalCodigo: values.personalCodigo?.toUpperCase() ?? "",
      areaId: Number(values.areaId) || 0,
      companiaId: Number(values.companiaId) || 1,
    };

    await onSave({ ...payload, imageFile, imageRemoved });
    if (mode === "create") {
      reset(buildDefaults());
      setImageFile(null);
      setImageRemoved(false);
      onNew?.();
      focusFirstInput(formRef.current);
    }
  };

  const handleNew = () => {
    reset(
      buildDefaults({
        personalEstado: "ACTIVO",
        companiaId: companyOptions[0]?.value ?? 1,
      })
    );
    setImageFile(null);
    setImageRemoved(false);
    onNew?.();
    focusFirstInput(formRef.current);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageRemoved(false);
    const previewUrl = URL.createObjectURL(file);
    setValue("personalImagen", previewUrl as any, { shouldDirty: true });
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTakingPhoto(false);
  };

  const startCamera = async () => {
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    setTakingPhoto(true);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] ?? "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], "captura.png", { type: mime });
      setImageFile(file);
      setImageRemoved(false);
      setValue("personalImagen", dataUrl as any, { shouldDirty: true });
    }
    stopCamera();
  };

  const removePhoto = () => {
    setImageFile(null);
    setImageRemoved(true);
    setValue("personalImagen", "" as any);
  };

  const openImageModal = () => {
    if (!watchedImagen || !watchedImagen.trim()) return;
    setModalImageSrc(watchedImagen);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setModalImageSrc(null);
  };

  const estadoOptions = [
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
  ];

  return (
    <div ref={formRef} className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit(submit)}>
          <div className="bg-[#B23636] text-white px-4 py-3 flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {mode === "create" ? "Registrar personal" : "Editar personal"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-70 transition-colors"
                title="Guardar"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar</span>
              </button>
              {mode !== "edit" && (
                <button
                  type="button"
                  onClick={handleNew}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                  title="Nuevo"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>
              )}
              {mode === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-red-600 hover:bg-red-700 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <SelectControlled
                    name="companiaId"
                    control={control}
                    label="Compania"
                    options={companyOptions}
                    size="small"
                    defaultValue={companyOptions[0]?.value ?? 1}
                  />
                </div>

                <TextControlled
                  name="personalCodigo"
                  control={control}
                  label="Codigo personal"
                  required
                  size="small"
                  inputProps={{ "data-focus-first": "true" }}
                />

                <SelectControlled
                  name="areaId"
                  control={control}
                  label="Area"
                  options={[
                    { value: 0, label: "Seleccione area" },
                    ...areaOptions,
                  ]}
                  size="small"
                  defaultValue={0}
                />

                <TextControlled
                  name="personalNombres"
                  control={control}
                  label="Nombres"
                  required
                  size="small"
                />

                <TextControlled
                  name="personalApellidos"
                  control={control}
                  label="Apellidos"
                  required
                  size="small"
                />

                <TextControlled
                  name="personalDni"
                  control={control}
                  label="DNI"
                  size="small"
                  inputProps={{ maxLength: 8 }}
                />

                <TextControlled
                  name="personalDireccion"
                  control={control}
                  label="Direccion"
                  size="small"
                />

                <DateInput
                  name="personalNacimiento"
                  control={control}
                  label="Fecha nacimiento"
                  size="small"
                />
                <TextField
                  label="Edad"
                  value={calculateAge(watchedNacimiento)}
                  size="small"
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextControlled
                  name="personalTelefono"
                  control={control}
                  label="Telefono"
                  size="small"
                />

                <TextControlled
                  name="personalEmail"
                  control={control}
                  label="Correo"
                  size="small"
                />

                <DateInput
                  name="personalIngreso"
                  control={control}
                  label="Fecha ingreso"
                  size="small"
                />

                <SelectControlled
                  name="personalEstado"
                  control={control}
                  label="Estado"
                  options={estadoOptions}
                  size="small"
                  disabled={mode === "create"}
                />
              </div>

              <div className="space-y-5">
                <h3 className="text-lg font-semibold">Foto del empleado</h3>

                <div className="relative w-full h-64 border rounded-lg overflow-hidden shadow-md">
                  <img
                    src={
                      watchedImagen && watchedImagen.trim() !== ""
                        ? watchedImagen
                        : fallbackImage
                    }
                    className={`w-full h-full object-cover ${
                      watchedImagen && watchedImagen.trim() !== ""
                        ? "cursor-zoom-in"
                        : ""
                    }`}
                    alt="Foto empleado"
                    onClick={openImageModal}
                  />
                  {watchedImagen && watchedImagen.trim() !== "" && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Upload className="w-5 h-5" />
                  Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {!takingPhoto ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Camera className="w-5 h-5" />
                    Tomar foto
                  </button>
                ) : (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      className="w-full h-64 bg-black rounded-lg"
                    ></video>
                    <button
                      type="button"
                      onClick={takePhoto}
                      className="w-full py-3 bg-green-600 text-white rounded-lg"
                    >
                      Capturar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {isImageModalOpen && modalImageSrc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={closeImageModal}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative max-w-4xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeImageModal}
                className="absolute top-3 right-3 text-white hover:text-gray-200"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="bg-black rounded-lg overflow-hidden">
                <img
                  src={modalImageSrc}
                  alt="Foto empleado ampliada"
                  className="w-full h-full max-h-[80vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
