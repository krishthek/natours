// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Uncaught Exception
process.on('uncaughtException', (err) => {
  console.log('uncaught excception! Shutting down');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

async function dbConnect() {
  await mongoose.connect(DB);
  // console.log(mongoose.connections);
  console.log('DB running');
}

dbConnect().catch((err) => console.log(err));

//// ---- For testing only
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   rating: 4.7,
//   price: 297,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR: ', err);
//   });

const app = require('./app');

// console.log(process.env);

//  START THE SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//UNHANDLED REJECTION WORK -- to handle global promise rejection
process.on('unhandledRejection', (err) => {
  console.log('unhandled rejection! Shutting down');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
