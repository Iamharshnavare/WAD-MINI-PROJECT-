const state = {
  restaurants: [],
  filteredRestaurants: [],
  bookings: [],
  dashboard: null
};

const page = document.body.dataset.page;

function getElement(id) {
  return document.getElementById(id);
}

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
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `form-status ${type}`.trim();
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".top-links");

  if (!toggle || !links) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function renderSpotlight() {
  const restaurant = state.restaurants[0];
  if (!restaurant || !getElement("spotlight-name")) {
    return;
  }

  getElement("spotlight-name").textContent = restaurant.name;
  getElement("spotlight-hero").textContent = restaurant.hero;
  getElement("spotlight-location").textContent = restaurant.neighborhood;
  getElement("spotlight-rating").textContent = `${restaurant.rating} stars`;
  getElement("spotlight-features").innerHTML = restaurant.features
    .map((feature) => `<li>${feature}</li>`)
    .join("");
}

function renderHeroStats() {
  const target = getElement("hero-stats");
  const stats = state.dashboard?.dashboard?.totals;

  if (!target || !stats) {
    return;
  }

  target.innerHTML = `
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

function createRestaurantCard(restaurant, compact = false) {
  const menu = restaurant.menuHighlights
    .map((item) => `<div class="menu-line"><span>${item.name}</span><strong>Rs. ${item.price}</strong></div>`)
    .join("");

  return `
    <article class="restaurant-card ${compact ? "compact-card" : ""}">
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
        <a class="mini-button link-button" href="/reservations.html?restaurant=${restaurant.id}">Book now</a>
      </div>
    </article>
  `;
}

function renderHomeFeatured() {
  const target = getElement("home-featured-grid");
  if (!target) {
    return;
  }

  target.innerHTML = state.restaurants.slice(0, 3).map((restaurant) => createRestaurantCard(restaurant, true)).join("");
}

function renderHomePopular() {
  const target = getElement("home-popular-grid");
  const dashboard = state.dashboard?.dashboard;

  if (!target || !dashboard) {
    return;
  }

  target.innerHTML = dashboard.popularRestaurants
    .slice(0, 3)
    .map(
      (restaurant, index) => `
        <article class="info-card compact">
          <p class="eyebrow">Top ${index + 1}</p>
          <h4>${restaurant.name}</h4>
          <p>${restaurant.reservations} stored reservations are currently associated with this venue.</p>
        </article>
      `
    )
    .join("");
}

function populateRestaurantFilters() {
  const cuisineFilter = getElement("cuisine-filter");
  const areaFilter = getElement("area-filter");

  if (!cuisineFilter || !areaFilter) {
    return;
  }

  const cuisines = [...new Set(state.restaurants.map((restaurant) => restaurant.cuisine))];
  const areas = [...new Set(state.restaurants.map((restaurant) => restaurant.neighborhood))];

  cuisineFilter.innerHTML = `<option value="all">All cuisines</option>${cuisines
    .map((cuisine) => `<option value="${cuisine}">${cuisine}</option>`)
    .join("")}`;

  areaFilter.innerHTML = `<option value="all">All areas</option>${areas
    .map((area) => `<option value="${area}">${area}</option>`)
    .join("")}`;
}

function applyRestaurantFilters() {
  const cuisineFilter = getElement("cuisine-filter");
  const areaFilter = getElement("area-filter");

  if (!cuisineFilter || !areaFilter) {
    return;
  }

  state.filteredRestaurants = state.restaurants.filter((restaurant) => {
    const cuisineMatches = cuisineFilter.value === "all" || restaurant.cuisine === cuisineFilter.value;
    const areaMatches = areaFilter.value === "all" || restaurant.neighborhood === areaFilter.value;
    return cuisineMatches && areaMatches;
  });

  renderRestaurantGrid();
}

function renderRestaurantGrid() {
  const target = getElement("restaurant-grid");
  if (!target) {
    return;
  }

  if (!state.filteredRestaurants.length) {
    target.innerHTML = `<div class="empty-state">No restaurants match the selected filters.</div>`;
    return;
  }

  target.innerHTML = state.filteredRestaurants.map((restaurant) => createRestaurantCard(restaurant)).join("");
}

function renderRestaurantStats() {
  const target = getElement("restaurant-stats");
  if (!target) {
    return;
  }

  const cuisineCount = new Set(state.restaurants.map((restaurant) => restaurant.cuisine)).size;
  const areaCount = new Set(state.restaurants.map((restaurant) => restaurant.neighborhood)).size;

  target.innerHTML = `
    <article class="metric-box">
      <p class="eyebrow">Total venues</p>
      <strong>${state.restaurants.length}</strong>
      <span>Restaurants available to book</span>
    </article>
    <article class="metric-box">
      <p class="eyebrow">Cuisine variety</p>
      <strong>${cuisineCount}</strong>
      <span>Distinct cuisine categories</span>
    </article>
    <article class="metric-box">
      <p class="eyebrow">Coverage</p>
      <strong>${areaCount}</strong>
      <span>Neighborhoods currently supported</span>
    </article>
  `;
}

function setDefaultReservationDate() {
  const dateInput = getElement("date-input");
  if (!dateInput) {
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoDate = tomorrow.toISOString().split("T")[0];
  dateInput.value = isoDate;
  dateInput.min = new Date().toISOString().split("T")[0];
}

function populateReservationSelects() {
  const restaurantSelect = getElement("restaurant-select");
  const searchRestaurant = getElement("search-restaurant");
  const options = state.restaurants
    .map((restaurant) => `<option value="${restaurant.id}">${restaurant.name}</option>`)
    .join("");

  if (restaurantSelect) {
    restaurantSelect.innerHTML = options;
  }

  if (searchRestaurant) {
    searchRestaurant.innerHTML = `<option value="">All restaurants</option>${options}`;
  }
}

async function refreshAvailability() {
  const restaurantSelect = getElement("restaurant-select");
  const dateInput = getElement("date-input");
  const partySizeInput = getElement("party-size-input");
  const timeSelect = getElement("time-select");

  if (!restaurantSelect || !dateInput || !partySizeInput || !timeSelect) {
    return;
  }

  const restaurantId = restaurantSelect.value;
  const date = dateInput.value;
  const partySize = partySizeInput.value;

  if (!restaurantId || !date || !partySize) {
    timeSelect.innerHTML = `<option value="">Choose a date first</option>`;
    return;
  }

  timeSelect.innerHTML = `<option value="">Loading available slots...</option>`;

  try {
    const data = await apiFetch(
      `/api/availability?restaurantId=${encodeURIComponent(restaurantId)}&date=${encodeURIComponent(
        date
      )}&partySize=${encodeURIComponent(partySize)}`
    );

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

function renderSelectedRestaurant() {
  const nameTarget = getElement("selected-restaurant-name");
  const metaTarget = getElement("selected-restaurant-meta");
  const featuresTarget = getElement("selected-restaurant-features");
  const restaurantSelect = getElement("restaurant-select");

  if (!nameTarget || !metaTarget || !featuresTarget || !restaurantSelect) {
    return;
  }

  const restaurant = state.restaurants.find((entry) => entry.id === restaurantSelect.value);

  if (!restaurant) {
    nameTarget.textContent = "Choose a restaurant";
    metaTarget.textContent = "Pick a venue to see a quick summary before booking.";
    featuresTarget.innerHTML = "";
    return;
  }

  nameTarget.textContent = restaurant.name;
  metaTarget.textContent = `${restaurant.neighborhood} • ${restaurant.cuisine} • ${restaurant.hours}`;
  featuresTarget.innerHTML = restaurant.features.map((feature) => `<li>${feature}</li>`).join("");
}

function renderBookings() {
  const target = getElement("booking-list");
  if (!target) {
    return;
  }

  if (!state.bookings.length) {
    target.innerHTML = `<div class="empty-state">No reservations found. Create one or search with another email or phone.</div>`;
    return;
  }

  target.innerHTML = state.bookings
    .map(
      (booking) => `
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
      `
    )
    .join("");

  target.querySelectorAll("[data-booking]").forEach((button) => {
    button.addEventListener("click", async () => {
      const bookingId = button.dataset.booking;
      const action = button.dataset.action;

      try {
        if (action === "cancel") {
          await apiFetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
        } else {
          await apiFetch(`/api/bookings/${bookingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: action })
          });
        }

        await fetchBookings();
      } catch (error) {
        setFormMessage(getElement("booking-status"), error.message, "error");
      }
    });
  });
}

