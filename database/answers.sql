\c qa_db;

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL,
  body TEXT NOT NULL,
  date_written TEXT,
  answerer_name TEXT NOT NULL,
  answerer_email TEXT NOT NULL,
  reported BOOLEAN,
  helpful INT,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

COPY answers(id, question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
FROM '/home/aaron_fink/work/sdc-qa-api/data/answers.csv'
DELIMITER ','
CSV HEADER;