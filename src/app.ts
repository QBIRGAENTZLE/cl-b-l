import express from 'express';
import mongodb from 'mongodb';
import bodyParser from 'body-parser';

import { People } from './models/people';
import { Theme } from './models/theme';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://noel-lecinski.qubix.fr');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const uri = 'mongodb+srv://christmasAdmin:QB05ju92@christmaslotterycluster-yghct.mongodb.net/test?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let peoplesList: People[] = [];

let peoplesCollection: mongodb.Collection;

client.connect((err: any) => {

    if (err) {
        console.log('DB CONNECTION ERROR', err);
    }

    peoplesCollection = client.db('christmas-lottery').collection('lecinski');

    peoplesCollection.find({}).toArray((e, data) => {
        peoplesList = <People[]>data;
    });

    // perform actions on the collection object
    // client.close();
});

app.get('/', (_req, res) => {
    res.send('The sedulous hyena ate the antelope!');
});

app.get('/reload', (_req, res) => {
    peoplesCollection = client.db('christmas-lottery').collection('lecinski');

    peoplesCollection.find({}).toArray((e, data) => {
        peoplesList = <People[]>data;
    });

    res.send('Data reloaded');
});

app.get('/peoples', (_req, res) => {
    res.send(peoplesList);
});

app.put('/save-theme-picked', (req, res) => {
    const gamer = req.body[0];

    const gIndex = peoplesList.findIndex(p => p._id.toString() === gamer._id);
    peoplesList[gIndex].themesPicked = gamer.themesPicked;

    peoplesCollection.updateOne(
        { _id: new ObjectID(gamer._id) },
        { $set: { themesPicked: gamer.themesPicked } },
        (err, result) => {
        }
    );
});

app.put('/save-people-picked', (req, res) => {
    const gamer = req.body[0];
    const picked = req.body[1];

    const gIndex = peoplesList.findIndex(p => p._id.toString() === gamer._id);
    peoplesList[gIndex].peoplePicked = picked.name;

    const pIndex = peoplesList.findIndex(p => p._id.toString() === picked._id);
    peoplesList[pIndex].isPicked = true;

    peoplesCollection.updateOne(
        { _id: new ObjectID(gamer._id) },
        { $set: { peoplePicked: gamer.peoplePicked } },
        (err, result) => {
        }
    );

    peoplesCollection.updateOne(
        { _id: new ObjectID(picked._id) },
        { $set: { isPicked: true } },
        (err, result) => {
        }
    );

    res.send();
});

app.get('/clean', (req, res) => {
    peoplesCollection.updateMany(
        {},
        { $set: { isPicked: false, themesPicked: [], peoplePicked: '' } }
    ).then(() => {
        res.send('DB clean');
    });
});

app.listen(port, (err) => {
    if (err) {
        return console.error(err);
    }
    return console.log(`server is listening on ${port}`);
});
