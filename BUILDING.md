# Building and installing the APK

The app targets **any Android device running Android 6.0 (API 23) or later** —
phone or tablet, any manufacturer. It needs no special permissions, no
"All files access" grant, and no vendor-specific setup. If a step below asks
you to change a device setting, something has gone wrong; open an issue
rather than working around it.

## What you need

- Node.js 18 or later
- Android Studio (for the SDK and for signing a release build)
- JDK 21 for Gradle. Recent Android Studio releases bundle JDK 25, which this
  project's Gradle cannot run on ("Unsupported class file major version
  69"). In Android Studio set **Settings → Build, Execution, Deployment →
  Build Tools → Gradle → Gradle JDK** to a version 21 JDK (the dropdown can
  download one); on the command line point `JAVA_HOME` at a JDK 21
- A USB cable, or a way to copy an APK onto the device

## 1. Install dependencies

```bash
npm install
```

## 2. Build the web app and sync it into the Android project

```bash
npm run build:android
```

That runs the Vite build, copies the output into `android/`, and syncs the
Capacitor plugins. Run it again after every code change.

## 3. Produce an APK

### Debug build (quickest, for trying it out)

```bash
cd android
./gradlew assembleDebug
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Release build (what you install in a shop)

A release APK must be signed, or Android will refuse to install it.

1. Create a keystore once, and keep it somewhere safe — losing it means you
   can never update an installed app in place:

   ```bash
   keytool -genkey -v -keystore pos-release.keystore \
     -alias pos -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Open the `android/` folder in Android Studio.
3. **Build → Generate Signed Bundle / APK → APK**, choose the keystore, pick
   the `release` variant, and build.

The APK lands at `android/app/build/outputs/apk/release/`.

Bump `versionCode` (an integer, must increase every release) and
`versionName` in `android/app/build.gradle` before each new build, otherwise
Android will not install the update over the old one.

## 4. Install it on the device

Over USB with debugging enabled:

```bash
adb install -r app-release.apk
```

Or copy the APK to the device and open it with a file manager. Android will
ask permission to install from that source the first time — this is the
normal sideloading prompt, and is the only prompt the app needs.

## 5. First run, before the shop opens

1. Sign in as `admin` / `admin`.
2. Go to **Users**, tap the admin account, and set a real password. The app
   shows a warning banner until you do. There is no way in and no back door
   once the password is changed, so write it down somewhere safe.
3. Add a cashier account for each person who works the till. Cashiers see
   the register, the sales history and customers; everything else, and
   reversing a sale, is for administrators. If a cashier forgets their
   password, an administrator sets a new one from **Users**.
4. Set up **Product types**, then add your products under **Products**.
5. Check **Stock** shows what you actually have on the shelves.

## Where the data lives

Everything is in a local SQLite database on the device. The app never
contacts a server, so it works with no internet connection at all.

A daily export runs at 00:30 for the previous day, writing a PDF sales
report and a full JSON data backup to the app's own folder on shared
storage:

```
Android/data/com.pos.mobilepos/files/POS/Daily/
```

A copy is also attempted in the shared `Documents/POS/Daily/` folder, which
is easier to reach from a file manager or over USB. That copy is a
convenience only — the backup succeeds either way.

If the tablet was off at 00:30, the export runs for every missed day the
next time the app is opened. Nothing needs to run in the background, so no
autostart or battery exemption is required on any device.

You can also trigger an export by hand from the **Backup** screen.

### Moving to a new tablet

Install the app on the new tablet, sign in as `admin` / `admin`, open
**Backup**, choose **Choose backup file** and pick the latest
`…-pos-backup.json` (copy it over USB into `Download` or `Documents` first if
it is not already there). Everything — products, stock, sales, customers,
balances and user accounts — is replaced by what is in the file, and you
sign in again with the passwords from the old tablet. The data that was on
the tablet is saved as a `before-restore-….json` copy first.

**Copy the backups off the device regularly.** They are the only copy of the
shop's records, and a lost or broken tablet takes them with it.

## Troubleshooting

**"App not installed"** — an APK signed with a different key is already
installed. Uninstall the old one first (this deletes its data, so export a
backup first).

**The app opens to an error screen** — the database failed to initialise.
Tap Retry. If it persists, the device storage may be full.

**Sales are landing on the wrong day** — check the device's date, time and
timezone. The app books each sale to the local calendar day.

**Backups are not appearing** — check the path above with a file manager or
over USB. Android 11 and later hide `Android/data` from some file managers;
connecting the device to a computer over USB will still show it.
