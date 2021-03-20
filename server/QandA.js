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


// Gets all questions for a specific product
app.get('/qa/questions', ( req, res ) => {

  //  deconstruct the query property
  let { product_id, page, count } = req.query;

  //  initialize the object to return
  let data = {product_id: product_id, results: []}

  //  if the product id is not an integer send it back with an error
  //  indicating that the wrong type of product id was sent
  if ( isNaN(product_id) ) {
    res.status(422);
    res.send('Error: Invalid data type for product_id');
    return;
  }

  //  sql query to create an array of custom objects of qeustions
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

  //  sql query to create a custom object with questions_id and an array of answers
  //  inside of the answers object another custom object is created
  //  for the answers_photos query
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

  //  if there was no page number or it was an incorrect type
  //  set the page number to the default 1
  if ( isNaN(page) ) { page = 1 }

  //  if there was no count number or it was an incorrect type
  //  set the count number to the default 5
  if ( isNaN(count) ) { count = 5 }

  //  conduct the query for the questions with the passed in product_id
  db.query(SQL_QUESTIONS, [ product_id ])
  .then(resQ => {
    //  if some questions exist for the product
    if (resQ.rows[0].results !== null) {
      //  query all of the answers for the product
      db.query((SQL_ANSWERS), [product_id])
      .then(resA => {
        //  loop through all of the questions
        for (let i = 0; i < resQ.rows[0].results.length; i++) {
          //  create an answers object for all of the questions
          resQ.rows[0].results[i].answers = {}
          //  loop through all of the arrays of answers for each question
          for (let j = 0; j < resA.rows[0].question.length; j++) {
            //  if the array of answers corresponds to the question
            if (resQ.rows[0].results[i].question_id === resA.rows[0].question[j].question_id) {
              //  iterate through all of the answers for that respective question
              for (let k = 0; k < resA.rows[0].question[j].answers.length; k++) {
                //  if no photos exist for that answer
                if (resA.rows[0].question[j].answers[k].photos = 'null') {
                  //  replace null string with an empty array
                  resA.rows[0].question[j].answers[k].photos = [];
                }
                //  create an object that has the answers id as the key and the entire answer as the value
                resQ.rows[0].results[i].answers[resA.rows[0].question[j].answers[k].id] = resA.rows[0].question[j].answers[k]
              }
            }
          }
        }
        //  slice the data to account for the page and count per page
        data.results = resQ.rows[0].results.slice(count * (page - 1), count * page);
        //  send the data object back in the correct format
        res.send(data);
      })
      .catch(err => {
        //  if there is an error print the error and update the status code
        console.log(err)
        res.status(500);
      });
    } else {
      //  if there are no questions for a product send the basic formatted object back
      res.send(data);
    }
  })
  .catch(err => {
    //  handle any errors on the first query and send back a response error
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue requesting data.');
  });
});

//  get all answers for a specific question id
app.get('/qa/questions/:question_id/answers', ( req, res ) => {

  //  deconstruct the question id from the params
  const { question_id } = req.params;

  //  deconstruct the page and count numbers from the query
  let { page, count } = req.query;

  //  if the question id is not an integer send it back with an error
  //  indicating that the wrong type of question id was sent
  if ( isNaN(question_id) ) {
    res.status(422);
    res.send('Error: Invalid data type for question_id');
    return;
  }

  //  if the page is not a number set page to default
  if ( isNaN(page)) { page = 1 }

  //  if count is not a number set count to default
  if ( isNaN(count)) { count = 5 }

  //  query all the answers and return an object of a custom design
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

  //  query for all of the answers
  db.query((SQL_ANSWERS), [question_id])
  .then(resA => {
    //  for each answer
    resA.rows[0].results.forEach(answer => {
      //  if no photos exist for that answer
      if (answer.photos === null) {
        //  create an empty array for that photo
        answer.photos = [];
      }
    })
    //  adjust the array for the page and count number and include the question id
    //  page and count in the object
    resA.rows[0].results = resA.rows[0].results.slice(count * (page - 1), count * page);
    resA.rows[0].question = question_id;
    resA.rows[0].page = page;
    resA.rows[0].count = count;
    //  updat the status and send back the data object
    res.status(200);
    res.send(resA.rows[0]);
  })
  .catch(err => {
    //  handle any errors
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue querying.')
  });
});

//  post a question to a product
app.post('/qa/questions', ( req, res ) => {

  //  deconstruct the product id, body, name, and email
  const { product_id, body, name, email } = req.body;

  //  if the data type that is received is the wrong type is not a number send back an error code
  if ( isNaN(product_id) || typeof body !== 'string' || typeof name !== 'string' || typeof email !== 'string' ) {
    res.status(422);
    res.send('Error: Invalid data type submitted');
    return;
  }

  //  create a new date in the ISO format
  const date = new Date().toISOString();

  //  create a query to perfrom the insert
  const SQL_QUESTION_INSERT = `
  INSERT INTO questions (product_id, body, date_written, asker_name, asker_email, reported, helpful) VALUES ($1, $2, '${date}', $3, $4, FALSE, 0)
  `;

  //  conduct the query
  db.query(SQL_QUESTION_INSERT, [product_id, body, name, email])
  .then((resQ) => {
    //  on success send back a success message
    res.status(201);
    res.send('CREATED');
  })
  .catch(err => {
    //  on error send back error message
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue querying.')
  });
});

