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

//mongodb+srv://aaronwt:<password>@clusterwt.xfrob.mongodb.net/<dbname>?retryWrites=true&w=majority


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

        //await getDataForGraph(database, database2);

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


const dbQuery = [];

async function back1Day() {
    var dy = new Date();
    dy.setDate(dy.getDate() - 1);
    const day1 = dy.toISOString().substring(0, 10);
    dbQuery.push(day1);
};


async function back2Day() {
    var dy = new Date();
    dy.setDate(dy.getDate() - 2);
    const day2 = dy.toISOString().substring(0, 10);
    dbQuery.push(day2);
};


async function back3Day() {
    var dy = new Date();
    dy.setDate(dy.getDate() - 3);
    const day3 = dy.toISOString().substring(0, 10);
    dbQuery.push(day3);
};


async function back4Day() {
    var dy = new Date();
    dy.setDate(dy.getDate() - 4);
    const day4 = dy.toISOString().substring(0, 10);
    dbQuery.push(day4);
};


/*for (z of dbQuery) {

    database.find({ theDate: z }, projection: { theDate: 1, actualAvgTemp: 1, _id: 0 }, (err, data) => {
        if (err) {
            response.end();
            return;
        }
        const graphData = [];

        for (x of data) {
            const day = x.theDate
            const aTemp = x.actualAvgTemp
            database2.find({ theDate: day }, { theDate: 1, fc1AvgTemp: 1, _id: 0 }, (err2, data2) => {
                if (err2) {
                    response.end();
                    return;
                }
                const coords = { day, aTemp, data2 };
                graphData.push(coords);

                const y = data.length

                for (i = 1; i <= y; i++) {
                    if (i === y) {
                        app.get('/api3', (request, response) => {
                            response.json(graphData);

                        });
                    }
                    continue;
                };

            });

        };
    });

}
*/


async function getDataForGraph(database, database2) {

    //building query

    back1Day();
    back2Day();
    back3Day();
    back4Day();

    ;

    for (z of dbQuery) {
        database.findOne({ theDate: z },
            { projection: { theDate: 1, actualAvgTemp: 1, _id: 0 } },
            (err, res) => {
                if (res) {
                    console.log('it worked');
                } else {
                    console.log('not found');
                }
            })


    };
};





function sendPredictedTemp() {
    const d = new Date();
    const today = d.toISOString().substring(0, 10);


    database2.findOne({ theDate: today }, { fc1AvgTemp: 1, _id: 0 }, (err, data) => {
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
//sendPredictedTemp();