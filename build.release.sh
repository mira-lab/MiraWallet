#!/bin/bash
#необходим даунгрейд кордовы с 8 до 7.1 из за ошибок сборки

#перед билдом нужно создать кейстор для сертификата, коим подписываем релизную версию
#он создается единожды вне папки проекта, чтобы не перетираться и не висеть в гите (он хоть и запаролен но ну его нахуй)
if [ -e "../copay.keystore" ]
then
    echo "keystore exists"
else
    keytool -genkey -v -keystore ../copay.keystore -alias copay_keystore -keyalg RSA -keysize 2048 -validity 10000
fi

#команды билда
npm run clean-all
npm run apply:mira
ionic cordova platform add android --save
npm run fix:fcm
npm run build:android
npm run build:android-release
npm run sign:android

echo "#######################"
echo "#######################"
echo "подписаный apk загржается на телефон следующей командой"
echo "adb install -r platforms/android/build/outputs/apk/android-release-signed-aligned.apk"

