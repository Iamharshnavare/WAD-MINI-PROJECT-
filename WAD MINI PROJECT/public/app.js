const state = {
  restaurants: [],
  filteredRestaurants: [],
  bookings: [],
  dashboard: null
};

const restaurantGrid = document.getElementById("restaurant-grid");
const restaurantSelect = document.getElementById("restaurant-select");
const searchRestaurant = document.getElementById("search-restaurant");
const cuisineFilter = document.getElementById("cuisine-filter");
const areaFilter = document.getElementById("area-filter");
const bookingForm = document.getElementById("booking-form");
const bookingStatus = document.getElementById("booking-status");
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");
const bookingList = document.getElementById("booking-list");
const dateInput = document.getElementById("date-input");
const partySizeInput = document.getElementById("party-size-input");
const timeSelect = document.getElementById("time-select");
const searchForm = document.getElementById("search-form");

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function formatTime(timeString) {
  return new Date(`1970-01-01T${timeString}:00`).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function setFormMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `form-status ${type}`.trim();
}

function setDefaultDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const iso = tomorrow.toISOString().split("T")[0];
  dateInput.value = iso;
  dateInput.min = new Date().toISOString().split("T")[0];
}

function renderHeroStats() {
  const stats = state.dashboard?.dashboard?.totals;
  if (!stats) {
    return;
  }

  document.getElementById("hero-stats").innerHTML = `
    <article class="stat-pill">
      <strong>${stats.restaurants}</strong>
      <span>Restaurants</span>
    </article>
    <article class="stat-pill">
      <strong>${stats.activeBookings}</strong>
      <span>Active bookings</span>
    </article>
    <article class="stat-pill">
      <strong>${stats.todayReservations}</strong>
      <span>Today's reservations</span>
    </article>
    <article class="stat-pill">
      <strong>${stats.contactMessages}</strong>
      <span>Stored inquiries</span>
    </article>
  `;
}

function renderSpotlight() {
  const restaurant = state.restaurants[0];
  if (!restaurant) {
    return;
  }

  document.getElementById("spotlight-name").textContent = restaurant.name;
  document.getElementById("spotlight-hero").textContent = restaurant.hero;
  document.getElementById("spotlight-location").textContent = restaurant.neighborhood;
  document.getElementById("spotlight-rating").textContent = `${restaurant.rating} stars`;
  document.getElementById("spotlight-features").innerHTML = restaurant.features
    .map((feature) => `<li>${feature}</li>`)
    .join("");
}

function populateFilters() {
  const cuisines = [...new Set(state.restaurants.map((restaurant) => restaurant.cuisine))];
  const areas = [...new Set(state.restaurants.map((restaurant) => restaurant.neighborhood))];

  cuisineFilter.innerHTML = `<option value="all">All cuisines</option>${cuisines
    .map((cuisine) => `<option value="${cuisine}">${cuisine}</option>`)
    .join("")}`;

  areaFilter.innerHTML = `<option value="all">All areas</option>${areas
    .map((area) => `<option value="${area}">${area}</option>`)
    .join("")}`;
}

function populateRestaurantSelects() {
  const options = state.restaurants
    .map((restaurant) => `<option value="${restaurant.id}">${restaurant.name}</option>`)
    .join("");

  restaurantSelect.innerHTML = options;
  searchRestaurant.innerHTML = `<option value="">All restaurants</option>${options}`;
}

function applyFilters() {
  state.filteredRestaurants = state.restaurants.filter((restaurant) => {
    const cuisineMatches = cuisineFilter.value === "all" || restaurant.cuisine === cuisineFilter.value;
    const areaMatches = areaFilter.value === "all" || restaurant.neighborhood === areaFilter.value;
    return cuisineMatches && areaMatches;
  });

  renderRestaurants();
}

