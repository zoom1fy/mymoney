export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {}).format(amount)
}
