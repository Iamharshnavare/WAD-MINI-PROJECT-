const BOOKING_STATUSES = ["confirmed", "seated", "completed", "cancelled"];
const SLOT_START_HOUR = 11;
const SLOT_END_HOUR = 22;
const SLOT_INTERVAL_MINUTES = 30;
const DINING_DURATION_MINUTES = 90;

function combineDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime());
}

function isValidTime(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function minutesBetween(dateA, dateB) {
  return Math.abs(dateA.getTime() - dateB.getTime()) / 60000;
}

function bookingOverlaps(slotDateTime, existingDateTime) {
  return minutesBetween(slotDateTime, existingDateTime) < DINING_DURATION_MINUTES;
}

function buildTimeSlots() {
  const slots = [];

  for (let hour = SLOT_START_HOUR; hour <= SLOT_END_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      if (hour === SLOT_END_HOUR && minute > 0) {
        continue;
      }

      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  return slots;
}

function normalizeRestaurant(restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    location: restaurant.location,
    neighborhood: restaurant.neighborhood,
    rating: restaurant.rating,
    priceBand: restaurant.priceBand,
    hero: restaurant.hero,
    description: restaurant.description,
    signatureDish: restaurant.signatureDish,
    features: restaurant.features,
    address: restaurant.address,
    hours: restaurant.hours,
    imageLabel: restaurant.imageLabel,
    menuHighlights: restaurant.menuHighlights,
    reviews: restaurant.reviews,
    maxSeats: Math.max(...restaurant.tables.map((table) => table.seats))
  };
}

function enrichBooking(booking, restaurants) {
  const restaurant = restaurants.find((entry) => entry.id === booking.restaurantId);

  return {
    ...booking,
    restaurantName: restaurant ? restaurant.name : "Unknown restaurant",
    location: restaurant ? restaurant.location : "Unknown",
    cuisine: restaurant ? restaurant.cuisine : "Unknown"
  };
}

function findAssignableTable(restaurant, bookings, date, time, partySize, ignoredBookingId = null) {
  const requestedDateTime = combineDateTime(date, time);
  const occupiedTables = new Set();

  bookings
    .filter((booking) => {
      return (
        booking.id !== ignoredBookingId &&
        booking.restaurantId === restaurant.id &&
        booking.date === date &&
        booking.status !== "cancelled"
      );
    })
    .forEach((booking) => {
      const existingDateTime = combineDateTime(booking.date, booking.time);
      if (bookingOverlaps(requestedDateTime, existingDateTime)) {
        occupiedTables.add(booking.tableId);
      }
    });

  return restaurant.tables
    .filter((table) => table.seats >= partySize && !occupiedTables.has(table.id))
    .sort((left, right) => left.seats - right.seats)[0] || null;
}

function buildAvailability(restaurant, bookings, date, partySize) {
  return buildTimeSlots().map((time) => ({
    time,
    available: Boolean(findAssignableTable(restaurant, bookings, date, time, partySize))
  }));
}

function buildDashboard(restaurants, bookings, messages) {
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const today = new Date().toISOString().split("T")[0];
  const todayReservations = bookings.filter((booking) => booking.date === today && booking.status !== "cancelled");

  const popularRestaurants = restaurants.map((restaurant) => {
    const count = activeBookings.filter((booking) => booking.restaurantId === restaurant.id).length;
    return {
      restaurantId: restaurant.id,
      name: restaurant.name,
      reservations: count
    };
  }).sort((left, right) => right.reservations - left.reservations);

  return {
    totals: {
      restaurants: restaurants.length,
      bookings: bookings.length,
      activeBookings: activeBookings.length,
      contactMessages: messages.length,
      todayReservations: todayReservations.length
    },
    popularRestaurants
  };
}

function filterBookings(bookings, filters) {
  return bookings.filter((booking) => {
    const emailMatches = !filters.email || booking.email.toLowerCase() === filters.email.toLowerCase();
    const phoneMatches = !filters.phone || booking.phone.includes(filters.phone);
    const restaurantMatches = !filters.restaurantId || booking.restaurantId === filters.restaurantId;
    const statusMatches = !filters.status || booking.status === filters.status;
    return emailMatches && phoneMatches && restaurantMatches && statusMatches;
  });
}

function validateBookingPayload(payload, restaurant) {
  const requiredFields = [
    "customerName",
    "email",
    "phone",
    "date",
    "time",
    "partySize",
    "restaurantId"
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      return `${field} is required`;
    }
  }

  if (!restaurant) {
    return "Selected restaurant does not exist";
  }

  if (!isValidDate(payload.date)) {
    return "Reservation date is invalid";
  }

  if (!isValidTime(payload.time)) {
    return "Reservation time is invalid";
  }

  if (!Number.isInteger(payload.partySize) || payload.partySize < 1 || payload.partySize > 12) {
    return "Party size must be between 1 and 12";
  }

  const reservationDate = combineDateTime(payload.date, payload.time);
  if (Number.isNaN(reservationDate.getTime())) {
    return "Reservation date/time is invalid";
  }

  if (reservationDate < new Date()) {
    return "Reservation must be scheduled in the future";
  }

  return null;
}

function validateMessagePayload(payload) {
  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    return "name, email, subject, and message are required";
  }

  return null;
}

function createBookingId() {
  return `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = {
  BOOKING_STATUSES,
  buildAvailability,
  buildDashboard,
  buildTimeSlots,
  combineDateTime,
  createBookingId,
  createMessageId,
  enrichBooking,
  filterBookings,
  findAssignableTable,
  normalizeRestaurant,
  validateBookingPayload,
  validateMessagePayload
};