function renderRestaurants() {
  if (!state.filteredRestaurants.length) {
    restaurantGrid.innerHTML = `<div class="empty-state">No restaurants match the selected filters.</div>`;
    return;
  }

  restaurantGrid.innerHTML = state.filteredRestaurants
    .map((restaurant) => {
      const menu = restaurant.menuHighlights
        .map((item) => `<div class="menu-line"><span>${item.name}</span><strong>Rs. ${item.price}</strong></div>`)
        .join("");

      return `
        <article class="restaurant-card">
          <div>
            <p class="eyebrow">${restaurant.cuisine}</p>
            <h4>${restaurant.name}</h4>
          </div>
          <div class="meta-line">
            <span>${restaurant.neighborhood}</span>
            <span>${restaurant.rating} rating</span>
            <span>${restaurant.priceBand}</span>
          </div>
          <p>${restaurant.description}</p>
          <ul class="tag-list">
            ${restaurant.features.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
          <div>
            <p class="eyebrow">Menu highlights</p>
            ${menu}
          </div>
          <div class="meta-line">
            <span>${restaurant.hours}</span>
            <button class="mini-button" type="button" data-restaurant="${restaurant.id}">Book now</button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-restaurant]").forEach((button) => {
    button.addEventListener("click", () => {
      restaurantSelect.value = button.dataset.restaurant;
      document.getElementById("reservations").scrollIntoView({ behavior: "smooth" });
      refreshAvailability();
    });
  });
}

function renderBookings() {
  if (!state.bookings.length) {
    bookingList.innerHTML = `<div class="empty-state">No reservations found. Create one or search with another email/phone.</div>`;
    return;
  }

  bookingList.innerHTML = state.bookings
    .map((booking) => {
      return `
        <article class="booking-item">
          <div class="booking-topline">
            <strong>${booking.restaurantName}</strong>
            <span class="status-badge ${booking.status}">${booking.status}</span>
          </div>
          <p>${formatDate(booking.date)} at ${formatTime(booking.time)} • ${booking.partySize} guests</p>
          <p>${booking.customerName} • ${booking.email} • ${booking.phone}</p>
          <p>${booking.occasion || "Standard reservation"}${booking.specialRequest ? ` • ${booking.specialRequest}` : ""}</p>
          <div class="booking-actions">
            <button class="status-action confirmed" data-action="confirmed" data-booking="${booking.id}" type="button">Mark confirmed</button>
            <button class="status-action pending" data-action="completed" data-booking="${booking.id}" type="button">Mark completed</button>
            <button class="status-action cancelled" data-action="cancel" data-booking="${booking.id}" type="button">Cancel</button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-booking]").forEach((button) => {
    button.addEventListener("click", async () => {
      const bookingId = button.dataset.booking;
      const action = button.dataset.action;

      if (action === "cancel") {
        await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action })
        });
      }

      await refreshData();
    });
  });
}

