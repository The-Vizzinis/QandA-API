const { Client } = require('pg');

const instance = new Client ({
  host: 'localhost',
  user: 'postgres',
  password: 'password',
  database: 'qa_db',
});

instance.connect((err, res) => {
  if (err) {
    console.log(err)
  }
  else {
    console.log('Successfully connected to database')
  };
});

module.exports = instance;
