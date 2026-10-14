class BookingService {
  private static _validateInput(req: BookingRequest): boolean {
    if (!req.userId || !req.familyName || !req.givenName || !req.email) return false;

    const idRegex = /^[a-zA-Z0-9]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!idRegex.test(req.userId.trim())) return false;
    if (!nameRegex.test(req.familyName.trim())) return false;
    if (!nameRegex.test(req.givenName.trim())) return false;
    if (!emailRegex.test(req.email.trim())) return false;

    return true;
  }

  private static _getWeekNumber(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  public static bookSlot(req: BookingRequest, webAppUrl: string): ApiResponse<BookingRecord> {
    if (!this._validateInput(req)) {
      return { success: false, error: ERROR_MESSAGES.INVALID_INPUT };
    }

    const course = COURSES.find(c => c.id === req.courseId);
    if (!course) {
      return { success: false, error: ERROR_MESSAGES.INVALID_INPUT };
    }

    if (!CalendarService.isWithinBookingAcceptancePeriod(req.bookingDate)) {
      return { success: false, error: ERROR_MESSAGES.DEADLINE_PASSED };
    }

    const lock = LockService.getScriptLock();
    try {
      const acquired = lock.tryLock(20000);
      if (!acquired) {
        return { success: false, error: ERROR_MESSAGES.CONCURRENCY_TIMEOUT };
      }

      const activeBookings = BookingStorage.getAllActiveBookings();

      const existingInSlot = activeBookings.filter(b => 
        b.bookingDate === req.bookingDate && b.startTime === req.startTime && b.courseId === req.courseId
      );
      if (existingInSlot.length >= course.capacity) {
        return { success: false, error: ERROR_MESSAGES.COURSE_FULL };
      }

      const normalizedEmail = req.email.trim().toLowerCase();
      const normalizedUserId = req.userId.trim();

      const userBookings = activeBookings.filter(b => 
        b.userId === normalizedUserId || b.email.toLowerCase() === normalizedEmail
      );

      const hasBookingOnSameDay = userBookings.some(b => b.bookingDate === req.bookingDate);
      if (hasBookingOnSameDay) {
        return { success: false, error: ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED };
      }

      const targetDateParts = req.bookingDate.split('-').map(Number);
      const targetDate = new Date(targetDateParts[0], targetDateParts[1] - 1, targetDateParts[2]);
      const targetWeek = this._getWeekNumber(targetDate);

      const weeklyBookingsCount = userBookings.filter(b => {
        const parts = b.bookingDate.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return this._getWeekNumber(d) === targetWeek;
      }).length;

      if (weeklyBookingsCount >= APP_CONFIG.MAX_WEEKLY_BOOKINGS_PER_USER) {
        return { success: false, error: ERROR_MESSAGES.WEEKLY_LIMIT_EXCEEDED };
      }

      const newRecord: BookingRecord = {
        bookingId: Utilities.getUuid(),
        userId: normalizedUserId,
        familyName: req.familyName.trim(),
        givenName: req.givenName.trim(),
        email: req.email.trim(),
        bookingDate: req.bookingDate,
        startTime: req.startTime,
        courseId: req.courseId,
        courseName: course.name,
        bookingTimestamp: new Date().toISOString(),
        status: 'Booked',
        cancellationTimestamp: ''
      };

      BookingStorage.saveBooking(newRecord);

      try {
        NotificationService.sendBookingConfirmation(newRecord, webAppUrl);
      } catch (err) {
        console.error('Email confirmation error:', err);
      }

      return { success: true, data: newRecord };
    } catch (e: any) {
      return { success: false, error: e.message || ERROR_MESSAGES.INVALID_INPUT };
    } finally {
      lock.releaseLock();
    }
  }

  public static cancelSlot(bookingId: string, email: string): ApiResponse<BookingRecord> {
    const lock = LockService.getScriptLock();
    try {
      const acquired = lock.tryLock(10000);
      if (!acquired) {
        return { success: false, error: ERROR_MESSAGES.CONCURRENCY_TIMEOUT };
      }

      const cancelled = BookingStorage.cancelBooking(bookingId, email);
      if (!cancelled) {
        return { success: false, error: ERROR_MESSAGES.BOOKING_NOT_FOUND };
      }

      try {
        NotificationService.sendCancellationConfirmation(cancelled);
      } catch (err) {
        console.error('Email cancellation error:', err);
      }

      return { success: true, data: cancelled };
    } catch (e: any) {
      return { success: false, error: e.message || ERROR_MESSAGES.BOOKING_NOT_FOUND };
    } finally {
      lock.releaseLock();
    }
  }
}
