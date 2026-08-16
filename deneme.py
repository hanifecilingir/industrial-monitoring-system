import paho.mqtt.client as mqtt
import json

BROKER = "192.168.137.1"
PORT = 1883
TOPIC = "industrial/motor1/sensors"


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("MQTT broker'a baglandi!")
        client.subscribe(TOPIC)
        print(f"Topic dinleniyor: {TOPIC}")
    else:
        print("MQTT baglanti hatasi:", rc)


def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())

        print("\n==============================")
        print("      SENSOR VERILERI")
        print("==============================")

        print(f"Sicaklik : {data['temperature']} °C")
        print(f"Nem      : {data['humidity']} %")
        print(f"Basinc   : {data['pressure']} hPa")

        print()
        print(f"Accel X  : {data['accel_x']} m/s²")
        print(f"Accel Y  : {data['accel_y']} m/s²")
        print(f"Accel Z  : {data['accel_z']} m/s²")

        print()
        print(f"Gyro X   : {data['gyro_x']} rad/s")
        print(f"Gyro Y   : {data['gyro_y']} rad/s")
        print(f"Gyro Z   : {data['gyro_z']} rad/s")

    except Exception as e:
        print("Veri islenirken hata:", e)


client = mqtt.Client()

client.on_connect = on_connect
client.on_message = on_message

print("MQTT broker'a baglaniliyor...")

client.connect(BROKER, PORT, 60)

client.loop_forever()