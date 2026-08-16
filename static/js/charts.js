const charts = [];
const historyLength = 20;

let machine2 = {
    temperature: 38,
    humidity: 50,
    vibration: 0.8
};

// -----------------------------
// YARDIMCI: yumuşak random değişim
// -----------------------------

function smoothRandom(value, min, max, step) {

    value += (Math.random() - 0.5) * step;

    if (value < min) value = min;
    if (value > max) value = max;

    return value;
}


// -----------------------------
// GRAFİK OLUŞTUR
// -----------------------------

function createChart(canvas, temperatureData, vibrationData) {

    return new Chart(canvas, {

        type: "line",

        data: {

            labels: Array(historyLength).fill(""),

            datasets: [

                {
                    label: "Temperature",
                    data: temperatureData,

                    borderColor: "#2dd4bf",
                    borderWidth: 2,

                    tension: 0.35,
                    pointRadius: 0,

                    yAxisID: "temperature"
                },

                {
                    label: "Vibration",
                    data: vibrationData,

                    borderColor: "#f59e0b",
                    borderWidth: 2,

                    tension: 0.35,
                    pointRadius: 0,

                    yAxisID: "vibration"
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            animation: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                x: {
                    display: false
                },

                temperature: {
                    display: false,
                    min: 20,
                    max: 40
                },

                vibration: {
                    display: false
                }

            }
        }

    });
}


// -----------------------------
// BAŞLANGIÇ GRAFİKLERİ
// -----------------------------

document.querySelectorAll("canvas").forEach((canvas, index) => {

    // MTR-03 = durmuş makine
    // Grafik oluşturma
    if (index === 2) {
        return;
    }

    const temperatureData = [];
    const vibrationData = [];

    if (index === 0) {

        // MTR-01 gerçek ESP32
        // İlk değerler yaklaşık 27 derece

        for (let i = 0; i < historyLength; i++) {

            temperatureData.push(27);
            vibrationData.push(0.15);

        }

    } else {

        // MTR-02 simülasyon

        for (let i = 0; i < historyLength; i++) {

            temperatureData.push(machine2.temperature);
            vibrationData.push(machine2.vibration);

        }

    }

    charts[index] = createChart(
        canvas,
        temperatureData,
        vibrationData
    );

});


// -----------------------------
// SENSOR VERİSİ
// -----------------------------

async function updateDashboard() {

    try {

        const response = await fetch("/api/sensor-data");

        const data = await response.json();


        // =====================================================
        // MTR-01 - GERÇEK ESP32 VERİSİ
        // =====================================================

        const temperature = Number(data.temperature) || 0;

        const humidity = Number(data.humidity) || 0;

        const accelX = Number(data.accel_x) || 0;
        const accelY = Number(data.accel_y) || 0;
        const accelZ = Number(data.accel_z) || 0;


        // Yerçekimini çıkartıyoruz.
        // Böylece 9.8 g sabit değer olarak titreşim sayılmıyor.

        const totalAcceleration =
            Math.sqrt(
                accelX * accelX +
                accelY * accelY +
                accelZ * accelZ
            );

        const vibration =
            Math.abs(totalAcceleration - 9.81);


        const pressure = Number(data.pressure) || 0;


        // =====================================================
        // MTR-01 GRAFİĞİ
        // =====================================================

        if (charts[0]) {

            const tempArray =
                charts[0].data.datasets[0].data;

            const vibrationArray =
                charts[0].data.datasets[1].data;


            tempArray.push(temperature);
            vibrationArray.push(vibration);


            if (tempArray.length > historyLength) {
                tempArray.shift();
            }

            if (vibrationArray.length > historyLength) {
                vibrationArray.shift();
            }


            charts[0].update("none");
        }


        // =====================================================
        // MTR-01 ALT DEĞERLER
        // =====================================================

        const machineCards =
            document.querySelectorAll(".machine-card");

        if (machineCards.length > 0) {

            const values =
                machineCards[0].querySelectorAll(
                    ".sensor-values span"
                );


            if (values[0]) {
                values[0].innerHTML =
                    `🌡 ${temperature.toFixed(2)} °C`;
            }

            if (values[1]) {
                values[1].innerHTML =
                    `💧 ${humidity.toFixed(2)} %`;
            }

            if (values[2]) {
                values[2].innerHTML =
                    `📳 ${vibration.toFixed(3)} g`;
            }

            if (values[3]) {
                values[3].innerHTML =
                    `🌐 ${pressure.toFixed(2)} hPa`;
            }
        }


        // =====================================================
        // MTR-02 - SİMÜLASYON
        // =====================================================

        machine2.temperature =
            smoothRandom(
                machine2.temperature,
                35,
                42,
                0.4
            );

        machine2.humidity =
            smoothRandom(
                machine2.humidity,
                45,
                60,
                1
            );

        machine2.vibration =
            smoothRandom(
                machine2.vibration,
                0.3,
                1.2,
                0.15
            );


        // MTR-02 grafiği

        if (charts[1]) {

            const tempArray =
                charts[1].data.datasets[0].data;

            const vibrationArray =
                charts[1].data.datasets[1].data;


            tempArray.push(machine2.temperature);

            vibrationArray.push(machine2.vibration);


            if (tempArray.length > historyLength) {
                tempArray.shift();
            }

            if (vibrationArray.length > historyLength) {
                vibrationArray.shift();
            }


            charts[1].update("none");
        }


        // =====================================================
        // MTR-02 ALT DEĞERLER
        // =====================================================

        if (machineCards.length > 1) {

            const values =
                machineCards[1].querySelectorAll(
                    ".sensor-values span"
                );


            if (values[0]) {
                values[0].innerHTML =
                    `🌡 ${machine2.temperature.toFixed(2)} °C`;
            }

            if (values[1]) {
                values[1].innerHTML =
                    `💧 ${machine2.humidity.toFixed(2)} %`;
            }

            if (values[2]) {
                values[2].innerHTML =
                    `📳 ${machine2.vibration.toFixed(3)} g`;
            }

            if (values[3]) {
                values[3].innerHTML =
                    `🌐 1010.00 hPa`;
            }
        }

    }

    catch (error) {

        console.error(
            "Sensor verisi alınamadı:",
            error
        );

    }

}


// -----------------------------
// HER 1 SANİYEDE GÜNCELLE
// -----------------------------

setInterval(updateDashboard, 1000);


// Sayfa açılır açılmaz çalıştır
updateDashboard();