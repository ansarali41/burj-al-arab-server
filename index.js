const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
// environment setup
require('dotenv').config()
// console.log({
//     username: process.env.DB_USER,
//     password: process.env.DB_PASS
// });

const MongoClient = require('mongodb').MongoClient;
const password = 'ArabianHores79';
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yf6o8.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express()
app.use(cors());
app.use(bodyParser.json());

// firebase admin
const admin = require("firebase-admin");
const serviceAccount = require("./config/burj-al-arab-f7809-firebase-adminsdk-d58qp-6c928de893.json");

// initialize firebase admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

// mongodb
client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");

    // create or post on database
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        // console.log(newBooking);
    })

    // Read or get data from database
    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;

        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // console.log({ idToken });

            // firebase idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email

                    if (tokenEmail === queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents)
                            })
                    }
                    else {
                        res.status(401).send('unauthorized access')
                    }
                })
                .catch(function (error) {
                    // Handle error
                    res.status(401).send('unauthorized access')
                });
        }
        else {
            res.status(401).send('unauthorized access')
        }


        console.log('database connected');
    })
});

const port = 5000;
app.listen(port, console.log(`Example app listening at http://localhost:${port}`))