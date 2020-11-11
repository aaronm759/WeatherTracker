const express = require('express');
const Datastore = require('nedb');
const { request, response } = require('express');
const fetch = require('node-fetch');
const schedule = require('node-schedule');
require('dotenv').config();

const app = express();
app.listen(2999, () => console.log('listening'));
app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));

const database = new Datastore('actualWeather.db');
const database2 = new Datastore('1DForecast.db');
database.loadDatabase();
database2.loadDatabase();
database.ensureIndex({ fieldName: 'theDate' });
database2.ensureIndex({ fieldName: 'theDate' });


/*----------------------------------------------*/
/*---------------data collection----------------*/
/*----------------------------------------------*/

schedule.scheduleJob('0 0 8 * * *', function () {

    getYesterdayWeather();
    get1DayForecast();

});





//Actual weather

async function getYesterdayWeather() {
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
        database.insert(actualWeather);
    }
    catch (err) {
        console.log(err);
    }


};


//1 Day forecast

async function get1DayForecast() {
    try {
        const apikey = process.env.API_KEY;
        const response = await fetch('http://api.weatherapi.com/v1/forecast.json?key=' + apikey + '&q=20002&days=7');
        const data = await response.json();
        const theDate = data.forecast.forecastday[1].date;
        const fc1AvgTemp = data.forecast.forecastday[1].day.avgtemp_f;
        const fc1Precip = data.forecast.forecastday[1].day.totalprecip_mm;
        const fc1Weather = { theDate, fc1AvgTemp, fc1Precip };
        database2.insert(fc1Weather);
    }
    catch (err) {
        console.log(err);
    }
};
/*---------------------------------------*/
/*-Sending Data to be Graphed/Displayed--*/
/*---------------------------------------*/



database.find({}, { theDate: 1, actualAvgTemp: 1, _id: 0 }, (err, data) => {
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



function sendPredictedTemp() {
    const d = new Date();
    const d4 = d.toISOString().substring(0, 10);


    database2.findOne({ theDate: d4 }, { fc1AvgTemp: 1, _id: 0 }, (err, data) => {
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
sendPredictedTemp();