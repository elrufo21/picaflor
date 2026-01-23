export const formatCurrency = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "";
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", "."));
  if (Number.isFinite(parsed)) {
    return parsed.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return "";
};

export const roundCurrency = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return 0;
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", "."));
  if (Number.isFinite(parsed)) {
    return Number(parsed.toFixed(2));
  }
  return 0;
};