function renderDashboard() {
  const totalsTarget = getElement("dashboard-grid");
  const recentBookingsTarget = getElement("recent-bookings");
  const messageListTarget = getElement("message-list");
  const popularTarget = getElement("popular-restaurants");
  const dashboard = state.dashboard?.dashboard;

  if (!dashboard) {
    return;
  }

  if (totalsTarget) {
    totalsTarget.innerHTML = `
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
        <span>Saved guest messages</span>
      </article>
    `;
  }

  if (recentBookingsTarget) {
    recentBookingsTarget.innerHTML = state.dashboard.recentBookings.length
      ? state.dashboard.recentBookings
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
  }

  if (messageListTarget) {
    messageListTarget.innerHTML = state.dashboard.recentMessages.length
      ? state.dashboard.recentMessages
          .map(
            (message) => `
              <article class="message-item">
                <div class="booking-topline">
                  <strong>${message.subject}</strong>
                  <span>${formatDateTime(message.createdAt)}</span>
                </div>
                <p>${message.name} • ${message.email}</p>
                <p>${message.message}</p>
              </article>
            `
          )
          .join("")
      : `<div class="empty-state">No messages received.</div>`;
  }

  if (popularTarget) {
    const maxReservations = Math.max(
      1,
      ...dashboard.popularRestaurants.map((restaurant) => restaurant.reservations)
    );

    popularTarget.innerHTML = dashboard.popularRestaurants
      .map(
        (restaurant) => `
          <article class="info-card compact popularity-card">
            <p class="eyebrow">Restaurant demand</p>
            <h4>${restaurant.name}</h4>
            <p>${restaurant.reservations} reservations currently recorded.</p>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${(restaurant.reservations / maxReservations) * 100}%"></div>
            </div>
          </article>
        `
      )
      .join("");
  }
}

