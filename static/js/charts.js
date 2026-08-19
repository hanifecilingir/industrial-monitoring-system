const historyLength = 20;
let selectedMachine = 'overview';
let alarmHistory = [];

// ==========================================
// 1. ANA TREND GRAFİĞİ KURULUMU
// ==========================================
const canvas = document.getElementById("trendChart");
const ctx = canvas.getContext("2d");

const gradTemp = ctx.createLinearGradient(0, 0, 0, 200);
gradTemp.addColorStop(0, "rgba(16, 185, 129, 0.25)");
gradTemp.addColorStop(1, "rgba(16, 185, 129, 0.0)");

const gradVib = ctx.createLinearGradient(0, 0, 0, 200);
gradVib.addColorStop(0, "rgba(245, 158, 11, 0.25)");
gradVib.addColorStop(1, "rgba(245, 158, 11, 0.0)");

const trendChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "Temperature (°C)",
                data: [],
                borderColor: "#10b981",
                backgroundColor: gradTemp,
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                pointRadius: 0,
                yAxisID: "yTemp"
            },
            {
                label: "Vibration (g)",
                data: [],
                borderColor: "#f59e0b",
                backgroundColor: gradVib,
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                pointRadius: 0,
                yAxisID: "yVib"
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { position: "top", labels: { color: "#9ca3af", boxWidth: 10, font: { size: 11 } } }
        },
        scales: {
            x: { grid: { color: "#1f293d" }, ticks: { color: "#6b7280", font: { size: 10 }, maxTicksLimit: 8 } },
            yTemp: { type: "linear", position: "left", suggestedMin: 15, suggestedMax: 50, grid: { color: "#1f293d" }, ticks: { color: "#10b981", font: { size: 10 } } },
            yVib: { type: "linear", position: "right", suggestedMin: 0.0, suggestedMax: 1.5, grid: { drawOnChartArea: false }, ticks: { color: "#f59e0b", font: { size: 10 } } }
        }
    }
});

// ==========================================
// 2. ANALİZ GRAFİKLERİ KURULUMU
// ==========================================
let barChart = null;
let pieChart = null;

function initAnalysisCharts() {
    if (barChart || pieChart) return;

    const ctxBar = document.getElementById("analysisBarChart");
    if (ctxBar) {
        barChart = new Chart(ctxBar.getContext("2d"), {
            type: "bar",
            data: {
                labels: ["MTR-01 (ESP32)", "MTR-02 (Pompa)", "MTR-03 (Fan)"],
                datasets: [{
                    data: [0.08, 0.65, 0.00],
                    backgroundColor: ["#10b981", "#f59e0b", "#6b7280"],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: "#1f293d" }, ticks: { color: "#9ca3af", font: { size: 10 } } },
                    y: { grid: { color: "#1f293d" }, ticks: { color: "#9ca3af", font: { size: 10 } }, min: 0, max: 1.5 }
                }
            }
        });
    }

    const ctxPie = document.getElementById("analysisPieChart");
    if (ctxPie) {
        pieChart = new Chart(ctxPie.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: ["Aşırı Titreşim", "Yüksek Sıcaklık", "Planlı Bakım", "Diğer"],
                datasets: [{
                    data: [40, 25, 20, 15],
                    backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6", "#6b7280"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "right", labels: { color: "#9ca3af", boxWidth: 10, font: { size: 10 } } }
                }
            }
        });
    }
}

