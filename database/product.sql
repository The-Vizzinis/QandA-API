\c qa_db;

CREATE TABLE product (
  id SERIAL PRIMARY KEY,
  "name" TEXT,
  slogan TEXT,
  "description" TEXT,
  category TEXT,
  default_price TEXT
);

COPY product(id, "name", slogan, "description", category, default_price)
FROM '/home/aaron_fink/work/sdc-qa-api/data/product.csv'
DELIMITER ','
CSV HEADER;