module.exports = function (context) {
  const fs = require('fs');
  //tododaniil make more specific intents
  const insertIntent = '            <intent-filter>\n' +
    '                <action android:name="android.intent.action.VIEW" />\n' +
    '                <action android:name="android.intent.action.EDIT" />\n' +
    '                <action android:name="android.intent.action.PICK" />\n' +
    '                <category android:name="android.intent.category.DEFAULT" />\n' +
    '                <category android:name="android.intent.category.BROWSABLE" />\n' +
    '                <data android:mimeType="*/*" />\n' +
    '                <data android:pathPattern="*.mbox" />\n' +
    '            </intent-filter>\n' +
    '            <intent-filter>\n' +
    '                <action android:name="android.intent.action.VIEW" />\n' +
    '                <category android:name="android.intent.category.DEFAULT" />\n' +
    '                <category android:name="android.intent.category.BROWSABLE" />\n' +
    '                <data android:host="*" android:pathPattern=".*\\\\.mbox" android:scheme="http" />\n' +
    '                <data android:host="*" android:pathPattern=".*\\\\.mbox" android:scheme="https" />\n' +
    '            </intent-filter>\n' +
    '            <intent-filter>\n' +
    '                <action android:name="android.intent.action.VIEW" />\n' +
    '                <category android:name="android.intent.category.DEFAULT" />\n' +
    '                <category android:name="android.intent.category.BROWSABLE" />\n' +
    '                <data android:mimeType="text/plain" android:scheme="http" />\n' +
    '                <data android:mimeType="text/plain" android:scheme="https" />\n' +
    '            </intent-filter>\n' +
    '            <intent-filter>\n' +
    '                <action android:name="android.intent.action.VIEW" />\n' +
    '                <category android:name="android.intent.category.DEFAULT" />\n' +
    '                <category android:name="android.intent.category.BROWSABLE" />\n' +
    '                <data android:scheme="file" />\n' +
    '                <data android:scheme="content" />\n' +
    '                <data android:mimeType="*/*" />\n' +
    '                <data android:host="*" />\n' +
    '                <data android:pathPattern=".*\\\\.mbox" />\n' +
    '                <data android:pathPattern=".*\\\\..*\\\\.mbox" />\n' +
    '                <data android:pathPattern=".*\\\\..*\\\\..*\\\\.mbox" />\n' +
    '                <data android:pathPattern=".*\\\\..*\\\\..*\\\\..*\\\\.mbox" />\n' +
    '            </intent-filter>\n';
  var manifestPath = context.opts.projectRoot + '/platforms/android/AndroidManifest.xml';
  var manifestContent = fs.readFileSync(manifestPath).toString();
  if (!manifestContent.includes(insertIntent)) {
    manifestContent = manifestContent.replace(/<activity.*android:name="MainActivity".*>\n/, '$&' + insertIntent);
    fs.writeFileSync(manifestPath, manifestContent);
    console.log('After prepare hook. Adding Mira intents to AndroidManifest.')
  }else{
    console.log('After prepare hook. Mira intents already in AndroidManifest.')
  }
}
