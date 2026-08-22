export function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

export function formatSignedVnd(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${Math.abs(amount).toLocaleString("vi-VN")} ₫`;
}
