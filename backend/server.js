const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { readJson, writeJson } = require("./lib/store");
const {
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
} = require("./lib/booking-service");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function loadRestaurants() {
  return readJson("restaurants.json", []);
}

function loadBookings() {
  return readJson("bookings.json", []);
}

function saveBookings(bookings) {
  writeJson("bookings.json", bookings);
}

function loadMessages() {
  return readJson("messages.json", []);
}

function saveMessages(messages) {
  writeJson("messages.json", messages);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON payload"));
      }
    });

    request.on("error", reject);
  });
}

function parseBookingRoute(pathname) {
  const match = pathname.match(/^\/api\/bookings\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function routeApi(request, response, parsedUrl) {
  const restaurants = loadRestaurants();
  const bookings = loadBookings();
  const messages = loadMessages();
  const pathname = parsedUrl.pathname;

  if (request.method === "GET" && pathname === "/api/restaurants") {
    sendJson(response, 200, {
      restaurants: restaurants.map(normalizeRestaurant)
    });
    return true;
  }

  if (request.method === "GET" && pathname.startsWith("/api/restaurants/")) {
    const restaurantId = pathname.replace("/api/restaurants/", "");
    const restaurant = restaurants.find((entry) => entry.id === restaurantId);

    if (!restaurant) {
      sendJson(response, 404, { message: "Restaurant not found" });
      return true;
    }

    sendJson(response, 200, {
      restaurant: normalizeRestaurant(restaurant),
      slots: buildTimeSlots()
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/availability") {
    const restaurantId = parsedUrl.searchParams.get("restaurantId");
    const date = parsedUrl.searchParams.get("date");
    const partySize = Number(parsedUrl.searchParams.get("partySize"));
    const restaurant = restaurants.find((entry) => entry.id === restaurantId);

    if (!restaurant || !date || !Number.isInteger(partySize) || partySize < 1) {
      sendJson(response, 400, {
        message: "restaurantId, date, and partySize are required"
      });
      return true;
    }

    sendJson(response, 200, {
      restaurant: normalizeRestaurant(restaurant),
      slots: buildAvailability(restaurant, bookings, date, partySize)
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/bookings") {
    const filtered = filterBookings(bookings, {
      email: parsedUrl.searchParams.get("email") || "",
      phone: parsedUrl.searchParams.get("phone") || "",
      restaurantId: parsedUrl.searchParams.get("restaurantId") || "",
      status: parsedUrl.searchParams.get("status") || ""
    });

    const results = filtered
      .slice()
      .sort((left, right) => combineDateTime(left.date, left.time) - combineDateTime(right.date, right.time))
      .map((booking) => enrichBooking(booking, restaurants));

    sendJson(response, 200, {
      bookings: results
    });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/bookings") {
    collectRequestBody(request)
      .then((payload) => {
        payload.partySize = Number(payload.partySize);
        const restaurant = restaurants.find((entry) => entry.id === payload.restaurantId);
        const validationMessage = validateBookingPayload(payload, restaurant);

        if (validationMessage) {
          sendJson(response, 400, { message: validationMessage });
          return;
        }

        const assignedTable = findAssignableTable(
          restaurant,
          bookings,
          payload.date,
          payload.time,
          payload.partySize
        );

        if (!assignedTable) {
          sendJson(response, 409, {
            message: "This time slot is no longer available. Please choose another one."
          });
          return;
        }

        const booking = {
          id: createBookingId(),
          restaurantId: restaurant.id,
          customerName: payload.customerName.trim(),
          email: payload.email.trim(),
          phone: payload.phone.trim(),
          date: payload.date,
          time: payload.time,
          partySize: payload.partySize,
          occasion: (payload.occasion || "").trim(),
          specialRequest: (payload.specialRequest || "").trim(),
          status: "confirmed",
          tableId: assignedTable.id,
          createdAt: new Date().toISOString()
        };

        bookings.push(booking);
        saveBookings(bookings);

        sendJson(response, 201, {
          message: `Reservation confirmed at ${restaurant.name} for ${payload.customerName}.`,
          booking: enrichBooking(booking, restaurants)
        });
      })
      .catch((error) => {
        sendJson(response, 400, { message: error.message });
      });

    return true;
  }

  if ((request.method === "PATCH" || request.method === "DELETE") && parseBookingRoute(pathname)) {
    const bookingId = parseBookingRoute(pathname);
    const index = bookings.findIndex((entry) => entry.id === bookingId);

    if (index === -1) {
      sendJson(response, 404, { message: "Booking not found" });
      return true;
    }

    if (request.method === "DELETE") {
      bookings[index].status = "cancelled";
      bookings[index].updatedAt = new Date().toISOString();
      saveBookings(bookings);
      sendJson(response, 200, { message: "Reservation cancelled successfully" });
      return true;
    }

    collectRequestBody(request)
      .then((payload) => {
        if (!payload.status || !BOOKING_STATUSES.includes(payload.status)) {
          sendJson(response, 400, {
            message: `status must be one of: ${BOOKING_STATUSES.join(", ")}`
          });
          return;
        }

        bookings[index].status = payload.status;
        bookings[index].updatedAt = new Date().toISOString();
        saveBookings(bookings);

        sendJson(response, 200, {
          message: "Reservation updated successfully",
          booking: enrichBooking(bookings[index], restaurants)
        });
      })
      .catch((error) => {
        sendJson(response, 400, { message: error.message });
      });

    return true;
  }

  if (request.method === "GET" && pathname === "/api/dashboard") {
    sendJson(response, 200, {
      dashboard: buildDashboard(restaurants, bookings, messages),
      recentBookings: bookings
        .slice()
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        .slice(0, 5)
        .map((booking) => enrichBooking(booking, restaurants)),
      recentMessages: messages.slice().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 5)
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/messages") {
    sendJson(response, 200, {
      messages: messages.slice().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    });
    return true;
  }

  if (request.method === "POST" && pathname === "/api/contact") {
    collectRequestBody(request)
      .then((payload) => {
        const validationMessage = validateMessagePayload(payload);

        if (validationMessage) {
          sendJson(response, 400, { message: validationMessage });
          return;
        }

        const message = {
          id: createMessageId(),
          name: payload.name.trim(),
          email: payload.email.trim(),
          subject: payload.subject.trim(),
          message: payload.message.trim(),
          createdAt: new Date().toISOString()
        };

        messages.push(message);
        saveMessages(messages);
        sendJson(response, 201, {
          message: "Message received. Our team will get back to you shortly.",
          entry: message
        });
      })
      .catch((error) => {
        sendJson(response, 400, { message: error.message });
      });

    return true;
  }

  return false;
}

function routeStatic(response, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(contents);
  });
}

const server = http.createServer((request, response) => {
  const parsedUrl = new URL(request.url, `http://${request.headers.host}`);

  if (parsedUrl.pathname.startsWith("/api/")) {
    const handled = routeApi(request, response, parsedUrl);
    if (!handled) {
      sendJson(response, 404, { message: "API route not found" });
    }
    return;
  }

  routeStatic(response, parsedUrl.pathname);
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Restaurant booking app running on http://${HOST}:${PORT}`);
  });
}

module.exports = {
  server
};
