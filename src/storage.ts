class BookingStorage {
  private static _getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    if (APP_CONFIG.SPREADSHEET_ID) {
      return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
    }
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '');
  }

  public static getOrCreateSheet(sheetName: string, headers: string[]): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = this._getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
    return sheet;
  }

  private static _formatDateValue(val: any): string {
    if (!val) return '';
    if (val.getTime) {
      try {
        return Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Tokyo', 'yyyy-MM-dd');
      } catch (e) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    let str = String(val).trim();
    if (str.startsWith("'")) str = str.substring(1);
    if (str.length > 10 && (str.indexOf('GMT') !== -1 || str.indexOf('T') !== -1)) {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    return str;
  }

  private static _formatTimeValue(val: any): string {
    if (!val) return '';
    if (val.getTime) {
      try {
        return Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Tokyo', 'HH:mm');
      } catch (e) {
        const h = String(val.getHours()).padStart(2, '0');
        const m = String(val.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
    }
    let str = String(val).trim();
    if (str.startsWith("'")) str = str.substring(1);
    if (str.length > 5 && (str.indexOf('GMT') !== -1 || str.indexOf('T') !== -1)) {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        const h = String(parsed.getHours()).padStart(2, '0');
        const m = String(parsed.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
    }
    return str;
  }

  public static initializeSchema(): void {
    const bookingHeaders = [
      'Booking ID',
      'User ID',
      'Family name',
      'Given name',
      'Email address',
      'Booking date',
      'Start time',
      'Course ID',
      'Course name',
      'Booking timestamp',
      'Status',
      'Cancellation timestamp'
    ];
    this.getOrCreateSheet(SHEET_NAMES.BOOKINGS, bookingHeaders);

    const blackoutHeaders = ['Date', 'Reason'];
    this.getOrCreateSheet(SHEET_NAMES.BLACKOUT_DATES, blackoutHeaders);
  }

  public static getAllActiveBookings(): BookingRecord[] {
    const sheet = this.getOrCreateSheet(SHEET_NAMES.BOOKINGS, []);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const bookings: BookingRecord[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[10] === 'Booked') {
        bookings.push({
          bookingId: String(row[0]),
          userId: String(row[1]),
          familyName: String(row[2]),
          givenName: String(row[3]),
          email: String(row[4]),
          bookingDate: this._formatDateValue(row[5]),
          startTime: this._formatTimeValue(row[6]),
          courseId: String(row[7]),
          courseName: String(row[8]),
          bookingTimestamp: String(row[9]),
          status: 'Booked',
          cancellationTimestamp: String(row[11] || '')
        });
      }
    }
    return bookings;
  }

  public static getBookingsByDateAndCourse(dateStr: string, courseId: string, timeStr: string): BookingRecord[] {
    return this.getAllActiveBookings().filter(b => 
      b.bookingDate === dateStr && b.courseId === courseId && b.startTime === timeStr
    );
  }

  public static getActiveBookingsForUser(userId: string, email: string): BookingRecord[] {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUser = userId.trim();
    return this.getAllActiveBookings().filter(b => 
      b.userId === normalizedUser || b.email.toLowerCase() === normalizedEmail
    );
  }

  public static getUserBookings(userId: string, email: string): BookingRecord[] {
    const sheet = this.getOrCreateSheet(SHEET_NAMES.BOOKINGS, []);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUser = userId.trim();
    const bookings: BookingRecord[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowUserId = String(row[1]).trim();
      const rowEmail = String(row[4]).trim().toLowerCase();
      if ((normalizedUser && rowUserId === normalizedUser) || (normalizedEmail && rowEmail === normalizedEmail)) {
        bookings.push({
          bookingId: String(row[0]),
          userId: rowUserId,
          familyName: String(row[2]),
          givenName: String(row[3]),
          email: String(row[4]),
          bookingDate: this._formatDateValue(row[5]),
          startTime: this._formatTimeValue(row[6]),
          courseId: String(row[7]),
          courseName: String(row[8]),
          bookingTimestamp: String(row[9]),
          status: row[10] === 'Cancelled' ? 'Cancelled' : 'Booked',
          cancellationTimestamp: String(row[11] || '')
        });
      }
    }
    return bookings;
  }

  public static saveBooking(record: BookingRecord): void {
    const sheet = this.getOrCreateSheet(SHEET_NAMES.BOOKINGS, []);
    sheet.appendRow([
      record.bookingId,
      record.userId,
      record.familyName,
      record.givenName,
      record.email,
      `'${record.bookingDate}`,
      `'${record.startTime}`,
      record.courseId,
      record.courseName,
      record.bookingTimestamp,
      record.status,
      record.cancellationTimestamp
    ]);
  }

  public static cancelBooking(bookingId: string, email: string): BookingRecord | null {
    const sheet = this.getOrCreateSheet(SHEET_NAMES.BOOKINGS, []);
    const data = sheet.getDataRange().getValues();
    const normalizedEmail = email.trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === bookingId && String(data[i][4]).trim().toLowerCase() === normalizedEmail && data[i][10] === 'Booked') {
        const rowNumber = i + 1;
        const now = new Date().toISOString();
        sheet.getRange(rowNumber, 11).setValue('Cancelled');
        sheet.getRange(rowNumber, 12).setValue(now);

        return {
          bookingId: String(data[i][0]),
          userId: String(data[i][1]),
          familyName: String(data[i][2]),
          givenName: String(data[i][3]),
          email: String(data[i][4]),
          bookingDate: this._formatDateValue(data[i][5]),
          startTime: this._formatTimeValue(data[i][6]),
          courseId: String(data[i][7]),
          courseName: String(data[i][8]),
          bookingTimestamp: String(data[i][9]),
          status: 'Cancelled',
          cancellationTimestamp: now
        };
      }
    }
    return null;
  }

  public static getBlackoutDates(): string[] {
    const sheet = this.getOrCreateSheet(SHEET_NAMES.BLACKOUT_DATES, []);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const blackoutDates: string[] = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        blackoutDates.push(this._formatDateValue(data[i][0]));
      }
    }
    return blackoutDates;
  }
}