// ==========================================
// 3. CANLI VERİ GÜNCELLEME VE MOTOR MANTIĞI
// ==========================================
async function updateDashboard() {
    try {
        const response = await fetch("/api/dashboard-data");
        const data = await response.json();

        // Header & KPI Sayaçları
        document.getElementById("clock-display").innerText = data.time;
        document.getElementById("kpi-total").innerText = data.total;
        document.getElementById("kpi-running").innerText = data.running;
        document.getElementById("kpi-warning").innerText = data.warning;
        document.getElementById("kpi-critical").innerText = data.critical;

        // Alarm Loglama Kontrolü
        data.machines.forEach(m => {
            if (m.show_data && (m.status === "WARNING" || m.status === "CRITICAL")) {
                const lastLog = alarmHistory[0];
                if (!lastLog || lastLog.time !== data.time || lastLog.id !== m.id) {
                    alarmHistory.unshift({
                        time: data.time,
                        id: m.id,
                        name: m.name,
                        temp: m.temperature,
                        vib: m.vibration,
                        status: m.status
                    });
                    if (alarmHistory.length > 20) alarmHistory.pop();
                }
            }
        });

        // Alarm Sayaçları
        if (document.getElementById("alarm-cnt-active")) {
            document.getElementById("alarm-cnt-active").innerText = data.critical;
            document.getElementById("alarm-cnt-warning").innerText = data.warning;
            document.getElementById("alarm-cnt-total").innerText = alarmHistory.length;
            document.getElementById("alarm-sys-status").innerText = data.critical > 0 ? "TEHLİKE" : (data.warning > 0 ? "DİKKAT" : "STABİL");
            document.getElementById("alarm-sys-status").style.color = data.critical > 0 ? "var(--color-red)" : (data.warning > 0 ? "var(--color-orange)" : "var(--color-green)");
        }

        // Aktif Makineyi Seçme
        let currentMachine = data.machines[0];
        if (selectedMachine === "MTR-02") currentMachine = data.machines[1];
        if (selectedMachine === "MTR-03") currentMachine = data.machines[2];

        // Kart Başlığı ve Rozet
        document.getElementById("card-m-id").innerText = currentMachine.id;
        document.getElementById("card-m-name").innerText = currentMachine.name.toUpperCase();

        const pill = document.getElementById("m1-status-pill");
        pill.className = `status-pill ${currentMachine.color}`;
        pill.innerText = `● ${currentMachine.status}`;

        // Değerleri Yazdır ve Grafiği Besle
        if (currentMachine.show_data) {
            document.getElementById("m1-temp").innerText = `${currentMachine.temperature} °C`;
            document.getElementById("m1-vib").innerText = `${currentMachine.vibration} g`;
            document.getElementById("m1-hum").innerText = `${currentMachine.humidity} %`;

            const tempSub = document.getElementById("m1-temp-sub");
            const vibSub = document.getElementById("m1-vib-sub");

            tempSub.innerText = currentMachine.temperature > 35 ? "CRITICAL" : (currentMachine.temperature > 30 ? "WARNING" : "NORMAL");
            tempSub.style.color = currentMachine.temperature > 35 ? "var(--color-red)" : (currentMachine.temperature > 30 ? "var(--color-orange)" : "var(--color-green)");

            vibSub.innerText = currentMachine.vibration > 2.5 ? "CRITICAL" : (currentMachine.vibration > 1.5 ? "WARNING" : "NORMAL");
            vibSub.style.color = currentMachine.vibration > 2.5 ? "var(--color-red)" : (currentMachine.vibration > 1.5 ? "var(--color-orange)" : "var(--color-green)");

            trendChart.data.labels.push(data.time);
            trendChart.data.datasets[0].data.push(currentMachine.temperature);
            trendChart.data.datasets[1].data.push(currentMachine.vibration);

            if (trendChart.data.labels.length > historyLength) {
                trendChart.data.labels.shift();
                trendChart.data.datasets[0].data.shift();
                trendChart.data.datasets[1].data.shift();
            }
            trendChart.update();
        } else {
            document.getElementById("m1-temp").innerText = "--";
            document.getElementById("m1-vib").innerText = "--";
            document.getElementById("m1-hum").innerText = "--";
            document.getElementById("m1-temp-sub").innerText = "STOPPED";
            document.getElementById("m1-temp-sub").style.color = "var(--color-gray)";
            document.getElementById("m1-vib-sub").innerText = "STOPPED";
            document.getElementById("m1-vib-sub").style.color = "var(--color-gray)";
        }

        // Machine Status Listesi
        const listContainer = document.getElementById("machine-status-list");
        if (listContainer) {
            listContainer.innerHTML = "";
            data.machines.forEach(m => {
                let colorVar = "--color-gray";
                if (m.color === "green") colorVar = "--color-green";
                if (m.color === "orange") colorVar = "--color-orange";
                if (m.color === "red") colorVar = "--color-red";

                listContainer.innerHTML += `
                    <div class="status-row">
                        <div class="m-info-left">
                            <span class="m-info-id">${m.id}</span>
                            <span class="m-info-name">${m.name}</span>
                        </div>
                        <div class="status-dot" style="color: var(${colorVar});">
                            ● ${m.status}
                        </div>
                    </div>
                `;
            });
        }

        // Eğer Alarm sekmesi açıksa tabloyu yenile
        if (selectedMachine === "alarms") {
            renderAlarmsTable();
        }

    } catch (err) {
        console.error("Veri güncelleme hatası:", err);
    }
}

