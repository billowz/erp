

-- update table

ALTER TABLE tb_product
    CHANGE price unitprice FLOAT UNSIGNED NOT NULL;

ALTER TABLE tb_sale_order
    ADD COLUMN orgTotalPrice FLOAT UNSIGNED NULL,
    ADD COLUMN totalPurchasePrice FLOAT UNSIGNED NULL,
    ADD COLUMN totalDiscountPrice FLOAT UNSIGNED NULL,
	ADD COLUMN profit FLOAT NULL,
    CHANGE price totalPrice FLOAT UNSIGNED NOT NULL;

ALTER TABLE tb_sale_order_item
	ADD COLUMN discount FLOAT UNSIGNED NULL,
	ADD COLUMN discountPrice FLOAT UNSIGNED NULL,
	ADD COLUMN totalPrice FLOAT UNSIGNED NULL,
	ADD COLUMN orgUnitPrice FLOAT UNSIGNED NULL,
    CHANGE price unitPrice FLOAT UNSIGNED NOT NULL;





-- check order item
select
	item.count,
	item.unitPrice,
	item.discount,

	item.totalPrice,
	item.unitPrice * item.count as NtotalPrice,

	item.orgUnitPrice,
	product.unitPrice as NorgUnitPrice,

	item.purchasePrice,
	product.purchasePrice as NpurchasePrice,

	item.discountPrice,
	case when product.unitPrice > item.unitPrice then
		(product.unitPrice - item.unitPrice) * item.count
	else
		0
	end as NdiscountPrice
from tb_sale_order_item AS item
	JOIN tb_product AS product ON item.fk_product = product.id;


-- update order item
UPDATE tb_sale_order_item AS item
	JOIN tb_product AS product ON item.fk_product = product.id
SET
    discount = 10,
	totalPrice = item.unitPrice * item.count,
    orgUnitPrice = product.unitPrice,
    discountPrice =
		case when product.unitPrice > item.unitPrice then
			(product.unitPrice - item.unitPrice) * item.count
		else
			0
		end;

-- check order
select
	ord.pay,

	ord.discountPrice,

	ord.profit,
	ROUND(ord.pay - sum(item.purchasePrice * item.count),2) as Nprofit,

	ord.totalPrice,
	ROUND(sum(item.totalPrice),2) as NtotalPrice,

	ord.orgTotalPrice,
	ROUND(sum(item.orgUnitPrice * item.count),2) as NorgTotalPrice,

	ord.totalPurchasePrice,
	ROUND(sum(item.purchasePrice * item.count),2) as NtotalPurchasePrice,

	ord.totalDiscountPrice,
	ROUND(sum(item.orgUnitPrice * item.count) - ord.pay,2) as NtotalDiscountPrice

	from tb_sale_order as ord
	join tb_sale_order_item as item on item.fk_order = ord.id
	group by ord.id


-- update order
UPDATE tb_sale_order AS ORD
SET totalPurchasePrice = (SELECT ROUND(SUM(purchasePrice * item.count),2) FROM tb_sale_order_item as item WHERE fk_order = ord.id),
	orgTotalPrice = (SELECT ROUND(SUM(orgUnitPrice * item.count ),2) FROM tb_sale_order_item as item WHERE fk_order = ord.id);

UPDATE tb_sale_order AS ORD
SET totalDiscountPrice = case when orgTotalPrice >= pay then ROUND(orgTotalPrice - pay) else 0 end,
	profit = pay - totalPurchasePrice;


-- update table
ALTER TABLE tb_sale_order
    CHANGE orgTotalPrice orgTotalPrice FLOAT UNSIGNED NOT NULL,
    CHANGE totalPurchasePrice totalPurchasePrice FLOAT UNSIGNED NOT NULL,
    CHANGE totalDiscountPrice totalDiscountPrice FLOAT UNSIGNED NOT NULL,
	CHANGE profit profit FLOAT NOT NULL,
	DROP COLUMN discount;

ALTER TABLE tb_sale_order_item
	CHANGE discount discount FLOAT UNSIGNED NOT NULL,
    CHANGE discountPrice discountPrice FLOAT UNSIGNED NOT NULL,
    CHANGE totalPrice totalPrice FLOAT UNSIGNED NOT NULL,
    CHANGE orgUnitPrice orgUnitPrice FLOAT UNSIGNED NOT NULL;
