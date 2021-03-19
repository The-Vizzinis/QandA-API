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
    } else {
      res.send(data);
    }
  })
  .catch(err => console.log(err));
});

//  get all answers for a specific question id
app.get('/qa/questions/:question_id/answers', ( req, res ) => {
  res.status(200);
  res.send('Successfully received GET request for all answers');
});

//  post a question to a product
app.post('/qa/questions', ( req, res ) => {
  res.status(201);
  res.send('Successfully received POST request for question');
});

//  post an answer to a question
app.post('/qa/questions/:question_id/answers', ( req, res ) => {
  res.status(201);
  res.send('Successfully received POST request for answer');
});

//  increase the helpful count of a question by 1
app.put('/qa/questions/:question_id/helpful', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for question helpfulness');
});

//  make the report column of the question true
app.put('/qa/questions/:question_id/report', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for question report');
});

//  increase the helpful count of a question by 1
app.put('/qa/answers/:answer_id/helpful', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for answer helpfulness');
});

//  make the report column of the question true
app.put('/qa/answers/:answer_id/report', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for answer report');
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});