// ==========================================
// 4. MENÜ GEÇİŞLERİ VE EVENT LISTENERS
// ==========================================
document.querySelectorAll(".nav-menu .nav-item a").forEach(link => {
    link.addEventListener("click", function(e) {
        e.preventDefault();
        
        document.querySelectorAll(".nav-menu .nav-item").forEach(el => el.classList.remove("active"));
        this.parentElement.classList.add("active");

        selectedMachine = this.getAttribute("data-target");

        const mainKpiGrid = document.getElementById("main-kpi-grid");
        const mainCard = document.getElementById("main-machine-card");
        const statusWrapper = document.getElementById("status-section-wrapper");
        const analysisView = document.getElementById("analysis-view");
        const alarmsView = document.getElementById("alarms-view");

        if (selectedMachine === "analysis") {
            mainKpiGrid.style.display = "none";
            mainCard.style.display = "none";
            statusWrapper.style.display = "none";
            alarmsView.style.display = "none";
            analysisView.style.display = "flex";
            initAnalysisCharts();
        } else if (selectedMachine === "alarms") {
            mainKpiGrid.style.display = "none";
            mainCard.style.display = "none";
            statusWrapper.style.display = "none";
            analysisView.style.display = "none";
            alarmsView.style.display = "flex";
            renderAlarmsTable();
        } else {
            mainKpiGrid.style.display = "grid";
            mainCard.style.display = "flex";
            statusWrapper.style.display = "block";
            analysisView.style.display = "none";
            alarmsView.style.display = "none";

            trendChart.data.labels = [];
            trendChart.data.datasets[0].data = [];
            trendChart.data.datasets[1].data = [];
            trendChart.update();
        }
    });
});

function renderAlarmsTable() {
    const container = document.getElementById("alarms-table-container");
    if (!container) return;

    if (alarmHistory.length === 0) {
        container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">Sistemde kayıtlı aktif veya geçmiş alarm bulunmuyor.</div>`;
        return;
    }

    let rowsHtml = "";
    alarmHistory.forEach(log => {
        let badgeColor = log.status === "CRITICAL" ? "var(--color-red)" : "var(--color-orange)";
        let reason = log.temp > 35 ? `Yüksek Sıcaklık (${log.temp} °C)` : `Yüksek Titreşim (${log.vib} g)`;

        rowsHtml += `
            <div class="status-row">
                <div class="m-info-left">
                    <span class="m-info-id">${log.time}</span>
                    <span class="m-info-name"><strong>${log.id} (${log.name})</strong> — ${reason}</span>
                </div>
                <div class="status-dot" style="color: ${badgeColor};">
                    ● ${log.status}
                </div>
            </div>
        `;
    });

    container.innerHTML = rowsHtml;
}

// 1 saniyede bir güncelle
setInterval(updateDashboard, 1000);
updateDashboard();