//location 327659 - for api usage

/*---------------------------------*/
/*----Receiving Data to be Graphed-*/
/*---------------------------------*/

const xlabel = [];
const y1label = [];
const y2label = [];

async function getChartData() {
    const response = await fetch('/api3');
    const data = await response.json();
    for (x of data) {
        const day = x.day;
        const aTemp = x.aTemp;
        const fTemp = x.ftemp;
        xlabel.push(day);
        y1label.push(aTemp);
        y2label.push(fTemp);

    };
    graphChart();
};
getChartData();

async function graphChart() {
    const ctx = document.getElementById('myChart').getContext('2d');
    const mychart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xlabel,
            datasets: [{
                label: 'Avg Temp',
                data: y1label,
                backgroundColor: ['rgba(4, 0, 130, 0)'],
                borderColor: ['rgba(214, 0, 18, 1)'],
                borderWidth: 2,
                fill: false,
                pointRadius: 5
            },
            {
                label: 'Predicted Avg Temp',
                data: y2label,
                backgroundColor: ['rgba(92, 87, 255, 0)'],
                borderColor: ['rgba(0, 0, 0, 1)'],
                borderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    gridLines: {
                        color: 'rgba(0, 0, 0, 1)'
                    },
                    ticks: {
                        fontColor: '#000'
                    }
                }],
                xAxes: [{
                    gridLines: {
                        color: 'rgba(0, 0, 0, 1)'
                    },
                    ticks: {
                        fontColor: '#000'
                    }
                }]
            }
        }


    });
}
/*--------------------------------------*/
/*------Get Current Weather-------------*/
/*--------------------------------------*/

async function getCurrentWeather() {
    const apikey = process.env.API_KEY;
    const response = await fetch('https://api.weatherapi.com/v1/current.json?key=' + apikey + '&q=20002');
    const data = await response.json();
    const cTemp = data.current.temp_f;
    const cCondition = data.current.condition.text;
    const precip = data.current.precip_mm;
    document.getElementById('ctemp').textContent = cTemp;
    document.getElementById('precip').textContent = precip;
    document.getElementById('ccondition').textContent = cCondition;
    const d = new Date();
    const d2 = d.toDateString();
    document.getElementById('date').textContent = d2;




};
getCurrentWeather();

async function getTodaysPtemp() {
    const response = await fetch('/predtemp');
    const data = await response.json();
    document.getElementById('ptemp').textContent = data;

};
getTodaysPtemp();