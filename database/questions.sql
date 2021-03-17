\c qa_db;

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  product_id INT,
  body TEXT NOT NULL,
  date_written TEXT,
  asker_name TEXT NOT NULL,
  asker_email TEXT NOT NULL,
  reported BOOLEAN,
  helpful INT,
  FOREIGN KEY (product_id) REFERENCES product(id)
);

COPY questions(id, product_id, body, date_written, asker_name, asker_email, reported, helpful)
FROM '/home/aaron_fink/work/sdc-qa-api/data/questions.csv'
DELIMITER ','
CSV HEADER;