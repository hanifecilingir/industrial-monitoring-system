from flask import Flask, render_template, jsonify
from datetime import datetime
import json
import random
import math
import paho.mqtt.client as mqtt
# 1. FLASK & MQTT TANIMLARI
# Flask uygulaması oluşturulur.
app = Flask(__name__)
# MQTT broker'ın IP adresi ve haberleşme portu tanımlanır.
MQTT_BROKER = "192.168.137.1"
MQTT_PORT = 1883
# ESP32'nin sensör verilerini yayınladığı MQTT topic'i belirlenir.
MQTT_TOPIC = "industrial/motor1/sensors"
# MQTT üzerinden alınan son sensör değerlerinin tutulduğu sözlük.
sensor_data = {
    "temperature": 0.0,
    "humidity": 0.0,
    "pressure": 0.0,
    "accel_x": 0.0,
    "accel_y": 0.0,
    "accel_z": 0.0,
    "gyro_x": 0.0,
    "gyro_y": 0.0,
    "gyro_z": 0.0
}
# MQTT broker'a bağlantı gerçekleştirildiğinde çalışan callback fonksiyonudur
def on_connect(client, userdata, flags, rc):
    print("FLASK MQTT BAĞLANTI KODU:", rc)
    if rc == 0:
        print("FLASK MQTT BAĞLANDI!")
        client.subscribe(MQTT_TOPIC)
        print("TOPIC ABONE OLUNDU:", MQTT_TOPIC)
    else:
        print("FLASK MQTT BAĞLANAMADI!")
# ESP32 tarafından MQTT topic'i üzerinden gönderilen mesajlar
# alındığında çalışan callback fonksiyonudur.
def on_message(client, userdata, msg):
    global sensor_data
    try:
        payload = json.loads(msg.payload.decode())
        # Gelen veriyi ana sözlüğe aktar
        sensor_data.update(payload)
    except Exception as e:
        print("MQTT veri işleme hatası:", e)
# MQTT istemcisi oluşturulur.
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()
except Exception as e:
    print("MQTT Bağlantı Hatası:", e)
# 2. MAKİNE DURUM FONKSİYONLARI
# Gerçek sensör verilerini kullanan makinenin durumunu hesaplar.
def get_real_machine():
    temperature = sensor_data["temperature"]
    humidity = sensor_data["humidity"]
    pressure = sensor_data["pressure"]
    ax = sensor_data["accel_x"]
    ay = sensor_data["accel_y"]
    az = sensor_data["accel_z"]
    acceleration = math.sqrt(ax**2 + ay**2 + az**2)
    vibration = abs(acceleration - 9.81) / 9.81
 # Sıcaklık ve titreşim değerlerine göre makinenin çalışma durumu belirlenir.
    if temperature < 30 and vibration < 1.5:
        status = "RUNNING"
        color = "green"
    elif temperature < 35 and vibration < 2.5:
        status = "WARNING"
        color = "orange"
    else:
        status = "CRITICAL"
        color = "red"
    return {
        "id": "MTR-01",
        "name": "Conveyor Motor",
        "status": status,
        "color": color,
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "pressure": round(pressure, 2),
        "vibration": round(vibration, 3),
        "source": "REAL",
        "show_data": True
    }
# 3. SİMÜLE EDİLEN MAKİNE
# Gerçek sensör yerine rastgele oluşturulan değerleri kullanan
# ikinci makinenin durumunu hesaplar.
def get_simulated_machine():
    # Test amacıyla sıcaklık, titreşim, nem ve basınç değerleri
    # belirlenen aralıklarda rastgele oluşturulur.
    temperature = random.uniform(38, 46)
    vibration = random.uniform(0.3, 1.8)
    humidity = random.uniform(40, 60)
    pressure = random.uniform(1000, 1015)
    if temperature < 42 and vibration < 1.2:
        status = "RUNNING"
        color = "green"
    elif temperature < 46 and vibration < 1.8:
        status = "WARNING"
        color = "orange"
    else:
        status = "CRITICAL"
        color = "red"
    return {
        "id": "MTR-02",
        "name": "Hydraulic Pump",
        "status": status,
        "color": color,
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
        "pressure": round(pressure, 2),
        "vibration": round(vibration, 3),
        "source": "SIMULATED",
        "show_data": True
    }
# 4. DURDURULMUŞ MAKİNE
def get_stopped_machine():
    return {
        "id": "MTR-03",
        "name": "Cooling Fan",
        "status": "STOPPED",
        "color": "gray",
        "temperature": "--",
        "humidity": "--",
        "pressure": "--",
        "vibration": "--",
        "source": "NONE",
        "show_data": False
    }
# 3. API & ROUTE ENDPOINT'LERİ
# Güncel sensör verilerini JSON formatında döndüren API endpoint'i.
@app.route("/api/sensor-data")
def sensor_data_api():
    return jsonify(sensor_data)
# Dashboard'da kullanılacak tüm makine bilgilerini sağlayan API endpoint'i.
@app.route("/api/dashboard-data")
def dashboard_data():
    machines = [
        get_real_machine(),
        get_simulated_machine(),
        get_stopped_machine()
    ]
     # Her durumdaki makine sayısı hesaplanır.
    running = sum(1 for m in machines if m["status"] == "RUNNING")
    warning = sum(1 for m in machines if m["status"] == "WARNING")
    critical = sum(1 for m in machines if m["status"] == "CRITICAL")
    stopped = sum(1 for m in machines if m["status"] == "STOPPED")

    return jsonify({
        "machines": machines,
        "total": len(machines),
        "running": running,
        "warning": warning,
        "critical": critical,
        "stopped": stopped,
        "time": datetime.now().strftime("%H:%M:%S")
    })
# 6. ANA SAYFA
@app.route("/")
def home():
    # Üç makinenin güncel durumları oluşturulur.
    machines = [
        get_real_machine(),
        get_simulated_machine(),
        get_stopped_machine()
    ]
    return render_template(
        "index.html",
        machines=machines,
        total=len(machines),
        running=sum(1 for m in machines if m["status"] == "RUNNING"),
        warning=sum(1 for m in machines if m["status"] == "WARNING"),
        critical=sum(1 for m in machines if m["status"] == "CRITICAL"),
        stopped=sum(1 for m in machines if m["status"] == "STOPPED"),
        current_time=datetime.now().strftime("%H:%M:%S")
    )
# 7. FLASK UYGULAMASINI ÇALIŞTIRMA
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)