async function fetchRestaurants() {
  const data = await apiFetch("/api/restaurants");
  state.restaurants = data.restaurants;
  state.filteredRestaurants = data.restaurants;
}

async function fetchBookings(query = "") {
  const data = await apiFetch(`/api/bookings${query}`);
  state.bookings = data.bookings;
  renderBookings();
}

async function fetchDashboard() {
  state.dashboard = await apiFetch("/api/dashboard");
  renderHeroStats();
  renderDashboard();
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  const bookingForm = getElement("booking-form");
  const statusTarget = getElement("booking-status");
  const restaurantSelect = getElement("restaurant-select");
  const partySizeInput = getElement("party-size-input");

  const payload = Object.fromEntries(new FormData(bookingForm).entries());
  payload.partySize = Number(payload.partySize);

  setFormMessage(statusTarget, "Saving reservation...");

  try {
    const data = await apiFetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFormMessage(statusTarget, data.message, "success");
    bookingForm.reset();
    setDefaultReservationDate();
    partySizeInput.value = 2;
    restaurantSelect.value = payload.restaurantId;
    await fetchBookings();
    await fetchDashboard();
    await refreshAvailability();
  } catch (error) {
    setFormMessage(statusTarget, error.message, "error");
  }
}

async function handleSearchSubmit(event) {
  event.preventDefault();
  const params = new URLSearchParams();
  const email = getElement("search-email")?.value.trim();
  const phone = getElement("search-phone")?.value.trim();
  const status = getElement("search-status")?.value;
  const restaurantId = getElement("search-restaurant")?.value;

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
  const contactForm = getElement("contact-form");
  const contactStatus = getElement("contact-status");
  const payload = Object.fromEntries(new FormData(contactForm).entries());

  setFormMessage(contactStatus, "Sending your message...");

  try {
    const data = await apiFetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setFormMessage(contactStatus, data.message, "success");
    contactForm.reset();
    if (page === "dashboard" || page === "home") {
      await fetchDashboard();
    }
  } catch (error) {
    setFormMessage(contactStatus, error.message, "error");
  }
}

function applyReservationQuerySelection() {
  const restaurantSelect = getElement("restaurant-select");
  if (!restaurantSelect) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const restaurantId = params.get("restaurant");

  if (restaurantId && state.restaurants.some((restaurant) => restaurant.id === restaurantId)) {
    restaurantSelect.value = restaurantId;
  }
}

async function initHomePage() {
  await Promise.all([fetchRestaurants(), fetchDashboard()]);
  renderSpotlight();
  renderHomeFeatured();
  renderHomePopular();
}

async function initRestaurantsPage() {
  await fetchRestaurants();
  populateRestaurantFilters();
  renderRestaurantGrid();
  renderRestaurantStats();

  getElement("cuisine-filter")?.addEventListener("change", applyRestaurantFilters);
  getElement("area-filter")?.addEventListener("change", applyRestaurantFilters);
}

async function initReservationsPage() {
  await Promise.all([fetchRestaurants(), fetchBookings(), fetchDashboard()]);
  populateReservationSelects();
  applyReservationQuerySelection();
  setDefaultReservationDate();
  renderSelectedRestaurant();
  await refreshAvailability();

  getElement("booking-form")?.addEventListener("submit", handleBookingSubmit);
  getElement("search-form")?.addEventListener("submit", handleSearchSubmit);
  getElement("reset-search-button")?.addEventListener("click", async () => {
    getElement("search-form").reset();
    await fetchBookings();
  });
  getElement("restaurant-select")?.addEventListener("change", () => {
    renderSelectedRestaurant();
    refreshAvailability();
  });
  getElement("date-input")?.addEventListener("change", refreshAvailability);
  getElement("party-size-input")?.addEventListener("change", refreshAvailability);
}

async function initDashboardPage() {
  await fetchDashboard();
}

async function initContactPage() {
  getElement("contact-form")?.addEventListener("submit", handleContactSubmit);
}

async function initializePage() {
  setupNav();

  if (page === "home") {
    await initHomePage();
    return;
  }

  if (page === "restaurants") {
    await initRestaurantsPage();
    return;
  }

  if (page === "reservations") {
    await initReservationsPage();
    return;
  }

  if (page === "dashboard") {
    await initDashboardPage();
    return;
  }

  if (page === "contact") {
    await initContactPage();
  }
}

initializePage();
