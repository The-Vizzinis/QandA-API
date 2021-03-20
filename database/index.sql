\c qa_db;

CREATE INDEX questions_questions_product_id_index ON questions(product_id);

CREATE INDEX questions_reported_index ON questions(reported);

CREATE INDEX answers_question_id_index ON answers(question_id);

CREATE INDEX answers_reported_index ON answers(reported);

CREATE INDEX answers_photos_answers_id_index ON answers_photos(answers_id);

SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));

SELECT setval('questions_id_seq', (SELECT MAX(id) FROM questions));

SELECT setval('answers_id_seq', (SELECT MAX(id) FROM answers));

SELECT setval('answers_photos_id_seq', (SELECT MAX(id) FROM answers_photos));