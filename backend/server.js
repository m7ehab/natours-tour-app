const app = require('./app.js');
const mongoose = require('mongoose');
const port = process.env.PORT;
const url = process.env.MONGO_URL;

mongoose.connect(url).then((con) => {
  console.log('connectd to db ');
});
process.on('uncaughtException', (err) => {
  //undefiend variables
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
const server = app.listen(port, () => {
  console.log(
    `app listening on port ${port} and we on ${process.env.NODE_ENV}`
  );
});

process.on('unhandledRejection', (err) => {
  //uncaught errors
  console.log(err.name, err.message);
  console.log('Unhandled Rejection Server shutting down .. ');
  server.close(() => {
    process.exit(1);
  });
});
