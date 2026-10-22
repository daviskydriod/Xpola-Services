-- Run once against the Nigeria catalogue database. Review names/IDs before production execution.
UPDATE products SET name = 'iPhone 18 Pro Max' WHERE country='NG' AND LOWER(name) IN ('iphone 18 pro max','iphone 18 pro max');
UPDATE products SET name = '10-Inch Bolts' WHERE country='NG' AND LOWER(name) IN ('bolts - 10 inch','bolts 10 inch','10 inch bolts');
UPDATE products SET name = 'EcoFlow Solar Generator' WHERE country='NG' AND LOWER(name) IN ('ecoflow solar','eco flow solar');
-- Map the corrected products to the approved market categories when those categories exist.
UPDATE products p JOIN categories c ON c.country='NG' AND LOWER(c.name) IN ('power','power solutions') SET p.category_id=c.id WHERE LOWER(p.name) LIKE 'ecoflow solar%' AND p.country='NG';
UPDATE products p JOIN categories c ON c.country='NG' AND LOWER(c.name) IN ('automobile','home & office','home and office') SET p.category_id=c.id WHERE LOWER(p.name) LIKE '%bolts%' AND p.country='NG';
