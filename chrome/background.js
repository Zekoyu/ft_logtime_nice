const data_url = 'https://profile.intra.42.fr/users/mframbou/locations_stats';

async function main() {

    const json = await (await fetch(data_url)).json();

    if (Object.getOwnPropertyNames(json).length !== 0) {
        let logtimeSumPerMonth = sumUpDailyLogtimes(
            reduceDaysToMonths(json)
        );
    }
}

function reduceDaysToMonths(out) {
    let monthsLogtimes = {};
    for (const [key, value] of Object.entries(out)) {
        let time = value.replace(/[^0-9:.]/g, "")
        time = time.split(":");
        time[2] = time[2].split(".")[0];

        // New code to start month 27 each month at 00h00 to 26 next month at 23h59
        const dateSplit = key.split("-");
        let year = Number.parseInt(dateSplit[0]);
        let month = Number.parseInt(dateSplit[1]);
        const day = Number.parseInt(dateSplit[2]);

        if (day >= 27)
        {
            // add to next month
            month++;
            if (month > 12)
            {
                month = 1;
                year++;
            }
        }

        let date = year.toString()  + "-" + month.toString().padStart(2, "0");
        // End of new code

        // Archive
        // let date = key.substring(0, 7);
        // console.log("Old date: " + date + ", New date: " + newDate + " day is " + key);

        if (!Array.isArray(monthsLogtimes[date])) {
            monthsLogtimes[date] = [];
        }
        monthsLogtimes[date].push(time);
    }
    return monthsLogtimes;
}

function sumUpDailyLogtimes(monthsLogtimes) {
    let logtimeSumPerMonth = {};
    let excessTime = 0;

    // add reverse for chronological order
    for (const [date, times] of Object.entries(monthsLogtimes).reverse()) {
        let time = sumTime(times).split(":");
        let addedTimeThisMonthSeconds = 0;

        // New code to add bonus hours to next month (capped at 70)
        let timeInSeconds = Number.parseInt(time[0]) * 3600 + Number.parseInt(time[1]) * 60 + Number.parseInt(time[2]);

        // if more than 140 hours
        if (timeInSeconds > 60*60*140)
        {
            excessTime += (timeInSeconds - 60*60*140);

            // if excesss time is more than 70 hours (cap)
            if (excessTime > 60*60*70)
                excessTime = 60*60*70;
        }
        // Add excess time if needed
        else
        {
            const missingTime = 60*60*140 - timeInSeconds;

            // Too little excess time to finish month
            if (missingTime > excessTime)
            {
                timeInSeconds += excessTime;
                addedTimeThisMonthSeconds = excessTime;
                excessTime = 0;
            }
            // Still have excess time after adding it
            else
            {
                timeInSeconds += missingTime;
                addedTimeThisMonthSeconds = missingTime;
                excessTime -= missingTime;
            }
        }

        const hoursThisMonthString = Math.floor(timeInSeconds / 3600) + "h" + Math.floor((timeInSeconds % 3600) / 60) + "m" + Math.floor(timeInSeconds % 60) + "s";
        const addedTimeString = Math.floor(addedTimeThisMonthSeconds / 3600) + "h" + Math.floor((addedTimeThisMonthSeconds % 3600) / 60) + "m" + Math.floor(addedTimeThisMonthSeconds % 60) + "s";
        const newTime = `${hoursThisMonthString} (${addedTimeString})`;

        logtimeSumPerMonth[date] = newTime;

        // time = time[0] + "h " + time[1] + "m " + time[2] + "s";
        // logtimeSumPerMonth[date] = time;
    }

    // revese back to latest first order
    return Object.fromEntries(Object.entries(logtimeSumPerMonth).reverse());
    // return logtimeSumPerMonth;
}

function sumTime(array) {
    let times = [3600, 60, 1],
        sum = array
            .map((s) => s.reduce((s, v, i) => s + times[i] * v, 0))
            .reduce((a, b) => a + b, 0);

    return times
        .map((t) => [Math.floor(sum / t), (sum %= t)][0])
        .map((v) => v.toString().padStart(2, 0))
        .join(":");
}

main();