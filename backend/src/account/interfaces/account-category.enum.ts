export enum AccountCategoryEnum {
  ACCOUNTS = 1,     // 'Счета'
  SAVINGS = 2       // 'Сбережения'
}

export const AccountCategoryNameMap = {
  [AccountCategoryEnum.ACCOUNTS]: 'Счета',
  [AccountCategoryEnum.SAVINGS]: 'Сбережения',
};
