from flask import Flask, render_template, jsonify
from datetime import datetime
import json
import random
import math
import paho.mqtt.client as mqtt


app = Flask(__name__)


# ==========================================
# MQTT
# ==========================================

MQTT_BROKER = "192.168.137.1"
MQTT_PORT = 1883
MQTT_TOPIC = "industrial/motor1/sensors"


# ==========================================
# GERÇEK ESP32 VERİLERİ
# ==========================================

sensor_data = {
    "temperature": 0,
    "humidity": 0,
    "pressure": 0,

    "accel_x": 0,
    "accel_y": 0,
    "accel_z": 0,

    "gyro_x": 0,
    "gyro_y": 0,
    "gyro_z": 0
}


# ==========================================
# MQTT CONNECT
# ==========================================

def on_connect(client, userdata, flags, rc):

    print("FLASK MQTT BAĞLANTI KODU:", rc)

    if rc == 0:

        print("FLASK MQTT BAĞLANDI!")

        client.subscribe(MQTT_TOPIC)

        print("TOPIC ABONE OLUNDU:", MQTT_TOPIC)

    else:

        print("FLASK MQTT BAĞLANAMADI!")


# ==========================================
# MQTT MESSAGE
# ==========================================

def on_message(client, userdata, msg):

    global sensor_data

    try:

        print("MQTT MESAJI GELDİ!")
        print("Topic:", msg.topic)

        data = json.loads(msg.payload.decode())

        sensor_data.update(data)

        print("GÜNCEL SENSOR DATA:", sensor_data)

    except Exception as e:

        print("MQTT VERİ HATASI:", e)


# ==========================================
# MQTT CLIENT
# ==========================================

mqtt_client = mqtt.Client()

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect(
    MQTT_BROKER,
    MQTT_PORT,
    60
)

mqtt_client.loop_start()


# ==========================================
# GERÇEK MAKİNE - MTR-01
# ==========================================

def get_real_machine():

    temperature = sensor_data["temperature"]

    humidity = sensor_data["humidity"]

    pressure = sensor_data["pressure"]


    # --------------------------------------
    # MPU6050 ivme değerleri
    # --------------------------------------

    ax = sensor_data["accel_x"]
    ay = sensor_data["accel_y"]
    az = sensor_data["accel_z"]


    # Toplam ivme
    acceleration = math.sqrt(
        ax ** 2 +
        ay ** 2 +
        az ** 2
    )


    # Yerçekimini yaklaşık olarak çıkarıyoruz.
    # Böylece makine sabitken ~0 g civarında görünür.

    vibration = abs(acceleration - 9.81) / 9.81


    # --------------------------------------
    # MAKİNE DURUMU
    # --------------------------------------

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


# ==========================================
# SİMÜLASYON MAKİNESİ - MTR-02
# ==========================================

def get_simulated_machine():

    # Normal çalışma aralığında
    # küçük değişimler oluşturuyoruz.

    temperature = random.uniform(
        38,
        46
    )

    vibration = random.uniform(
        0.3,
        1.8
    )

    humidity = random.uniform(
        40,
        60
    )

    pressure = random.uniform(
        1000,
        1015
    )


    # Makine durumunu simüle ediyoruz.

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


# ==========================================
# DURMUŞ MAKİNE - MTR-03
# ==========================================

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


# ==========================================
# API - ANLIK VERİ
# ==========================================

@app.route("/api/sensor-data")
def sensor_data_api():

    return jsonify(sensor_data)


# ==========================================
# API - DASHBOARD VERİLERİ
# ==========================================

@app.route("/api/dashboard-data")
def dashboard_data():

    machines = [

        get_real_machine(),

        get_simulated_machine(),

        get_stopped_machine()

    ]


    running = sum(
        1 for m in machines
        if m["status"] == "RUNNING"
    )

    warning = sum(
        1 for m in machines
        if m["status"] == "WARNING"
    )

    critical = sum(
        1 for m in machines
        if m["status"] == "CRITICAL"
    )

    stopped = sum(
        1 for m in machines
        if m["status"] == "STOPPED"
    )


    return jsonify({

        "machines": machines,

        "total": len(machines),

        "running": running,

        "warning": warning,

        "critical": critical,

        "stopped": stopped,

        "time": datetime.now().strftime("%H:%M:%S")

    })


# ==========================================
# ANA SAYFA
# ==========================================

@app.route("/")
def home():

    machines = [

        get_real_machine(),

        get_simulated_machine(),

        get_stopped_machine()

    ]


    running = sum(
        1 for m in machines
        if m["status"] == "RUNNING"
    )

    warning = sum(
        1 for m in machines
        if m["status"] == "WARNING"
    )

    critical = sum(
        1 for m in machines
        if m["status"] == "CRITICAL"
    )

    stopped = sum(
        1 for m in machines
        if m["status"] == "STOPPED"
    )


    return render_template(

        "index.html",

        machines=machines,

        total=len(machines),

        running=running,

        warning=warning,

        critical=critical,

        stopped=stopped,

        current_time=datetime.now().strftime("%H:%M:%S")

    )


# ==========================================
# FLASK
# ==========================================

if __name__ == "__main__":

    app.run(
        debug=False
    )