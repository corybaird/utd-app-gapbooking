class AdminService {
  public static getAllBookings(): BookingRecord[] {
    const sheet = BookingStorage.getOrCreateSheet(SHEET_NAMES.BOOKINGS, []);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const bookings: BookingRecord[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      bookings.push({
        bookingId: String(row[0]),
        userId: String(row[1]),
        familyName: String(row[2]),
        givenName: String(row[3]),
        email: String(row[4]),
        bookingDate: String(row[5]),
        startTime: String(row[6]),
        courseId: String(row[7]),
        courseName: String(row[8]),
        bookingTimestamp: String(row[9]),
        status: row[10] as ('Booked' | 'Cancelled'),
        cancellationTimestamp: String(row[11] || '')
      });
    }
    return bookings;
  }

  public static addBlackoutDate(dateStr: string, reason: string): void {
    const sheet = BookingStorage.getOrCreateSheet(SHEET_NAMES.BLACKOUT_DATES, ['Date', 'Reason']);
    sheet.appendRow([dateStr, reason]);
  }

  public static adminCancelBooking(bookingId: string): boolean {
    const sheet = BookingStorage.getOrCreateSheet(SHEET_NAMES.BOOKINGS, []);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === bookingId && data[i][10] === 'Booked') {
        const rowNumber = i + 1;
        const now = new Date().toISOString();
        sheet.getRange(rowNumber, 11).setValue('Cancelled');
        sheet.getRange(rowNumber, 12).setValue(now);
        return true;
      }
    }
    return false;
  }
}
