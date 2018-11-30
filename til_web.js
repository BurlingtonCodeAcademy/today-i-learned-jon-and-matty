/* 
  Today I Learned webapp
*/
const assert = require('assert');
const FactStore = require('./lib/factStore')
const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const moment = require('moment')

app.use(express.static('public')) // static file server
app.use(express.urlencoded({ extended: true })) // all POST bodies are expected to be URL-encoded

const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const store = new FactStore(dbUrl);

app.get('/facts', getAll);

// function dateFormat(date) {
//   let entryDate = moment(date).format("X");
//   let currentDate = moment().format("X");
//   let entryDay = moment(date).format("DDMMYYYY");
//   let currentDay = moment().format("DDMMYYYY");
//   let entryYear = moment(date).format("YYYY");
//   let currentYear = moment().format("YYYY");
//   let year;
//   if (entryYear === currentYear) {
//     year = "";
//   } else {
//     year = `, ${entryYear}`;
//   }
//   if (entryDay === currentDay) {
//     return "Today";
//   } else if (+entryDate + 518400 >= +currentDate) {
//     return moment(date).format("dddd");
//   } else {
//     return moment(date).format("MMMM Do") + year;
//   }
// }

moment.updateLocale('en', {
  calendar : {
      lastDay : '[Yesterday at] LT',
      sameDay : '[Today at] LT',
      lastWeek : 'dddd [at] LT',
      sameElse: function() {
        if (this.year() === moment().year()) {
          return 'MMMM Do [at] LT'
        } else {
          return 'MMMM Do, YYYY';
        }
      }
  }
});

async function getAll(request, response) {
  let cursor = await store.all();
  let output = '<link rel="stylesheet" type="text/css" media="screen" href="/main.css" />';
  output += '<body><div class="results">'
  output += '<h1>Today I Learned:</h1>'
  output += `<form method='POST' action='/facts'> <input type='text' name='text' class='text'> <input type='submit' value='Add Entry' class="button"> </form>`
  output += '<h1>All The Things I\'ve Learned...</h1><div class="line"><span class="select title">Select:</span><span class="date title">When I Learned</span><span class="entries title">What I Learned</span></div>';
  output += `<form method='POST' action='/delete'>`;

  cursor.forEach((entry) => {
    output += `<div class="line"><span class="select"><input type="radio" name="radio" id="${entry.index}" value="${entry.index}"></span><span class="date">${moment(entry.when).calendar()}</span><span class="entries">${entry.text}</span></div>`;
  }, function (err) {
    assert.equal(null, err);
    output += `<input type='submit' value='Delete Selection' class="button"> </form>`
    response.header('Content-Type', 'text/html');
    response.type('text/html')
      .send(output)
  });
}

app.post('/facts', addFact);

async function addFact(request, response) {
  await store.addFact(request.body.text.trim());
  response.redirect('/facts');
}

app.post('/delete', deleteFact);

async function deleteFact(request, response) {
  await store.deleteFact(request.body.radio);
  console.log("Deleted entry with index " + request.body.radio);
  response.redirect('/facts');
}

app.listen(port, () => console.log(`TIL web app listening on port ${port}!`))
