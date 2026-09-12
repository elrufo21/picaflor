import { API_BASE_URL } from "@/config";
import { parseCanalPayload } from "@/modules/fullday/hooks/canalUtils";

export type BibleCalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  color: string;
  monitored: boolean;
  idioma: string;
  pax: string;
  noteId: string;
  productId: string;
  counterId: string;
  auxiliarId: string;
  clientId: string;
  transportId: string;
  guideId: string;
  observacion: string;
  estado: string;
};

export type BibleCalendarCatalogOption = { id: string; label: string };

export type BibleCalendarCatalogs = {
  products: BibleCalendarCatalogOption[];
  counters: BibleCalendarCatalogOption[];
  canales: BibleCalendarCatalogOption[];
  transportes: BibleCalendarCatalogOption[];
  guias: BibleCalendarCatalogOption[];
};

export type SaveBibleCalendarEvent = {
  id?: string;
  date: string;
  time: string;
  title: string;
  monitored: boolean;
  idioma: string;
  pax: string;
  noteId: string;
  productId: string;
  counterId: string;
  auxiliarId: string;
  clientId: string;
  transportId: string;
  guideId: string;
  observacion: string;
  estado: string;
  usuarioId?: number;
};

const endpoint = `${API_BASE_URL}/Programacion/biblia-calendario`;
const colors = ["bg-sky-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600"];

const sanitize = (value: string | number | undefined | null) =>
  String(value ?? "").replace(/[|¬]/g, " ").trim();

const parseResponse = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : parsed;
  } catch {
    return raw;
  }
};

const execute = async (valores: string) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valores }),
  });
  const raw = (await response.text()).trim();
  const parsed = parseResponse(raw);
  const data = typeof parsed === "string" ? parsed : raw;

  if (!response.ok || data.startsWith("ERROR|")) {
    throw new Error(data.replace(/^ERROR\|?/, "") || "No se pudo completar la operación.");
  }

  return data;
};

export const listBibleCalendarEvents = async (from: string, to: string): Promise<BibleCalendarEvent[]> => {
  const data = await execute(`LISTAR|${from}|${to}`);
  if (!data || data === "~") return [];

  return data.split("¬").flatMap((row, index) => {
    const fields = row.split("|");
    const id = fields[0]?.trim();
    const date = fields[1]?.trim();
    if (!id || !date) return [];

    return [{
      id,
      date,
      time: fields[2]?.trim() || "09:00",
      title: fields[3]?.trim() || fields[11]?.trim() || fields[8]?.trim() || "Actividad",
      color: colors[index % colors.length],
      monitored: fields[4]?.trim() === "1",
      counterId: fields[5]?.trim() || "",
      productId: fields[7]?.trim() || "",
      idioma: fields[9]?.trim() || "",
      pax: fields[10]?.trim() || "",
      clientId: fields[12]?.trim() || "",
      noteId: fields[14]?.trim() || "",
      auxiliarId: fields[15]?.trim() || "",
      transportId: fields[18]?.trim() || "",
      guideId: fields[20]?.trim() || "",
      observacion: fields[22]?.trim() || "",
      estado: fields[23]?.trim() || "ACTIVO",
    }];
  });
};

export const saveBibleCalendarEvent = async ({
  id, date, time, title, monitored, idioma, pax, noteId, productId, counterId, auxiliarId, clientId,
  transportId, guideId, observacion, estado, usuarioId,
}: SaveBibleCalendarEvent) => {
  const values = [
    "GUARDAR", id ?? "", date, time, title, monitored ? "1" : "0", idioma, pax, noteId, productId,
    counterId, auxiliarId, clientId, transportId, guideId, observacion, estado,
    usuarioId && usuarioId > 0 ? usuarioId : "",
  ].map(sanitize);
  return execute(values.join("|"));
};

export const deleteBibleCalendarEvent = async (id: string, usuarioId?: number) =>
  execute(`ELIMINAR|${sanitize(id)}|${usuarioId && usuarioId > 0 ? sanitize(usuarioId) : ""}`);

const loadCatalog = async (path: string) => {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { accept: "application/json, text/plain" } });
  if (!response.ok) throw new Error(`No se pudo cargar ${path}.`);
  return parseResponse(await response.text());
};

const asOption = (id: unknown, label: unknown): BibleCalendarCatalogOption | null => {
  const normalizedId = String(id ?? "").trim();
  const normalizedLabel = String(label ?? "").trim();
  return normalizedId && normalizedLabel ? { id: normalizedId, label: normalizedLabel } : null;
};

const asRows = (payload: unknown) => Array.isArray(payload) ? payload as Record<string, unknown>[] : [];

export const loadBibleCalendarCatalogs = async (): Promise<BibleCalendarCatalogs> => {
  const [products, counters, canales, transportes, guias] = await Promise.all([
    loadCatalog("/Productos/listaPro?companiaId=1").catch(() => []),
    loadCatalog("/UsuariosCrud/list?estado=ACTIVO").catch(() => []),
    loadCatalog("/Programacion/traerCanalVentaDetalle").catch(() => []),
    loadCatalog("/Transporte/list").catch(() => []),
    loadCatalog("/Guia/list").catch(() => []),
  ]);

  return {
    products: asRows(products).flatMap((row) => {
      const option = asOption(row.id ?? row.idProducto ?? row.IdProducto, row.descripcion ?? row.productoNombre ?? row.ProductoNombre);
      return option ? [option] : [];
    }),
    counters: asRows(counters).flatMap((row) => {
      const option = asOption(row.usuarioID ?? row.UsuarioID, row.usuarioAlias ?? row.UsuarioAlias ?? row.nombres ?? row.Nombres);
      return option ? [option] : [];
    }),
    canales: parseCanalPayload(canales).flatMap((item) => {
      const option = asOption(item.value, item.label);
      return option ? [option] : [];
    }),
    transportes: asRows(transportes).flatMap((row) => {
      const option = asOption(row.idTransporte ?? row.IdTransporte, row.nombreTransporte ?? row.NombreTransporte);
      return option ? [option] : [];
    }),
    guias: asRows(guias).flatMap((row) => {
      const option = asOption(row.idGuia ?? row.IdGuia, row.nombre ?? row.Nombre);
      return option ? [option] : [];
    }),
  };
};
