import type { CanalOption, SelectOption } from "../hooks/canalUtils";


type FormValues = any; // We can improve this type if we export it from the page or define a shared type

interface BuildPayloadParams {
  values: FormValues;
  user: any;
  pkg: any;
  id: string | undefined;
  partidas: { value: string; label: string }[] | undefined;
  hoteles: { value: string; label: string }[] | undefined;
  almuerzos: { value: string; label: string }[] | undefined;
  actividades: { value: string; label: string }[] | undefined;
  trasladosOptions: { value: string; label: string }[] | undefined;
  tarifaRows: any[];
  tarifaTotal: number;
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLabelByValue = (
  options: { value: string; label: string }[] | undefined,
  value: unknown
) => {
  const key = String(value ?? "").trim();
  if (!key || key === "-") return "";
  const found = options?.find((opt) => opt.value === key);
  return found?.label ?? key;
};

const extractOptionValue = (option?: SelectOption | CanalOption | null) =>
  typeof option === "string" ? option : option?.value ?? "";

const buildDetalle = ({
  values,
  tarifaRows,
  almuerzos,
  actividades,
  trasladosOptions,
}: {
  values: FormValues;
  tarifaRows: any[];
  almuerzos: any[];
  actividades: any[];
  trasladosOptions: any[];
}) => {
  const resolveActividad = (rowId: string) => {
    if (rowId === "tarifaTour") {
      return getLabelByValue(almuerzos, values.tarifaTour);
    }
    if (rowId === "actividad1") {
      return getLabelByValue(actividades, values.actividad1);
    }
    if (rowId === "actividad2") {
      return getLabelByValue(actividades, values.actividad2);
    }
    if (rowId === "actividad3") {
      return getLabelByValue(actividades, values.actividad3);
    }
    if (rowId === "traslados") {
      return getLabelByValue(trasladosOptions, values.traslados);
    }
    if (rowId === "entradas") {
      return String(values.entradas ?? "").trim();
    }
    return "";
  };

  return tarifaRows
    .map((row) => {
      const actividad = resolveActividad(row.id);
      const cantidadRow = toNumber(row.cantidad);
      const precioRow = toNumber(row.precioUnit);
      if (!actividad || cantidadRow <= 0) return null;
      return {
        actividad,
        precio: precioRow,
        cantidad: cantidadRow,
        importe: Number((precioRow * cantidadRow).toFixed(2)),
      };
    })
    .filter(Boolean);
};

export const buildOrdenPayload = ({
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
}: BuildPayloadParams) => {
  const subtotal = tarifaTotal;
  const adicional =
    toNumber(values.cargosExtras) + toNumber(values.cobroExtraSol);
  const igv = toNumber(values.impuesto);
  const total = subtotal + igv + adicional;
  const acuentaValue = toNumber(values.acuenta);
  const saldo = total - acuentaValue;
  const notaEstado = saldo <= 0 ? "PAGADO" : "PENDIENTE";
  const canal = values.canalVenta ?? null;
  const puntoPartidaLabel = getLabelByValue(partidas, values.puntoPartida);
  const hotelLabel = getLabelByValue(hoteles, values.hotel);
  const incluyeAlmuerzo =
    String(values.tarifaTour ?? "").trim() &&
    String(values.tarifaTour ?? "").trim() !== "-"
      ? "SI"
      : "NO";

  return {
    orden: {
      notaDocu: values.documentoTipo ?? "",
      clienteId: toNumber(values.documentoNumero),
      notaUsuario: user?.username ?? user?.displayName ?? "",
      notaFormaPago: values.medioPago ?? "",
      notaCondicion: extractOptionValue(values.condicion),
      notaTelefono: values.telefono || values.celular || "",

      notaSubtotal: subtotal,
      notaTotal: total,
      notaAcuenta: acuentaValue,
      notaSaldo: saldo,
      notaAdicional: adicional,
      notaPagar: total,

      notaEstado,
      companiaId: toNumber(user?.companyId),
      incluyeIGV: igv > 0 ? "SI" : "NO",
      serie: "0001",
      numero: values.documentoNumero ?? "",
      notaGanancia: 0,

      usuarioId: toNumber(user?.id ?? user?.personalId),
      entidadBancaria: values.entidadBancaria ?? "",
      nroOperacion: values.nroOperacion ?? "",

      efectivo: values.medioPago === "EFECTIVO" ? total : 0,
      deposito: toNumber(values.deposito),

      idProducto: Number(id ?? 0),
      auxiliar: (canal as CanalOption | null)?.contacto ?? "",
      telefonoAuxiliar: (canal as CanalOption | null)?.telefono ?? "",
      cantidadPax: toNumber(values.cantPax),

      puntoPartida: puntoPartidaLabel || values.puntoPartida || "",
      horaPartida: values.horaPresentacion ?? "",
      otrasPartidas: values.otrosPartidas ?? "-",
      visitasExCur: values.visitas ?? "-",

      cobroExtraSol: toNumber(values.cobroExtraSol),
      cobroExtraDol: toNumber(values.cobroExtraDol),
      fechaAdelanto: values.fechaPago ?? "",

      mensajePasajero: values.notas ?? "-",
      observaciones: values.notas ?? "-",

      islas: "NO",
      tubulares: "NO",
      otros: "NO",

      fechaViaje: values.fechaViaje,
      igv,
      incluyeCargos: adicional > 0 ? "SI" : "NO",
      monedas: values.moneda ?? "",
      incluyeAlmuerzo,

      notaImagen: "-",
      hotel: hotelLabel || values.hotel || "",
      region: pkg?.region ?? "",
    },
    detalle: buildDetalle({
      values,
      tarifaRows,
      almuerzos: almuerzos || [],
      actividades: actividades || [],
      trasladosOptions: trasladosOptions || [],
    }),
  };
};
