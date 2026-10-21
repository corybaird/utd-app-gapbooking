function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  BookingStorage.initializeSchema();

  const template = HtmlService.createTemplateFromFile('index');
  template.prefillAction = e && e.parameter ? e.parameter.action : '';
  template.prefillBookingId = e && e.parameter ? e.parameter.id : '';
  template.prefillEmail = e && e.parameter ? e.parameter.email : '';

  return template.evaluate()
    .setTitle('UTokyo Design English Conversation Session Booking')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function apiGetCalendar(weekOffset: number = 0): string {
  try {
    const data = CalendarService.getCalendarView(weekOffset);
    return JSON.stringify({ success: true, data: data });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message || 'Failed to fetch calendar' });
  }
}

function apiBookSlot(requestJson: string): string {
  try {
    const req: BookingRequest = JSON.parse(requestJson);
    const webAppUrl = ScriptApp.getService().getUrl();
    const result = BookingService.bookSlot(req, webAppUrl);
    return JSON.stringify(result);
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message || ERROR_MESSAGES.INVALID_INPUT });
  }
}

function apiCancelBooking(bookingId: string, email: string): string {
  try {
    const result = BookingService.cancelSlot(bookingId, email);
    return JSON.stringify(result);
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message || ERROR_MESSAGES.BOOKING_NOT_FOUND });
  }
}

function apiGetUserBookings(email: string): string {
  try {
    const bookings = BookingStorage.getUserBookings('', email);
    return JSON.stringify({ success: true, data: bookings });
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message || 'Failed to fetch bookings' });
  }
}

function triggerDailyReminders(): void {
  const webAppUrl = ScriptApp.getService().getUrl();
  NotificationService.sendDailyReminders(webAppUrl);
}

function setupDailyTrigger(): void {
  NotificationService.setupDailyReminderTrigger();
}

function onOpen(): void {
  SpreadsheetApp.getUi()
    .createMenu('UTokyo Design Booking System')
    .addItem('Initialize Database Sheets', 'initDatabase')
    .addItem('Setup 12:00 PM Daily Reminder Trigger', 'setupDailyTrigger')
    .addToUi();
}

function initDatabase(): void {
  BookingStorage.initializeSchema();
  SpreadsheetApp.getUi().alert('Sheets initialized successfully.');
}