//  post an answer to a question
app.post('/qa/questions/:question_id/answers', ( req, res ) => {

  //  deconstruct parameters
  const { question_id } = req.params;
  const { body, name, email, photos } = req.body;

  //  if an invalid data type is received send back an error
  if ( isNaN(question_id) || typeof body !== 'string' || typeof name !== 'string' || !Array.isArray(photos)) {
    res.status(422);
    res.send('Error: Invalid data type submitted');
    return;
  }

  //  create a new ISO date
  const date = new Date().toISOString();

  //  create a query string to insert answer
  const SQL_ANSWER_INSERT = `
  INSERT INTO answers (question_id, body, date_written, answerer_name, answerer_email, reported, helpful) VALUES ($1, $2, '${date}', $3, $4, FALSE, 0) RETURNING (id)
  `;

  //  conduct query
  db.query(SQL_ANSWER_INSERT, [question_id, body, name, email])
  .then((resAI) => {
    //  if there are photo urls in the photos array
    if ( photos.length !== 0) {
      //  create a query string to insert a url
      const SQL_ANSWERS_PHOTOS_INSERT = `
      INSERT INTO answers_photos (answers_id, "url")
      VALUES ($1, $2)
      `;
      //  for each photo url
      for (let i = 0; i < photos.length; i++) {
        //  conduct a query using the photo url and the answers id
        db.query(SQL_ANSWERS_PHOTOS_INSERT, [resAI.rows[0].id, photos[i]])
        .then((resAI) => {
          //  update status code
          res.status(201);
        })
        .catch(err => {
          //  handle error
          console.log(err);
          res.status(500);
        });
      }
    } else {
      //  update status code
      res.status(201);
    }
    //  send back success message
    res.send('CREATED');
  })
  .catch(err => {
    //  handle errors
    console.log(err);
    res.status(500);
    res.send('Error: Database had issue querying.')
  });

});

//  increase the helpful count of a question by 1
app.put('/qa/questions/:question_id/helpful', ( req, res ) => {

  //  deconstruct question id from params
  const { question_id } = req.params;

  //  if the question id is not a number send back an error message
  if ( isNaN(question_id)) {
    res.status(422);
    res.send('Error: Invalid data type for question_id');
    return;
  }

  //  create a query string
  const SQL_QUESTIONS_UPDATE = `
    UPDATE questions SET helpful = helpful + 1 WHERE id = $1
  `;

  //  perform the query using the query string
  db.query(SQL_QUESTIONS_UPDATE, [question_id])
  .then(() => res.status(204))
  .catch(err => {
    //  handle the error
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

//  make the report column of the question true
app.put('/qa/questions/:question_id/report', ( req, res ) => {

  //  deconstruct the question id
  const { question_id } = req.params;

  //  if the question id is the wrong type send back an error message
  if ( isNaN(question_id)) {
    res.status(422);
    res.send('Error: Invalid data type for question_id');
    return;
  }

  //  create a query string
  const SQL_QUESTIONS_UPDATE = `
    UPDATE questions SET reported = TRUE WHERE id = $1
  `;

  //  perform the query with the string
  db.query(SQL_QUESTIONS_UPDATE, [question_id])
  .then(() => res.status(204))
  .catch(err => {
    //  handle errors
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

//  increase the helpful count of a answer by 1
app.put('/qa/answers/:answer_id/helpful', ( req, res ) => {

  //  deconstruc the answer id
  const { answer_id } = req.params;

  //  if the answer id is the wrong data type send back an error
  if ( isNaN(answer_id) ) {
    res.status(422);
    res.send('Error: Invalid data type for answer_id');
    return;
  }


  //  create a query string
  const SQL_ANSWERS_UPDATE = `
    UPDATE answers SET helpful = helpful + 1 WHERE id = $1
  `;

  //  perform the query
  db.query(SQL_ANSWERS_UPDATE, [answer_id])
  .then(() => res.status(204))
  .catch(err => {
    //  handle errors
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

//  make the report column of the question true
app.put('/qa/answers/:answer_id/report', ( req, res ) => {

  //  deconstruct the answer id
  const { answer_id } = req.params;

  //  if the answer id is the wrong data type send back an error
  if ( isNaN(answer_id)) {
    res.status(422);
    res.send('Error: Invalid data type for answer_id');
    return;
  }

  //  create a query string
  const SQL_ANSWERS_UPDATE = `
    UPDATE answers SET reported = TRUE WHERE id = $1
  `;

  //  perform the query
  db.query(SQL_ANSWERS_UPDATE, [answer_id])
  .then(() => res.status(204))
  .catch(err => {
    //  handle errors
    console.log(err);
    res.status(500);
  })
  .finally(() => res.send())
});

//  indicate which port we are connected to
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});