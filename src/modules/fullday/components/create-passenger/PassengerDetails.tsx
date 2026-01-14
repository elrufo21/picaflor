import { useEffect, useRef } from "react";
import { TextControlled } from "@/components/ui/inputs";
import Divider from "@mui/material/Divider";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { API_BASE_URL } from "@/config";
import { showToast } from "@/components/ui/AppToast";

interface PassengerDetailsProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  disponibles?: number;
}

type ClientLookupResponse = {
  clienteId?: number;
  clienteRazon?: string;
  clienteRuc?: string;
  clienteDni?: string;
  clienteDireccion?: string;
  clienteMovil?: string;
  clienteTelefono?: string;
  clienteCorreo?: string;
  clienteEstado?: string;
  clienteDespacho?: string;
  clienteUsuario?: string;
  clienteFecha?: string;
  companiaId?: number;
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

export const PassengerDetails = ({
  control,
  setValue,
  disponibles,
}: PassengerDetailsProps) => {
  const documentoNumero = useWatch({ control, name: "documentoNumero" });
  const lastRequestedRef = useRef<string>("");

  useEffect(() => {
    const dni = normalizeText(documentoNumero);
    if (!dni) return;

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      if (dni === lastRequestedRef.current) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/Cliente/buscaDni?dni=${encodeURIComponent(dni)}`,
          {
            method: "GET",
            headers: { accept: "text/plain" },
            signal: controller.signal,
          }
        );
        if (!response.ok) return;
        const text = await response.text();
        if (!text) return;
        let data: ClientLookupResponse | null = null;
        try {
          data = JSON.parse(text) as ClientLookupResponse;
        } catch {
          data = null;
        }
        if (!data || controller.signal.aborted) return;
        if (data.clienteDni && normalizeText(data.clienteDni) !== dni) {
          return;
        }

        lastRequestedRef.current = dni;
        const nombre = normalizeText(data.clienteRazon);
        if (nombre) {
          setValue("nombreCompleto", nombre, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        const telefono = normalizeText(data.clienteTelefono);
        const movil = normalizeText(data.clienteMovil);
        if (movil || telefono) {
          setValue("celular", movil || telefono, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        if (telefono || movil) {
          setValue("telefono", telefono || movil, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        const correo = normalizeText(data.clienteCorreo);
        if (correo) {
          setValue("email", correo, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        console.error("Error buscando DNI", error);
      }
    }, 3000);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [documentoNumero, setValue]);

  const cantPax = useWatch({ control, name: "cantPax" });
  useEffect(() => {
    if (disponibles == null) return;
    const next = Number(cantPax) || 0;
    if (next <= disponibles) return;
    showToast({
      title: "Disponibilidad limitada",
      description: `Solo quedan ${disponibles} espacio${disponibles === 1 ? "" : "s"} disponibles.`,
      type: "warning",
    });
    setValue("cantPax", disponibles, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [cantPax, disponibles, setValue]);

  return (
    <>
      <div className="rounded-2xl border border-slate-100 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Contacto y actividades del pax
          </h2>
          <span className="text-xs text-slate-500">
            Datos mínimos para reservar
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-11 gap-2">
          <div className="col-span-4">
            <TextControlled
              name="nombreCompleto"
              control={control}
              label="Nombre completo"
              transform={(value) => value.toUpperCase()}
              required
              size="small"
            />
          </div>
          <div className="col-span-3">
            <TextControlled
              name="documentoNumero"
              control={control}
              label="Número de documento"
              transform={(value) => value.toUpperCase()}
              required
              size="small"
            />
          </div>
          <div className="col-span-3">
            <TextControlled
              name="celular"
              control={control}
              label="Celular Pax"
              transform={(value) => value.toUpperCase()}
              required
              size="small"
            />
          </div>
          <div>
            <TextControlled
              name="cantPax"
              control={control}
              label="Cant"
              type="number"
              required
              size="small"
              displayZeroAsEmpty
              sx={{
                "& input": {
                  textAlign: "center",
                },
              }}
            />
          </div>
        </div>
      </div>
      <Divider />
    </>
  );
};
