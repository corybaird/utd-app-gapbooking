# UTokyo English Conversation Booking System

TypeScript Google Apps Script web application for managing English conversation session bookings backed by Google Sheets

---

## Active Deployment
* Deployment ID: `AKfycbxm0xzFalau37q7cFKql_bJo6X9J559fp_lbh11D5Kt-GinBs9W7Vm_pnzrS-qW1Uqs`
* Web App URL: https://script.google.com/a/macros/g.ecc.u-tokyo.ac.jp/s/AKfycbxm0xzFalau37q7cFKql_bJo6X9J559fp_lbh11D5Kt-GinBs9W7Vm_pnzrS-qW1Uqs/exec

---

## Project Conditions & Specifications

### Basic Session Rules
* 30 minutes duration per slot
* Operating days: Monday through Friday (JST)
* Excluded dates: Saturdays, Sundays, Japanese national public holidays
* Daily time slots:
  * Morning: 10:00, 10:30, 11:00, 11:30
  * Afternoon: 15:00, 15:30, 16:00, 16:30
* Delivery mode: Online via Zoom

### Courses & Capacities
| Course ID | Theme | Format | Capacity | Slots / Day |
| :--- | :--- | :--- | :--- | :--- |
| course_1 | Theme A | Group (1:3) | 3 | 8 |
| course_2 | Theme B | Group (1:3) | 3 | 8 |
| course_3 | Theme A | One-on-one (1:1) | 1 | 8 |
| course_4 | Theme B | One-on-one (1:1) | 1 | 8 |
| course_5 | Theme A or B | One-on-one (1:1) | 1 | 8 |

* Total daily slots: 40
* Maximum daily participants: 72

### Zoom Routing Matrix
* 10 distinct Zoom URLs assigned across courses
* Alternating URLs between odd and even time slots:
  * 10:00, 11:00, 15:00, 16:00: Odd URLs (1, 3, 5, 7, 9)
  * 10:30, 11:30, 15:30, 16:30: Even URLs (2, 4, 6, 8, 10)
* Monthly rotation of Zoom URLs via admin configuration

### Booking Rules & Quotas
* Maximum 1 booking slot per user per day across all courses
* Maximum 5 active booking slots per user per week
* Booking modifications require cancelling existing slot first then rebooking
* Weekly booking deadline: Fridays at 23:29 for following week
* Saturday 00:00 calendar rollover: opens two weeks ahead through one month ahead
* Calendar display: 1 week at a time, maximum 1 month into future, 1 week into past

### Form Validation
* Temporary student ID: Half-width alphanumeric
* Family name: Half-width alphabetic
* Given name: Half-width alphabetic
* Email address: Half-width alphanumeric containing @

### Concurrency & Data Integrity
* `LockService.getScriptLock()` prevents race conditions during slot reservations
* Capacity and quota verification executed atomically inside lock
* Standard error responses:
  * Booking deadline passed: "The booking period has ended."
  * Capacity reached: "This course has reached capacity."
  * Duplicate same-day booking: "You already have another booking on this day."
  * Weekly limit reached: "You have reached the limit of five bookings per week."

### Notifications
* Booking confirmation email with Zoom link and cancellation instructions
* Cancellation confirmation email
* Automated reminder email dispatched at 12:00 PM on the day preceding session

### Storage Schema (Google Sheets)
* `Booking ID`: UUID
* `User ID`: Student ID
* `Family Name`: String
* `Given Name`: String
* `Email Address`: String
* `Booking Date`: YYYY-MM-DD
* `Start Time`: HH:mm
* `Course ID`: String
* `Course Name`: String
* `Booking Timestamp`: ISO timestamp
* `Status`: Booked / Cancelled
* `Cancellation Timestamp`: ISO timestamp or empty

### Privacy & Access Control
* Direct Google Sheets access restricted to administrators
* General user interface masks all personal information of other participants

---

## Local Setup & Deployment

### 1. Prerequisites
* Node.js v18 or higher
* Google account with Google Apps Script API enabled (`script.google.com/home/usersettings`)

### 2. Install Clasp & Dependencies
```bash
npm install
```

### 3. Authenticate with Google Drive
```bash
npx clasp login
```

### 4. Link Google Spreadsheet
* Create a new Google Spreadsheet in Google Drive
* Bind clasp to the spreadsheet:
```bash
npx clasp create --type sheets --title "UTokyo Booking System" --rootDir ./src
```
* Or update `.clasp.json` with existing script ID:
```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "./src"
}
```

### 5. Build & Push Code
```bash
npm run push
```

### 6. Deploy Web App
* Deploy via CLI:
```bash
npx clasp deploy --description "Production Release"
```
* Or open web editor:
```bash
npx clasp open
```
* In editor navigate to **Deploy > New deployment > Web app**
  * Execute as: **Me**
  * Who has access: **Anyone with Google Account** or **UTokyo Domain Users**

### 7. Initialize Daily Reminder Trigger
* Run `setupDailyTrigger()` once from Apps Script console or script editor
