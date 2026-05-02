# Mobile POS - Android Tablet Point of Sale

A fully offline-capable Point of Sale application for Android tablets, built with React and Capacitor with local SQLite database.

## Features

- **Fully Offline**: All data stored locally in SQLite database
- **Complete POS Functionality**: Products, Sales, Inventory, Customers, Expenses
- **Stock Management**: Automatic stock tracking with sales deduction and returns
- **Credit Sales**: Track customer credit and outstanding balances
- **Reports**: Dashboard, Profit/Loss, Sales by Product, Low Stock Alerts
- **Responsive UI**: Optimized for tablet screens

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
- Java JDK 11+

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
mobile_POS/
├── public/                    # Static assets
├── src/
│   ├── api/
│   │   ├── index.js          # API adapter (uses local services)
│   │   └── localApi.js       # Maps to SQLite services
│   ├── components/           # React components
│   │   ├── DatabaseProvider.js  # DB initialization wrapper
│   │   └── ...               # Other components
│   ├── services/
│   │   └── database/         # SQLite database services
│   │       ├── DatabaseService.js    # Core DB connection
│   │       ├── ProductsService.js    # Products & Stock
│   │       ├── CustomersService.js   # Customers
│   │       ├── VendorsService.js     # Vendors
│   │       ├── SalesService.js       # Transactions & Cart
│   │       ├── ReportsService.js     # Analytics
│   │       ├── ExpensesService.js    # Expenses
│   │       ├── ReceivingsService.js  # Inventory
│   │       └── UsersService.js       # Authentication
│   ├── actions/              # Redux actions
│   ├── reducers/             # Redux reducers
│   └── index.js              # App entry point
├── android/                  # Android native project (after cap add)
├── capacitor.config.json     # Capacitor configuration
└── package.json
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

## Default Login

- **Username**: `admin`
- **Password**: `admin`

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
2. Ensure minimum SDK version is 22+
3. Check that all Capacitor plugins are properly installed

## Future Enhancements

- [ ] Cloud sync when online
- [ ] Receipt printing via Bluetooth
- [ ] Barcode scanner integration
- [ ] Data backup/restore
- [ ] Multi-user support with PIN login

## License

MIT

## Support

For issues, check the main project documentation or open an issue in the repository.
