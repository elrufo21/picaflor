export type SelectOption = { value: string; label: string };
export type CanalOption = SelectOption & {
  contacto?: string;
  telefono?: string;
  email?: string;
  auxiliar?: string;
};
const cleanText = (value?: string) =>
  value
    ? value
        .replace(/&#x0D;/gi, "")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ")
        .trim()
    : undefined;

export const parseCanalPayload = (payload: unknown): CanalOption[] => {
  const parseBlock = (block: string) =>
    block
      .split("¬")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [id, value, contacto, email] = item
          .split("|")
          .map((part) => cleanText(part));
        if (!id && !value) return null;
        return {
          id: id ?? "",
          value: value ?? "",
          contacto: contacto || undefined,
          email: email || undefined,
        };
      })
      .filter(Boolean) as {
      id: string;
      value: string;
      contacto?: string;
      email?: string;
    }[];

  const normalizeRow = (value: string, idx: number): CanalOption | null => {
    if (!value) return null;
    const parts = value
      .split("|")
      .map((s) => cleanText(s))
      .filter(Boolean);

    if (parts.length >= 2) {
      const [id, nombre, contacto, telefono, email] = parts;
      const val = id || nombre || `CANAL_${idx + 1}`;
      return {
        value: String(val),
        label: String(nombre || val),
        contacto: contacto ?? undefined,
        telefono: telefono ?? undefined,
        email: email ?? undefined,
        auxiliar: nombre || undefined,
      };
    }
    const trimmed = value.trim();
    return trimmed ? { value: trimmed, label: trimmed } : null;
  };

  if (!payload) return [];

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return [];

    if (trimmed.includes("[") && trimmed.includes("¬")) {
      const [canalesBlock, telefonosBlock] = trimmed.split("[");
      const canales = parseBlock(canalesBlock ?? "");
      const telefonos = parseBlock(telefonosBlock ?? "");
      const telefonoById = new Map(
        telefonos
          .filter((item) => item.id && item.value)
          .map((item) => [item.id, item.value]),
      );

      return canales
        .map((canal, idx) => {
          const value = canal.id || canal.value || `CANAL_${idx + 1}`;
          const label = canal.value || canal.id || value;
          if (!label) return null;
          return {
            value: String(value),
            label: String(label),
            contacto: canal.contacto ?? undefined,
            telefono: telefonoById.get(canal.id) ?? undefined,
            email: canal.email ?? undefined,
            auxiliar: canal.value || undefined,
          } as CanalOption;
        })
        .filter(Boolean) as CanalOption[];
    }

    const rows = trimmed
      .split(/¬|\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean);
    return rows
      .map((r, i) => normalizeRow(r, i))
      .filter(Boolean) as CanalOption[];
  }

  if (Array.isArray(payload)) {
    return payload
      .map((it, i) => {
        if (typeof it === "string") return normalizeRow(it, i);
        if (it && typeof it === "object") {
          const o: any = it;
          const valueCandidate = cleanText(
            o.value ??
              o.IdCanal ??
              o.codigo ??
              o.code ??
              o.id ??
              o.Id ??
              o.slug ??
              o.CanalNombre ??
              o.nombre ??
              o.name,
          );

          const labelCandidate = cleanText(
            o.label ??
              o.descripcion ??
              o.descripcionCanal ??
              o.CanalNombre ??
              o.nombre ??
              o.name ??
              valueCandidate,
          );

          if (!valueCandidate && !labelCandidate) return null;
          return {
            value: String(valueCandidate ?? labelCandidate),
            label: String(labelCandidate ?? valueCandidate),
            contacto: cleanText(o.Contacto ?? o.contacto),
            telefono: cleanText(o.Telefono ?? o.telefono),
            email: cleanText(o.Email ?? o.email),

            auxiliar: o.auxiliar ?? undefined,
          } as CanalOption;
        }
        return null;
      })
      .filter(Boolean) as CanalOption[];
  }

  if (typeof payload === "object") {
    const d: any = (payload as any).data ?? payload;
    return parseCanalPayload(d);
  }

  return [];
};
