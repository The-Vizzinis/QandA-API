const db = require('../database/QAinstance');
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
  Gets all questions for a specific product

  PARAMETER     TYPE      DESCRIPTION
  product_id    integer   Specifies the product for which to retrieve questions.
  page          integer   Selects the page of results to return. Default 1.
  count	        integer	  Specifies how many results per page to return. Default 5.

  Will need to verify that each parameter being sent in is of the requested type.

  If product_id is not an integer return an error indicating that an invalid product_id type was sent.

  If page / count are sent with the incorrect type set them to their default and send a message back saying
  that they were sent with the wrong type.

  If no products exit with the requested product_id send back an empty array with the message no products.

  With valid page / count will need to figure out which ids correspond to the users request
*/
app.get('/qa/questions', ( req, res ) => {
  let { product_id, page, count } = req.query;

  let data = {product_id: product_id, results: []}

  if ( isNaN(product_id) ) {
    res.status(422);
    res.send('Error: Invalid data type for product_id');
    return;
  }

  const SQL_QUESTIONS = `
    SELECT json_agg(json_build_object(
      'question_id', id,
      'question_body', body,
      'question_date', date_written,
      'asker_name', asker_name,
      'question_helpfulness', helpful,
      'reported', reported
    )) AS results
    FROM questions
    WHERE product_id = $1 AND reported = false
  `;

  const SQL_ANSWERS = `
  SELECT json_agg(json_build_object(
    'question_id', id,
    'answers', (SELECT json_agg(json_build_object(
      'id', a.id,
      'body', a.body,
      'date', a.date_written,
      'answerer_name', a.answerer_name,
      'helpfulness', a.helpful,
      'photos', (
        SELECT json_agg(json_build_object(
          'id', id,
          'url', url
        ))
        FROM answers_photos
        WHERE answers_id = a.id
      )
    ))
    FROM answers a, questions q
    WHERE q.product_id = $1 AND a.question_id = q.id AND a.reported = false)
  )) AS question
  FROM questions q
  WHERE product_id = $1 AND reported = false
  `;

  if ( isNaN(page) ) { page = 1 }

  if ( isNaN(count) ) { count = 5 }

  db.query(SQL_QUESTIONS, [ product_id ])
  .then(resQ => {
    if (resQ.rows[0].results !== null) {
      db.query((SQL_ANSWERS), [product_id])
      .then(resA => {
        for (let i = 0; i < resQ.rows[0].results.length; i++) {
          resQ.rows[0].results[i].answers = {}
          for (let j = 0; j < resA.rows[0].question.length; j++) {
            if (resQ.rows[0].results[i].question_id === resA.rows[0].question[j].question_id) {
              for (let k = 0; k < resA.rows[0].question[j].answers.length; k++) {
                if (resA.rows[0].question[j].answers[k].photos = 'null') {
                  resA.rows[0].question[j].answers[k].photos = [];
                }
                resQ.rows[0].results[i].answers[resA.rows[0].question[j].answers[k].id] = resA.rows[0].question[j].answers[k]
              }
            }
          }
        }
        data.results = resQ.rows[0].results.slice(count * (page - 1), count * page);
        res.send(data);
      })
      .catch(err => {
        console.log(err)
        res.status(500);
      });
    } else {
      res.send(data);
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue requesting data.');
  });
});

//  get all answers for a specific question id
app.get('/qa/questions/:question_id/answers', ( req, res ) => {

  const { question_id } = req.params;

  let { page, count } = req.query;

  if ( isNaN(page) || page === undefined) { page = 1 }

  if ( isNaN(count) || count === undefined ) { count = 5 }

  const SQL_ANSWERS = `
  SELECT json_agg(json_build_object(
      'answer_id', id,
      'body', body,
      'date', date_written,
      'answerer_name', answerer_name,
      'helpfulness', helpful,
      'photos', (
        SELECT json_agg(json_build_object(
          'id', id,
          'url', url
        ))
        FROM answers_photos
        WHERE answers_id = a.id
      )
    )) AS results
  FROM answers a
  WHERE question_id = $1 AND reported = false
  `;

  db.query((SQL_ANSWERS), [question_id])
  .then(resA => {
    resA.rows[0].results.forEach(answer => {
      if (answer.photos === null) {
        answer.photos = [];
      }
    })
    resA.rows[0].results = resA.rows[0].results.slice(count * (page - 1), count * page);
    resA.rows[0].question = question_id;
    resA.rows[0].page = page;
    resA.rows[0].count = count;
    res.status(200);
    res.send(resA.rows[0]);
  })
  .catch(err => {
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue querying.')
  });
});

//  post a question to a product
app.post('/qa/questions', ( req, res ) => {

  const { product_id, body, name, email } = req.body;

  if ( isNaN(product_id) || product_id === undefined ) {
    res.status(422);
    res.send('Error: Invalid data type for product_id');
    return;
  }

  let date = new Date().toISOString();
  console.log(date);

  const SQL_QUESTION_INSERT = `
  INSERT INTO questions (product_id, body, date_written, asker_name, asker_email, reported, helpful) VALUES ($1, $2, '${date}', $3, $4, FALSE, 0)
  `;

  db.query(SQL_QUESTION_INSERT, [product_id, body, name, email])
  .then((resQ) => {
    console.log(resQ);
    res.status(201);
    res.send('CREATED');
  })
  .catch(err => {
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue querying.')
  });
});

//  post an answer to a question
app.post('/qa/questions/:question_id/answers', ( req, res ) => {

  const { question_id } = req.params;
  const { body, name, email, photos } = req.body;

  if ( isNaN(question_id) || question_id === undefined ) {
    res.status(422);
    res.send('Error: Invalid data type for question_id');
    return;
  }

  if ( !Array.isArray(photos) ) {
    res.status(422);
    res.send('Error: Invalid data type for photos');
    return;
  }

  let date = new Date().toISOString();

  const SQL_ANSWER_INSERT = `
  INSERT INTO answers (question_id, body, date_written, answerer_name, answerer_email, reported, helpful) VALUES ($1, $2, '${date}', $3, $4, FALSE, 0) RETURNING (id)
  `;
  db.query(SQL_ANSWER_INSERT, [question_id, body, name, email])
  .then((resAI) => {
    if ( photos.length !== 0) {
      const SQL_ANSWERS_PHOTOS_INSERT = `
      INSERT INTO answers_photos (answers_id, "url")
      VALUES ($1, $2)
      `;
      for (let i = 0; i < photos.length; i++) {
        db.query(SQL_ANSWERS_PHOTOS_INSERT, [resAI.rows[0].id, photos[i]])
        .then((resAI) => {
          res.status(201);
        })
        .catch(err => {
          console.log(err);
          res.status(500);
        });
      }
    } else {
      res.status(201);
    }
    res.send('CREATED');
  })
  .catch(err => {
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue querying.')
  });

});

//  increase the helpful count of a question by 1
app.put('/qa/questions/:question_id/helpful', ( req, res ) => {
  const { question_id } = req.params;

  if ( isNaN(question_id) || question_id === undefined ) {
    res.status(422);
    res.send('Error: Invalid data type for question_id');
    return;
  }

  const SQL_QUESTIONS_UPDATE = `
    UPDATE questions SET helpful = helpful + 1 WHERE id = $1
  `;

  console.log(question_id);

  db.query(SQL_QUESTIONS_UPDATE, [question_id])
  .then(() => res.status(204))
  .catch(err => {
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

//  make the report column of the question true
app.put('/qa/questions/:question_id/report', ( req, res ) => {
  const { question_id } = req.params;

  if ( isNaN(question_id) || question_id === undefined ) {
    res.status(422);
    res.send('Error: Invalid data type for question_id');
    return;
  }

  const SQL_QUESTIONS_UPDATE = `
    UPDATE questions SET reported = TRUE WHERE id = $1
  `;

  console.log(question_id);

  db.query(SQL_QUESTIONS_UPDATE, [question_id])
  .then(() => res.status(204))
  .catch(err => {
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

//  increase the helpful count of a question by 1
app.put('/qa/answers/:answer_id/helpful', ( req, res ) => {
  const { answer_id } = req.params;

  if ( isNaN(answer_id) || answer_id === undefined ) {
    res.status(422);
    res.send('Error: Invalid data type for answer_id');
    return;
  }

  const SQL_ANSWERS_UPDATE = `
    UPDATE answers SET helpful = helpful + 1 WHERE id = $1
  `;

  console.log(answer_id);

  db.query(SQL_ANSWERS_UPDATE, [answer_id])
  .then(() => res.status(204))
  .catch(err => {
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

//  make the report column of the question true
app.put('/qa/answers/:answer_id/report', ( req, res ) => {
  const { answer_id } = req.params;

  if ( isNaN(answer_id) || answer_id === undefined ) {
    res.status(422);
    res.send('Error: Invalid data type for answer_id');
    return;
  }

  const SQL_ANSWERS_UPDATE = `
    UPDATE answers SET reported = TRUE WHERE id = $1
  `;

  console.log(answer_id);

  db.query(SQL_ANSWERS_UPDATE, [answer_id])
  .then(() => res.status(204))
  .catch(err => {
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});