export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "UGX 0";
  }

  return `UGX ${Math.round(amount).toLocaleString("en-UG")}`;
}

export function formatMoney(value: number | string | null | undefined) {
  return formatCurrency(value);
}

export function formatUGX(value: number | string | null | undefined) {
  return formatCurrency(value);
}

export function formatCompactCurrency(value: number | string | null | undefined) {
  return formatCurrency(value);
}