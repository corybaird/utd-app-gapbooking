interface CourseDefinition {
  id: string;
  name: string;
  theme: string;
  format: string;
  capacity: number;
}

interface SlotDefinition {
  time: string;
  isMorning: boolean;
}

interface BookingRecord {
  bookingId: string;
  userId: string;
  familyName: string;
  givenName: string;
  email: string;
  bookingDate: string;
  startTime: string;
  courseId: string;
  courseName: string;
  bookingTimestamp: string;
  status: 'Booked' | 'Cancelled';
  cancellationTimestamp: string;
}

interface BookingRequest {
  userId: string;
  familyName: string;
  givenName: string;
  email: string;
  bookingDate: string;
  startTime: string;
  courseId: string;
}

interface SlotAvailability {
  courseId: string;
  courseName: string;
  capacity: number;
  bookedCount: number;
  remainingCapacity: number;
  isBookable: boolean;
  reason?: string;
}

interface CalendarDay {
  dateString: string;
  dayOfWeek: string;
  isHoliday: boolean;
  holidayName?: string;
  isBookable: boolean;
  slots: {
    [time: string]: {
      [courseId: string]: SlotAvailability;
    };
  };
}

interface CalendarViewModel {
  currentWeekStart: string;
  currentWeekEnd: string;
  bookingDeadline: string;
  weekOffset: number;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  days: CalendarDay[];
  courses: CourseDefinition[];
  timeSlots: SlotDefinition[];
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
