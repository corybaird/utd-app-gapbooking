class NotificationService {
  public static getZoomUrl(courseId: string, timeStr: string): string {
    const isOdd = ['10:00', '11:00', '15:00', '16:00'].includes(timeStr);
    const courseZoom = ZOOM_URL_MAPPING[courseId] || { odd: 'https://zoom.us', even: 'https://zoom.us' };
    return isOdd ? courseZoom.odd : courseZoom.even;
  }

  public static sendBookingConfirmation(record: BookingRecord, webAppUrl: string): void {
    const zoomUrl = this.getZoomUrl(record.courseId, record.startTime);
    const cancelUrl = `${webAppUrl}?action=cancel&id=${record.bookingId}&email=${encodeURIComponent(record.email)}`;

    const subject = `[UTokyo English Sessions] Booking Confirmation: ${record.bookingDate} ${record.startTime}`;
    const body = `Dear ${record.givenName} ${record.familyName},

Thank you for booking an English conversation session. Your reservation has been confirmed.

[Booking Details]
Booking ID: ${record.bookingId}
Participant: ${record.givenName} ${record.familyName} (Student ID: ${record.userId})
Date: ${record.bookingDate}
Time: ${record.startTime} (JST, 30 minutes)
Course: ${record.courseName}
Zoom Link: ${zoomUrl}

[Cancellation Policy]
Bookings can be changed or cancelled until Friday 23:29 JST before the session week.
To cancel your reservation, please visit the booking portal or click the cancellation link below:
${cancelUrl}

[Contact Information]
UTokyo English Session Administration Office
Email: ${APP_CONFIG.SUPPORT_EMAIL}
`;

    MailApp.sendEmail({
      to: record.email,
      subject: subject,
      body: body
    });
  }

  public static sendCancellationConfirmation(record: BookingRecord): void {
    const subject = `[UTokyo English Sessions] Cancellation Notice: ${record.bookingDate} ${record.startTime}`;
    const body = `Dear ${record.givenName} ${record.familyName},

Your booking for the English conversation session has been cancelled as requested.

[Cancelled Session Details]
Booking ID: ${record.bookingId}
Date: ${record.bookingDate}
Time: ${record.startTime} (JST, 30 minutes)
Course: ${record.courseName}

If you wish to rebook for another session, please visit the booking portal.

[Contact Information]
UTokyo English Session Administration Office
Email: ${APP_CONFIG.SUPPORT_EMAIL}
`;

    MailApp.sendEmail({
      to: record.email,
      subject: subject,
      body: body
    });
  }

  public static sendDailyReminders(webAppUrl: string): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${year}-${month}-${day}`;

    const activeBookings = BookingStorage.getAllActiveBookings().filter(b => b.bookingDate === tomorrowStr);

    for (const record of activeBookings) {
      const zoomUrl = this.getZoomUrl(record.courseId, record.startTime);
      const subject = `[Reminder] Your UTokyo English Conversation Session Tomorrow: ${record.startTime}`;
      const body = `Dear ${record.givenName} ${record.familyName},

This is a reminder for your upcoming English conversation session scheduled for tomorrow.

[Session Details]
Date: ${record.bookingDate}
Time: ${record.startTime} (JST)
Course: ${record.courseName}
Zoom Link: ${zoomUrl}

Please ensure you join on time.

[Contact Information]
UTokyo English Session Administration Office
Email: ${APP_CONFIG.SUPPORT_EMAIL}
`;

      MailApp.sendEmail({
        to: record.email,
        subject: subject,
        body: body
      });
    }
  }

  public static setupDailyReminderTrigger(): void {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === 'triggerDailyReminders') {
        ScriptApp.deleteTrigger(trigger);
      }
    }

    ScriptApp.newTrigger('triggerDailyReminders')
      .timeBased()
      .atHour(12)
      .everyDays(1)
      .inTimezone(APP_CONFIG.TIMEZONE)
      .create();
  }
}
