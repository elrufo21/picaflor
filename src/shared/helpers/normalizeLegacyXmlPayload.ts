const LINE_BREAK_ENTITY_REGEX = /&#(?:x0*(?:0d|0a)|0*(?:13|10));/gi;
const CONTROL_CHARS_REGEX = /\p{Cc}/gu;
const XML_NAMED_ENTITY_REGEX = /&(amp|lt|gt);/gi;

const decodeXmlNamedEntities = (value: string) =>
  value.replace(XML_NAMED_ENTITY_REGEX, (_, entity: string) => {
    const key = entity.toLowerCase();
    if (key === "amp") return "&";
    if (key === "lt") return "<";
    if (key === "gt") return ">";
    return _;
  });

export const normalizeLegacyXmlPayload = (input: string): string => {
  if (!input) return "";

  let normalized = String(input);

  // Two passes handle double-escaped patterns like: &amp;#x0D;
  for (let i = 0; i < 2; i += 1) {
    const decoded = decodeXmlNamedEntities(normalized);
    if (decoded === normalized) break;
    normalized = decoded;
  }

  normalized = normalized.replace(LINE_BREAK_ENTITY_REGEX, " ");
  normalized = normalized.replace(/[\r\n]+/g, " ");
  normalized = normalized.replace(/\uFEFF/g, "");
  normalized = normalized.replace(CONTROL_CHARS_REGEX, "");

  return normalized;
};
