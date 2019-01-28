ALTER TABLE `erp`.`tb_consumer`
  ADD COLUMN `birthday` DATETIME NULL ;
ALTER TABLE `erp`.`tb_product`
  ADD COLUMN `minStock` INT(10) UNSIGNED DEFAULT 0  NULL ;
