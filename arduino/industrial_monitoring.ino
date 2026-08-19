#include <WiFi.h>
#include <PubSubClient.h>

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>

// ==========================================
// Wi-Fi
// ==========================================

const char* ssid = "hanife";
const char* password = "12345678";

// ==========================================
// MQTT
// ==========================================

const char* mqtt_server = "192.168.137.1";
const int mqtt_port = 1883;

const char* mqtt_topic = "industrial/motor1/sensors";

// ==========================================
// I2C
// ==========================================

#define SDA_PIN 21
#define SCL_PIN 22

// ==========================================
// Sensörler
// ==========================================

Adafruit_MPU6050 mpu;
Adafruit_BME280 bme;

// ==========================================
// MQTT
// ==========================================

WiFiClient espClient;
PubSubClient client(espClient);

// ==========================================
// Zamanlama
// ==========================================

unsigned long lastMsg = 0;
const unsigned long interval = 1000;


// ==========================================
// Wi-Fi bağlantısı
// ==========================================

void setup_wifi()
{
  Serial.println();
  Serial.print("Wi-Fi'ye baglaniliyor: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi BAGLANDI!");

  Serial.print("ESP32 IP adresi: ");
  Serial.println(WiFi.localIP());
}


// ==========================================
// MQTT bağlantısı
// ==========================================

void reconnectMQTT()
{
  while (!client.connected())
  {
    Serial.print("MQTT broker'a baglaniliyor...");

    String clientId = "ESP32-Motor1";

    if (client.connect(clientId.c_str()))
    {
      Serial.println(" BAGLANDI!");
    }
    else
    {
      Serial.print(" HATA, kod = ");
      Serial.println(client.state());

      delay(5000);
    }
  }
}


// ==========================================
// SETUP
// ==========================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println(" INDUSTRIAL MOTOR MONITORING SYSTEM");
  Serial.println("======================================");


  // --------------------------------------
  // I2C başlat
  // --------------------------------------

  Wire.begin(SDA_PIN, SCL_PIN);

  Serial.println("I2C baslatildi.");
  Serial.println("SDA = GPIO 21");
  Serial.println("SCL = GPIO 22");


  // --------------------------------------
  // MPU6050
  // --------------------------------------

  Serial.println();
  Serial.println("MPU6050 baslatiliyor...");

  if (!mpu.begin(0x68, &Wire))
  {
    Serial.println("HATA: MPU6050 bulunamadi!");

    while (1)
    {
      delay(10);
    }
  }

  Serial.println("MPU6050 bulundu!");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);


  // --------------------------------------
  // BME280
  // --------------------------------------

  Serial.println();
  Serial.println("BME280 baslatiliyor...");

  if (!bme.begin(0x76, &Wire))
  {
    Serial.println("0x76 adresinde BME280 bulunamadi.");
    Serial.println("0x77 deneniyor...");

    if (!bme.begin(0x77, &Wire))
    {
      Serial.println("HATA: BME280 bulunamadi!");

      while (1)
      {
        delay(10);
      }
    }
  }

  Serial.println("BME280 bulundu!");


  // --------------------------------------
  // Wi-Fi
  // --------------------------------------

  setup_wifi();


  // --------------------------------------
  // MQTT
  // --------------------------------------

  client.setServer(mqtt_server, mqtt_port);

  Serial.println();
  Serial.println("Sistem hazir!");
}


// ==========================================
// LOOP
// ==========================================

void loop()
{
  // MQTT bağlantısını kontrol et

  if (!client.connected())
  {
    reconnectMQTT();
  }

  client.loop();


  // --------------------------------------
  // Her 1 saniyede bir veri gönder
  // --------------------------------------

  unsigned long now = millis();

  if (now - lastMsg >= interval)
  {
    lastMsg = now;


    // ======================================
    // MPU6050 VERİLERİ
    // ======================================

    sensors_event_t acceleration;
    sensors_event_t gyro;
    sensors_event_t temperature;

    mpu.getEvent(
      &acceleration,
      &gyro,
      &temperature
    );

    float accelX = acceleration.acceleration.x;
    float accelY = acceleration.acceleration.y;
    float accelZ = acceleration.acceleration.z;

    float gyroX = gyro.gyro.x;
    float gyroY = gyro.gyro.y;
    float gyroZ = gyro.gyro.z;

    float mpuTemp = temperature.temperature;


    // ======================================
    // BME280 VERİLERİ
    // ======================================

    float bmeTemp = bme.readTemperature();

    float humidity = bme.readHumidity();

    float pressure = bme.readPressure() / 100.0F;


    // ======================================
    // MQTT JSON MESAJI
    // ======================================

    char payload[500];

    snprintf(
      payload,
      sizeof(payload),

      "{"
      "\"temperature\":%.2f,"
      "\"humidity\":%.2f,"
      "\"pressure\":%.2f,"
      "\"accel_x\":%.2f,"
      "\"accel_y\":%.2f,"
      "\"accel_z\":%.2f,"
      "\"gyro_x\":%.2f,"
      "\"gyro_y\":%.2f,"
      "\"gyro_z\":%.2f,"
      "\"mpu_temperature\":%.2f"
      "}",

      bmeTemp,
      humidity,
      pressure,

      accelX,
      accelY,
      accelZ,

      gyroX,
      gyroY,
      gyroZ,

      mpuTemp
    );


    // ======================================
    // SERIAL MONITOR
    // ======================================

    Serial.println();
    Serial.println("--------------------------------------");

    Serial.print("BME280 Temperature : ");
    Serial.print(bmeTemp);
    Serial.println(" °C");

    Serial.print("BME280 Humidity    : ");
    Serial.print(humidity);
    Serial.println(" %");

    Serial.print("BME280 Pressure    : ");
    Serial.print(pressure);
    Serial.println(" hPa");

    Serial.println();

    Serial.print("MPU6050 Accel X    : ");
    Serial.println(accelX);

    Serial.print("MPU6050 Accel Y    : ");
    Serial.println(accelY);

    Serial.print("MPU6050 Accel Z    : ");
    Serial.println(accelZ);

    Serial.println();

    Serial.print("MPU6050 Gyro X     : ");
    Serial.println(gyroX);

    Serial.print("MPU6050 Gyro Y     : ");
    Serial.println(gyroY);

    Serial.print("MPU6050 Gyro Z     : ");
    Serial.println(gyroZ);

    Serial.println();

    Serial.print("MQTT JSON: ");
    Serial.println(payload);


    // ======================================
    // MQTT PUBLISH
    // ======================================

    if (client.publish(mqtt_topic, payload))
    {
      Serial.println("MQTT -> Veri gonderildi!");
    }
    else
    {
      Serial.println("MQTT -> Veri gonderilemedi!");
    }
  }
}