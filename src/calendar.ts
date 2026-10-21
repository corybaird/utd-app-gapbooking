class CalendarService {
  private static _getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  public static getBaseWeekMonday(referenceDate: Date = new Date()): Date {
    const d = new Date(referenceDate);
    const currentDay = d.getDay();
    const hours = d.getHours();

    const thisMonday = this._getMonday(d);
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);

    return nextMonday;
  }

  public static isWithinBookingAcceptancePeriod(targetDateStr: string, referenceDate: Date = new Date()): boolean {
    const parts = targetDateStr.split('-').map(Number);
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);

    const targetMonday = this._getMonday(targetDate);
    const currentMonday = this._getMonday(referenceDate);

    const diffDays = Math.round((targetMonday.getTime() - currentMonday.getTime()) / (1000 * 3600 * 24));
    const targetWeekOffset = Math.round(diffDays / 7);

    if (targetWeekOffset < 1) {
      return false;
    }

    if (targetWeekOffset === 1) {
      const currentDay = referenceDate.getDay();
      const currentHour = referenceDate.getHours();
      const currentMinute = referenceDate.getMinutes();

      if (currentDay === 5) {
        if (currentHour > 23 || (currentHour === 23 && currentMinute > 59)) {
          return false;
        }
      } else if (currentDay === 6 || currentDay === 0) {
        return false;
      }
    }

    if (targetWeekOffset > 4) {
      return false;
    }

    return true;
  }

  public static getJapaneseHoliday(dateStr: string): string | null {
    try {
      const parts = dateStr.split('-').map(Number);
      const start = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
      const end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);
      const cal = CalendarApp.getCalendarById('ja.japanese#holiday@group.v.calendar.google.com');
      if (cal) {
        const events = cal.getEvents(start, end);
        if (events && events.length > 0) {
          return events[0].getTitle();
        }
      }
    } catch (e) {
      // Fallback if calendar API permission is not granted
    }
    return null;
  }

  public static getCalendarView(weekOffset: number = 0): CalendarViewModel {
    const now = new Date();
    const baseMonday = this.getBaseWeekMonday(now);

    const displayedMonday = new Date(baseMonday);
    displayedMonday.setDate(baseMonday.getDate() + (weekOffset * 7));

    const displayedFriday = new Date(displayedMonday);
    displayedFriday.setDate(displayedMonday.getDate() + 4);

    const activeBookings = BookingStorage.getAllActiveBookings();
    const blackoutDates = new Set(BookingStorage.getBlackoutDates());

    const days: CalendarDay[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    for (let i = 0; i < 5; i++) {
      const currentDay = new Date(displayedMonday);
      currentDay.setDate(displayedMonday.getDate() + i);

      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const holiday = this.getJapaneseHoliday(dateString);
      const isBlackout = blackoutDates.has(dateString);
      const isBookableAcceptance = this.isWithinBookingAcceptancePeriod(dateString, now);
      const isDayBookable = isBookableAcceptance && !holiday && !isBlackout;

      const slotsMap: { [time: string]: { [courseId: string]: SlotAvailability } } = {};

      for (const slot of TIME_SLOTS) {
        slotsMap[slot.time] = {};

        for (const course of COURSES) {
          const booked = activeBookings.filter(b => 
            b.bookingDate === dateString && b.startTime === slot.time && b.courseId === course.id
          );
          const bookedCount = booked.length;
          const remainingCapacity = Math.max(0, course.capacity - bookedCount);
          const isFull = remainingCapacity <= 0;

          slotsMap[slot.time][course.id] = {
            courseId: course.id,
            courseName: course.name,
            capacity: course.capacity,
            bookedCount: bookedCount,
            remainingCapacity: remainingCapacity,
            isBookable: isDayBookable && !isFull,
            reason: !isDayBookable ? 'Closed' : (isFull ? ERROR_MESSAGES.COURSE_FULL : undefined)
          };
        }
      }

      days.push({
        dateString: dateString,
        dayOfWeek: dayNames[i],
        isHoliday: !!holiday || isBlackout,
        holidayName: holiday || (isBlackout ? 'No sessions' : undefined),
        isBookable: isDayBookable,
        slots: slotsMap
      });
    }

    const startYear = displayedMonday.getFullYear();
    const startMonth = String(displayedMonday.getMonth() + 1).padStart(2, '0');
    const startDay = String(displayedMonday.getDate()).padStart(2, '0');

    const endYear = displayedFriday.getFullYear();
    const endMonth = String(displayedFriday.getMonth() + 1).padStart(2, '0');
    const endDay = String(displayedFriday.getDate()).padStart(2, '0');

    const deadlineFriday = new Date(displayedMonday);
    deadlineFriday.setDate(displayedMonday.getDate() - 3);
    const dlYear = deadlineFriday.getFullYear();
    const dlMonth = String(deadlineFriday.getMonth() + 1).padStart(2, '0');
    const dlDay = String(deadlineFriday.getDate()).padStart(2, '0');
    const deadlineString = `${dlYear}-${dlMonth}-${dlDay}`;

    return {
      currentWeekStart: `${startYear}-${startMonth}-${startDay}`,
      currentWeekEnd: `${endYear}-${endMonth}-${endDay}`,
      bookingDeadline: `${deadlineString} (Fri) 23:59 JST (before the session week)`,
      weekOffset: weekOffset,
      canNavigatePrev: weekOffset > -1,
      canNavigateNext: weekOffset < 3,
      days: days,
      courses: COURSES,
      timeSlots: TIME_SLOTS
    };
  }
}
