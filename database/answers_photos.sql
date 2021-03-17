\c qa_db;

CREATE TABLE answers_photos (
  id SERIAL PRIMARY KEY,
  answers_id INT NOT NULL REFERENCES answers(id),
  "url" TEXT,
  FOREIGN KEY (answers_id) REFERENCES answers(id)
);

COPY answers_photos(id, answers_id, "url")
FROM '/home/aaron_fink/work/sdc-qa-api/data/answers_photos.csv'
DELIMITER ','
CSV HEADER;