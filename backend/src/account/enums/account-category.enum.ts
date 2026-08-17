export enum AccountCategoryEnum {
  ACCOUNTS = 1,
  SAVINGS = 2,
  INVESTMENTS = 3,
  LOANS = 4,
}

export const accountCategoryNameMap = {
  [AccountCategoryEnum.ACCOUNTS]: 'Основные счета',
  [AccountCategoryEnum.SAVINGS]: 'Накопления',
  [AccountCategoryEnum.INVESTMENTS]: 'Инвестиции',
  [AccountCategoryEnum.LOANS]: 'Кредиты и долги',
};
