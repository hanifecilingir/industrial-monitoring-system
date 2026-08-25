# Endüstriyel Makine Sağlık İzleme Sistemi

Bu proje, endüstriyel makinelerin çalışma durumlarının sensör verileri üzerinden izlenmesini sağlayan web tabanlı bir makine sağlık izleme sistemidir. Sistem, makineden alınan sensör verilerini kablosuz olarak sunucuya aktararak kullanıcıya anlaşılır bir dashboard üzerinden sunmaktadır.

## Proje Hakkında

Sistemde **ESP32**, **BME280** ve **MPU6050** kullanılmıştır. BME280 ile sıcaklık, nem ve basınç; MPU6050 ile ivme ve jiroskop verileri alınmaktadır.

ESP32 tarafından toplanan veriler **MQTT** protokolü kullanılarak **Mosquitto MQTT Broker** üzerinden Flask uygulamasına aktarılmaktadır. Flask tabanlı web arayüzünde sensör değerleri, makinenin çalışma durumu ve veri değişimleri grafikler üzerinden görüntülenmektedir.

### Sistem Mimarisi
---
BME280 + MPU6050
        ↓
      ESP32
        ↓
       MQTT
        ↓
Mosquitto Broker
        ↓
   Flask Server
        ↓
 Web Dashboard
```

## Kullanılan Teknolojiler

* **ESP32** – Sensör verilerinin toplanması ve iletilmesi
* **BME280** – Sıcaklık, nem ve basınç ölçümü
* **MPU6050** – İvme ve jiroskop ölçümü
* **MQTT / Mosquitto** – Veri haberleşmesi
* **Python / Flask** – Backend ve web uygulaması
* **HTML / CSS / JavaScript** – Web arayüzü
* **Chart.js** – Sensör verilerinin grafiksel gösterimi

### Temel Özellikler

* Gerçek zamanlı sensör verilerinin izlenmesi
* Makine çalışma durumunun değerlendirilmesi
* Sıcaklık ve titreşim değerlerinin takip edilmesi
* Sensör verilerinin grafiklerle görselleştirilmesi
* MQTT üzerinden kablosuz veri aktarımı
* Web tabanlı merkezi izleme paneli

## Projenin Amacı

Projenin temel amacı, endüstriyel makinelerin çalışma durumlarının sürekli olarak takip edilmesini ve sıcaklık veya titreşim gibi değerlerde meydana gelebilecek anormal değişimlerin kullanıcı tarafından kolayca fark edilebilmesini sağlamaktır.


