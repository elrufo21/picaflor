import dayjs from "dayjs";

export type TransferDay = {
  fecha: string;
  destino: string;
  hotel: string;
  tipoUnidad: string;
  tipoTraslado: string;
  detalle: string;
  hora: string;
  precio: string;
};

export const buildTransferDays = (from: string, to: string, previous: TransferDay[]): TransferDay[] => {
  if (!from) return [];
  const start = dayjs(from);
  const end = dayjs(to || from);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return [];
  return Array.from({ length: end.diff(start, "day") + 1 }, (_, index) => {
    const fecha = start.add(index, "day").format("YYYY-MM-DD");
    return previous.find((day) => day.fecha === fecha) ?? {
      fecha, destino: "", hotel: "", tipoUnidad: "", tipoTraslado: "", detalle: "", hora: "09:00", precio: "",
    };
  });
};
