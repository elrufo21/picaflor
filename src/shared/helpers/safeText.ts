const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decodeHtmlEntities = (input: string): string => {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    const normalizedEntity = String(entity);

    if (normalizedEntity.startsWith("#")) {
      const isHex =
        normalizedEntity[1]?.toLowerCase() === "x" &&
        normalizedEntity.length > 2;
      const rawCodePoint = isHex
        ? normalizedEntity.slice(2)
        : normalizedEntity.slice(1);
      const codePoint = Number.parseInt(rawCodePoint, isHex ? 16 : 10);

      if (!Number.isFinite(codePoint) || codePoint < 0) return match;

      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    }

    const named = NAMED_HTML_ENTITIES[normalizedEntity.toLowerCase()];
    return named ?? match;
  });
};

export const toPlainText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return decodeHtmlEntities(String(value));
};
