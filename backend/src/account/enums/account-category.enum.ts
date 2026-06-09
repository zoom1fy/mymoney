export enum AccountCategoryEnum {
  ACCOUNTS = 1, // 'Счета'
  SAVINGS = 2, // 'Накопительные'
}

export const AccountCategoryNameMap = {
  [AccountCategoryEnum.ACCOUNTS]: 'Счета',
  [AccountCategoryEnum.SAVINGS]: 'Накопительные',
};
