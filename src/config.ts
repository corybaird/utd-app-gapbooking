const COURSES: CourseDefinition[] = [
  { id: 'course_1', name: 'Course 1', theme: 'Theme A', format: 'Group (1:3)', capacity: 3 },
  { id: 'course_2', name: 'Course 2', theme: 'Theme B', format: 'Group (1:3)', capacity: 3 },
  { id: 'course_3', name: 'Course 3', theme: 'Theme A', format: 'One-on-one (1:1)', capacity: 1 },
  { id: 'course_4', name: 'Course 4', theme: 'Theme B', format: 'One-on-one (1:1)', capacity: 1 },
  { id: 'course_5', name: 'Course 5', theme: 'Theme A or B', format: 'One-on-one (1:1)', capacity: 1 }
];

const TIME_SLOTS: SlotDefinition[] = [
  { time: '10:00', isMorning: true },
  { time: '10:30', isMorning: true },
  { time: '11:00', isMorning: true },
  { time: '11:30', isMorning: true },
  { time: '15:00', isMorning: false },
  { time: '15:30', isMorning: false },
  { time: '16:00', isMorning: false },
  { time: '16:30', isMorning: false }
];

const ERROR_MESSAGES = {
  DEADLINE_PASSED: 'The booking period has ended.',
  COURSE_FULL: 'This course has reached capacity.',
  DAILY_LIMIT_EXCEEDED: 'You already have another booking on this day.',
  WEEKLY_LIMIT_EXCEEDED: 'You have reached the limit of five bookings per week.',
  INVALID_INPUT: 'Please check your inputs and try again.',
  CONCURRENCY_TIMEOUT: 'Server is busy processing reservations, please retry.',
  BOOKING_NOT_FOUND: 'Booking not found or already cancelled.'
};

const SHEET_NAMES = {
  BOOKINGS: 'Bookings',
  CONFIG: 'Config',
  BLACKOUT_DATES: 'BlackoutDates'
};

const ZOOM_URL_MAPPING = {
  'course_1': { odd: 'https://utokyo-ac-jp.zoom.us/my/session01', even: 'https://utokyo-ac-jp.zoom.us/my/session02' },
  'course_2': { odd: 'https://utokyo-ac-jp.zoom.us/my/session03', even: 'https://utokyo-ac-jp.zoom.us/my/session04' },
  'course_3': { odd: 'https://utokyo-ac-jp.zoom.us/my/session05', even: 'https://utokyo-ac-jp.zoom.us/my/session06' },
  'course_4': { odd: 'https://utokyo-ac-jp.zoom.us/my/session07', even: 'https://utokyo-ac-jp.zoom.us/my/session08' },
  'course_5': { odd: 'https://utokyo-ac-jp.zoom.us/my/session09', even: 'https://utokyo-ac-jp.zoom.us/my/session10' }
};

const APP_CONFIG = {
  SPREADSHEET_ID: '1jeb2bd5xBQAs_8F84O2tAwrYYte3VS9k0VW8qv_jfek',
  TIMEZONE: 'Asia/Tokyo',
  MAX_DAILY_BOOKINGS_PER_USER: 1,
  MAX_WEEKLY_BOOKINGS_PER_USER: 5,
  WEEKLY_DEADLINE_DAY: 5, // Friday
  WEEKLY_DEADLINE_HOUR: 23,
  WEEKLY_DEADLINE_MINUTE: 29,
  CALENDAR_ROTATION_DAY: 6, // Saturday
  CALENDAR_ROTATION_HOUR: 0,
  CALENDAR_ROTATION_MINUTE: 0,
  SUPPORT_EMAIL: 'english-session@g.ecc.u-tokyo.ac.jp'
};
