const express = require('express');
const Datastore = require('nedb');
const { request, response } = require('express');
const fetch = require('node-fetch');
const schedule = require('node-schedule');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 2999;
app.listen(port, () => console.log('listening'));
app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));




const { MongoClient } = require('mongodb');

async function main() {
    const password = process.env.DB_KEY;
    const uri = "mongodb+srv://" + password + "@clusterwt.xfrob.mongodb.net/weathertrackerdata?retryWrites=true&w=majority";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


    try {
        await client.connect();
        const database = client.db("weathertrackerdata").collection("actualweather");
        const database2 = client.db("weathertrackerdata").collection("forecast1day");

        schedule.scheduleJob('0 0 8 * * *', function () {

            getYesterdayWeather(database);
            get1DayForecast(database2);

        });

        await sendPredictedTemp(database2);
        await getDataForGraph(database, database2);

    } catch (e) {
        console.error(e);
    }
};

main().catch(console.err);


/*----------------------------------------------*/
/*---------------data collection----------------*/
/*----------------------------------------------*/


//Actual weather

async function getYesterdayWeather(database) {
    try {
        const apikey = process.env.API_KEY;
        var d = new Date();
        d.setDate(d.getDate() - 1) //gets yesterdays date

        const response = await fetch('http://api.weatherapi.com/v1/history.json?key=' + apikey + '&q=20002&dt=' + d.toISOString().substring(0, 10));
        const data = await response.json();
        const theDate = data.forecast.forecastday[0].date;
        const actualAvgTemp = data.forecast.forecastday[0].day.avgtemp_f;
        const actualPrecip = data.forecast.forecastday[0].day.totalprecip_mm;
        const actualWeather = { theDate, actualAvgTemp, actualPrecip };
        database.insertOne(actualWeather);
    }
    catch (err) {
        console.log(err);
    }


};


//1 Day forecast

async function get1DayForecast(database2) {
    try {
        const apikey = process.env.API_KEY;
        const response = await fetch('http://api.weatherapi.com/v1/forecast.json?key=' + apikey + '&q=20002&days=7');
        const data = await response.json();
        const theDate = data.forecast.forecastday[1].date;
        const fc1AvgTemp = data.forecast.forecastday[1].day.avgtemp_f;
        const fc1Precip = data.forecast.forecastday[1].day.totalprecip_mm;
        const fc1Weather = { theDate, fc1AvgTemp, fc1Precip };
        database2.insertOne(fc1Weather);
    }
    catch (err) {
        console.log(err);
    }
};



/*---------------------------------------*/
/*-Sending Data to be Graphed/Displayed--*/
/*---------------------------------------*/


async function getDataForGraph(database, database2) {

    const graphData = [];
    var dy = new Date();
    dy.setDate(dy.getDate() - 4);
    const day4 = dy.toISOString().substring(0, 10);

    const cursor = database.find({ theDate: { $gte: day4 } },
        { projection: { theDate: 1, actualAvgTemp: 1, _id: 0, actualPrecip: 1 } }
    );

    const data = await cursor.toArray();
    if (data.length > 0) {
        for (x of data) {
            const day = x.theDate;
            const aTemp = x.actualAvgTemp;
            const aPrecip = x.actualPrecip;
            const cursor2 = database2.find({ theDate: day },
                { projection: { theDate: 1, fc1AvgTemp: 1, _id: 0, fc1Precip: 1 } });

            const data2 = await cursor2.toArray();
            if (data2.length > 0) {
                for (y of data2) {
                    const ftemp = y.fc1AvgTemp;
                    const fPrecip = y.fc1Precip;
                    const coords = { day, aTemp, aPrecip, ftemp, fPrecip };
                    graphData.push(coords)


                }

            } else {
                console.log('no data')
            }
        }

    } else {
        console.log('no data')
    }
    for (i = 1; i <= 4; i++) {
        if (i === 4) {
            app.get('/api3', (request, response) => {
                response.json(graphData);

            });
        }
    };



};





function sendPredictedTemp(database2) {
    const d = new Date();
    const today = d.toISOString().substring(0, 10);


    database2.findOne({ theDate: today }, { projection: { fc1AvgTemp: 1, _id: 0 } }, (err, data) => {
        if (err) {
            response.end();
            return;
        }
        if (data == null) {
            app.get('/predtemp', (request, response2) => {
                response2.json('n/a')
            });
        }
        else {
            const pTemp = data.fc1AvgTemp;
            app.get('/predtemp', (request, response) => {
                response.json(pTemp);

            });
        }

    })

};
