# Mobile POS - Android Tablet Point of Sale

A fully offline-capable Point of Sale application for Android tablets, built with React and Capacitor with local SQLite database.

## Features

- **Fully offline** — all data lives in a SQLite database on the device; the
  app never contacts a server
- **Register** — product grid, search, barcode/SKU scanning straight into the
  cart, per-item and whole-basket discounts, tax, and quantities typed in for
  goods sold by weight or length (1.5 kg)
- **Sales history** — every sale by day, with its lines, customer and cashier;
  an administrator can reverse a sale (a return or a mistake), which puts the
  goods back and takes any debt off the customer's account
- **Stock for any kind of shop** — SKU and barcode per product, units (pieces,
  kilograms, litres, ...), a reorder level per product, and items that are
  billed but not stocked, such as alterations or a delivery fee
- **Stock movements are accounted for** — damage, spoilage, theft, shop use and
  physical stock takes are recorded with a reason, not edited away
- **Credit sales** — put a sale on a customer's account with part payment or
  none, see what each customer owes, and take payments against it
- **Reports** — dashboard, profit and loss, sales by product, sales trend,
  stock valuation, low stock
- **Daily backup and restore** — a PDF sales report and a full JSON data
  export, written automatically for each trading day; the JSON file restores
  the whole shop onto a new tablet
- **Cashiers and administrators** — cashiers get the register, sales history
  and customers; the back office, reversals and user accounts are for
  administrators. Each sale records who rang it up
- **Runs on any Android 6+ device**, phone or tablet, with no special
  permissions

## Building the APK

See **[BUILDING.md](BUILDING.md)** for the full build, signing, install and
first-run checklist.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ANDROID APK (Capacitor)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Frontend (Built)                   │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌──────────────────────┐   │  │
│  │  │  Components     │      │  Database Services   │   │  │
│  │  │  (Material-UI)  │◄────►│  (SQLite)            │   │  │
│  │  └─────────────────┘      └──────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│                    ┌──────────────────┐                     │
│                    │   SQLite DB      │                     │
│                    │   (Local File)   │                     │
│                    └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js v14+ (v18+ recommended)
- npm or yarn
- Android Studio (for building APK)
- Java JDK 21 (see BUILDING.md — the JDK 25 bundled with recent Android
  Studio cannot run this project's Gradle)

## Installation

### 1. Install Dependencies

```bash
cd mobile_POS
npm install
```

### 2. Initialize Capacitor (First Time Only)

```bash
# Add Android platform
npx cap add android
```

### 3. Build the React App

```bash
npm run build
```

### 4. Sync with Capacitor

```bash
npx cap sync android
```

### 5. Open in Android Studio

```bash
npx cap open android
```

### 6. Build APK

In Android Studio:
1. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. The APK will be in `android/app/build/outputs/apk/debug/`

## Development

### Run in Browser (Development)

```bash
npm start
```

This will start the development server at http://localhost:3000

Note: Some SQLite features may not work in browser mode. For full testing, use an Android emulator or device.

### Build for Android

```bash
# One command to build and sync
npm run build:android
```

Then open Android Studio and build the APK.

## Project Structure

```
src/
├── main.tsx                 # Entry point: providers, then DatabaseGate → App
├── api/                     # The facade every screen calls (index.js),
│                            # mapped onto the database services (localApi.js)
├── services/
│   ├── database/            # SQLite: schema and transactions
│   │                        # (DatabaseService.js), one service per area
│   └── backup/              # Nightly PDF + JSON export, scheduler, restore
├── components/              # Screens (register, sales, stock, users, ...)
├── reducers/, actions/      # Redux: signed-in user and the cart
└── money.ts                 # The shop's currency, used everywhere
```

## Database Schema

The app uses SQLite with the following tables:

| Table | Description |
|-------|-------------|
| users | User accounts and authentication |
| products | Product catalog |
| product_types | Product categories |
| stock | Inventory quantities |
| customers | Customer information |
| vendors | Supplier information |
| transaction_headers | Sales transactions |
| transaction_details | Sale line items |
| credit_transactions | Credit sale tracking |
| expenses | Expense records |
| expense_types | Expense categories |
| receivings | Inventory purchases |
| stock_adjustments | Damage, spoilage, theft, shop use and stock takes |
| daily_exports | Which days have been backed up |

## Default login

- **Username**: `admin`
- **Password**: `admin`

Change it from the **Users** screen before the shop opens. The app shows a
warning banner until you do, and there is no override once it is changed —
if the new password is lost, the only way back in is to reinstall, which
erases the data.

## Configuration

### Capacitor Config (`capacitor.config.json`)

```json
{
  "appId": "com.pos.mobilepos",
  "appName": "Mobile POS",
  "webDir": "build"
}
```

### Changing App ID

Before building, update the `appId` in `capacitor.config.json` to your own package name.

## Troubleshooting

### Database Not Initializing

1. Check console for errors
2. Ensure jeep-sqlite is properly loaded for web
3. On Android, check that the SQLite plugin is properly installed

### Build Errors

1. Clean the build: `rm -rf build && npm run build`
2. Sync Capacitor: `npx cap sync`
3. In Android Studio: **Build > Clean Project**

### App Crashes on Start

1. Check Android Studio Logcat for errors
2. Ensure minimum SDK version is 23+
3. Check that all Capacitor plugins are properly installed

## Not built yet

- Cloud sync between devices
- Receipt printing over Bluetooth
- Camera-based barcode scanning (a USB or Bluetooth scanner works today —
  it types the code into the search box)
- PIN login for cashiers

## License

MIT

## Support

For issues, check the main project documentation or open an issue in the repository.