function renderDashboard() {
  const dashboard = state.dashboard?.dashboard;
  if (!dashboard) {
    return;
  }

  document.getElementById("dashboard-grid").innerHTML = `
    <article class="stat-card">
      <p class="eyebrow">Restaurants</p>
      <strong>${dashboard.totals.restaurants}</strong>
      <span>Seeded dining venues</span>
    </article>
    <article class="stat-card">
      <p class="eyebrow">Bookings</p>
      <strong>${dashboard.totals.bookings}</strong>
      <span>Total stored reservations</span>
    </article>
    <article class="stat-card">
      <p class="eyebrow">Active</p>
      <strong>${dashboard.totals.activeBookings}</strong>
      <span>Non-cancelled reservations</span>
    </article>
    <article class="stat-card">
      <p class="eyebrow">Inquiries</p>
      <strong>${dashboard.totals.contactMessages}</strong>
      <span>Saved contact messages</span>
    </article>
  `;

  const recentBookings = state.dashboard.recentBookings;
  const recentMessages = state.dashboard.recentMessages;

  document.getElementById("recent-bookings").innerHTML = recentBookings.length
    ? recentBookings
        .map(
          (booking) => `
            <article class="booking-item">
              <div class="booking-topline">
                <strong>${booking.restaurantName}</strong>
                <span class="pill ${booking.status}">${booking.status}</span>
              </div>
              <p>${booking.customerName} • ${formatDate(booking.date)} at ${formatTime(booking.time)}</p>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No bookings yet.</div>`;

  document.getElementById("message-list").innerHTML = recentMessages.length
    ? recentMessages
        .map(
          (entry) => `
            <article class="message-item">
              <div class="booking-topline">
                <strong>${entry.subject}</strong>
                <span>${formatDateTime(entry.createdAt)}</span>
              </div>
              <p>${entry.name} • ${entry.email}</p>
              <p>${entry.message}</p>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No messages received.</div>`;
}

async function fetchRestaurants() {
  const response = await fetch("/api/restaurants");
  const data = await response.json();
  state.restaurants = data.restaurants;
  state.filteredRestaurants = data.restaurants;
  populateFilters();
  populateRestaurantSelects();
  renderSpotlight();
  renderRestaurants();
}

async function fetchBookings(query = "") {
  const response = await fetch(`/api/bookings${query}`);
  const data = await response.json();
  state.bookings = data.bookings;
  renderBookings();
}

async function fetchDashboard() {
  const response = await fetch("/api/dashboard");
  state.dashboard = await response.json();
  renderHeroStats();
  renderDashboard();
}

async function refreshAvailability() {
  const restaurantId = restaurantSelect.value;
  const date = dateInput.value;
  const partySize = partySizeInput.value;

  if (!restaurantId || !date || !partySize) {
    timeSelect.innerHTML = `<option value="">Choose a date first</option>`;
    return;
  }

  timeSelect.innerHTML = `<option value="">Loading available slots...</option>`;

  try {
    const response = await fetch(
      `/api/availability?restaurantId=${encodeURIComponent(restaurantId)}&date=${encodeURIComponent(
        date
      )}&partySize=${encodeURIComponent(partySize)}`
    );
    const data = await response.json();
    const slots = data.slots.filter((slot) => slot.available);

    timeSelect.innerHTML = slots.length
      ? `<option value="">Select a time</option>${slots
          .map((slot) => `<option value="${slot.time}">${formatTime(slot.time)}</option>`)
          .join("")}`
      : `<option value="">No slots available</option>`;
  } catch (error) {
    timeSelect.innerHTML = `<option value="">Unable to load slots</option>`;
  }
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  const formData = new FormData(bookingForm);
  const payload = Object.fromEntries(formData.entries());
  payload.partySize = Number(payload.partySize);

  setFormMessage(bookingStatus, "Saving reservation...");

  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    setFormMessage(bookingStatus, data.message || "Unable to save reservation.", "error");
    return;
  }

  setFormMessage(bookingStatus, data.message, "success");
  bookingForm.reset();
  setDefaultDate();
  partySizeInput.value = 2;
  restaurantSelect.value = payload.restaurantId;
  await refreshData();
  await refreshAvailability();
}

async function handleSearch(event) {
  event.preventDefault();
  const params = new URLSearchParams();
  const email = document.getElementById("search-email").value.trim();
  const phone = document.getElementById("search-phone").value.trim();
  const status = document.getElementById("search-status").value;
  const restaurantId = searchRestaurant.value;

  if (email) {
    params.set("email", email);
  }
  if (phone) {
    params.set("phone", phone);
  }
  if (status) {
    params.set("status", status);
  }
  if (restaurantId) {
    params.set("restaurantId", restaurantId);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  await fetchBookings(query);
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());

  setFormMessage(contactStatus, "Sending your message...");

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    setFormMessage(contactStatus, data.message || "Unable to send message.", "error");
    return;
  }

  setFormMessage(contactStatus, data.message, "success");
  contactForm.reset();
  await fetchDashboard();
}

async function refreshData() {
  await Promise.all([fetchBookings(), fetchDashboard()]);
}

document.getElementById("reset-search-button").addEventListener("click", async () => {
  searchForm.reset();
  await fetchBookings();
});

bookingForm.addEventListener("submit", handleBookingSubmit);
contactForm.addEventListener("submit", handleContactSubmit);
searchForm.addEventListener("submit", handleSearch);
restaurantSelect.addEventListener("change", refreshAvailability);
dateInput.addEventListener("change", refreshAvailability);
partySizeInput.addEventListener("change", refreshAvailability);
cuisineFilter.addEventListener("change", applyFilters);
areaFilter.addEventListener("change", applyFilters);

async function initialize() {
  setDefaultDate();
  await fetchRestaurants();
  await refreshData();
  await refreshAvailability();
}

initialize();
