export function parseShortNumber(value) {
  if (typeof value === "number") return value;

  const lower = String(value).toLowerCase().trim().replace(/\s+/g, "");

  if (lower.endsWith("k")) {
    return parseFloat(lower.replace("k", "")) * 1_000;
  }

  if (lower.endsWith("m")) {
    return parseFloat(lower.replace("m", "")) * 1_000_000;
  }

  if (lower.endsWith("b")) {
    return parseFloat(lower.replace("b", "")) * 1_000_000_000;
  }

  return Number(lower.replace(/[^0-9.]/g, "")) || 0;
}

export const convertDecimalToPercentage = (decimal) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) return "";
  return `${(parseFloat(decimal) * 100).toFixed(2)}%`;
};

export function convertNumberToShortForm(value) {
  const num = Number(value);
  if (isNaN(num)) return value;

  if (num >= 1_000_000_000)
    return parseFloat((num / 1_000_000_000).toFixed(1)).toString() + "B";

  if (num >= 1_000_000)
    return parseFloat((num / 1_000_000).toFixed(1)).toString() + "M";

  if (num >= 1_000)
    return parseFloat((num / 1_000).toFixed(1)).toString() + "K";

  return num.toString();
}
