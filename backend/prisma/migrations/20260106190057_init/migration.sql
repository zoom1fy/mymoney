/*
  Warnings:

  - You are about to alter the column `transaction_date` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `transactions` MODIFY `transaction_date` DATETIME NOT NULL;
