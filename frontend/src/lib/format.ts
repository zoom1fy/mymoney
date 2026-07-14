// Formats a number with Russian locale (space as thousand separator)
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {}).format(amount)
}
