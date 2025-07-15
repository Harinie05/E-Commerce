// --- State ---
let token = "";
let user = null;
let currentPage = 1;
let searchQuery = "";
const pageSize = 8;

// --- DOM Elements ---
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const userInfo = document.getElementById("user-info");
const logoutBtn = document.getElementById("logout-btn");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const productList = document.getElementById("product-list");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("search-input");
const cartList = document.getElementById("cart-list");
const placeOrderBtn = document.getElementById("place-order-btn");
const orderList = document.getElementById("order-list");
const adminSection = document.getElementById("admin-section");
const addProductForm = document.getElementById("add-product-form");
const adminProductList = document.getElementById("admin-product-list");
const toastContainer = document.getElementById("toast-container");

// --- Order Details Modal Logic ---
const orderDetailsModal = new bootstrap.Modal(
  document.getElementById("orderDetailsModal")
);
const orderDetailsForm = document.getElementById("order-details-form");
const orderAddress = document.getElementById("order-address");
const orderLocation = document.getElementById("order-location");
const orderPhone = document.getElementById("order-phone");
const orderPayment = document.getElementById("order-payment");
const deliveryEstimate = document.getElementById("delivery-estimate");
let estimatedDeliveryDate = "";

function estimateDelivery(location) {
  const today = new Date();
  let days = 5;
  if (location && location.trim().toLowerCase() === "bangalore") days = 2;
  const deliveryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  estimatedDeliveryDate = deliveryDate.toLocaleDateString();
  return `Estimated Delivery: ${estimatedDeliveryDate}`;
}

orderLocation &&
  orderLocation.addEventListener("input", (e) => {
    deliveryEstimate.textContent = estimateDelivery(e.target.value);
  });

// --- API Base ---
const API = "/api";

// --- Toasts ---
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// --- Loading Spinner ---
function showSpinner(target) {
  target.innerHTML =
    '<div class="d-flex justify-content-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
}

// --- Auth ---
function showApp() {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  userInfo.textContent = user.username;
  if (user.role === "admin") adminSection.classList.remove("hidden");
  else adminSection.classList.add("hidden");
  fetchProducts();
  fetchCart();
  fetchOrders();
  if (user.role === "admin") fetchAdminProducts();
}
function showAuth() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  userInfo.textContent = "";
  token = "";
  user = null;
}
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  showSpinner(authSection);
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    user = data.user;
    showToast("Login successful!", "success");
    showApp();
  } else {
    showToast(data.message || "Login failed", "danger");
    showAuth();
  }
};
registerForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  showSpinner(authSection);
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (res.ok) {
    showToast("Registration successful! Please login.", "success");
    registerForm.reset();
    showAuth();
  } else {
    showToast(data.message || "Registration failed", "danger");
    showAuth();
  }
};
logoutBtn.onclick = () => {
  showAuth();
  showToast("Logged out", "info");
};

// --- Products ---
async function fetchProducts(page = 1, search = "") {
  currentPage = page;
  searchQuery = search;
  showSpinner(productList);
  let url = `${API}/products?page=${page}&limit=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await fetch(url);
  const data = await res.json();
  renderProducts(data.products || [], data.page, data.totalPages);
  renderPagination(data.page, data.totalPages);
}
function renderProducts(products, page, totalPages) {
  productList.innerHTML = "";
  if (!products.length) {
    productList.innerHTML =
      '<div class="col"><div class="alert alert-info">No products found.</div></div>';
    return;
  }
  // Map product names to image paths
  const imageMap = {
    "Wireless Mouse": "/images/mouse.jpg",
    "Bluetooth Headphones": "/images/headphones.jpg",
    "Yoga Mat": "/images/yoga.jpg",
    "Water Bottle": "/images/bottle.jpg",
    "Desk Lamp": "/images/lamp.jpg",
    "Running Shoes": "/images/shoe.jpg",
    Backpack: "/images/bag.jpg",
    "Coffee Mug": "/images/mug.jpg",
    "Smart Watch": "/images/watch.jpg",
    Sunglasses: "/images/glasses.jpg",
    Notebook: "/images/note.jpg",
    "Gaming Keyboard": "/images/keyboard.jpg",
    "Dumbbell Set": "/images/dumbbell.jpg",
    "Table Fan": "/images/fan.jpg",
    "Travel Pillow": "/images/pillow.jpg",
  };
  products.forEach((prod) => {
    const col = document.createElement("div");
    col.className = "col-md-3";
    const imgSrc = imageMap[prod.name] || "/images/mouse.jpg";
    col.innerHTML = `
      <div class="card h-100">
        <div class="product-img-bg" style="background-image: url('${imgSrc}');">
          <img src="${imgSrc}" class="product-img card-img-top mb-2" alt="Product image">
        </div>
        <div class="card-body d-flex flex-column">
          <div class="mb-2"><span class="badge category-badge">${
            prod.category
          }</span></div>
          <h5 class="card-title">${prod.name}</h5>
          <div class="mb-2 text-muted">${prod.description || ""}</div>
          <div class="fw-bold mb-2">₹${prod.price.toFixed(2)}</div>
          <button class="btn btn-outline-primary mt-auto" onclick="addToCart(${
            prod.id
          })">Add to Cart</button>
        </div>
      </div>
    `;
    productList.appendChild(col);
  });
}
function renderPagination(page, totalPages) {
  pagination.innerHTML = "";
  if (totalPages <= 1) return;
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = "page-item" + (i === page ? " active" : "");
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.onclick = (e) => {
      e.preventDefault();
      fetchProducts(i, searchQuery);
    };
    pagination.appendChild(li);
  }
}
searchInput.oninput = (e) => {
  fetchProducts(1, e.target.value);
};
function updateCartBadge(count) {
  const badge = document.getElementById("cart-badge");
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove("hidden");
    } else {
      badge.textContent = "";
      badge.classList.add("hidden");
    }
  }
}
window.addToCart = async function (productId) {
  const quantity = 1;
  const res = await fetch(`${API}/cart/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });
  if (res.ok) {
    showToast("Added to cart!", "success");
    fetchCart();
  } else {
    showToast("Failed to add to cart", "danger");
  }
};

// --- Cart ---
async function fetchCart() {
  showSpinner(cartList);
  const res = await fetch(`${API}/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  renderCart(data.items || []);
  // Update cart badge
  let totalCount = 0;
  (data.items || []).forEach((item) => {
    totalCount += item.quantity;
  });
  updateCartBadge(totalCount);
}
function renderCart(items) {
  cartList.innerHTML = "";
  let total = 0;
  items.forEach((item) => {
    total += item.quantity * (item.Product ? item.Product.price : 0);
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
      <span>${item.Product ? item.Product.name : ""} x ${item.quantity}</span>
      <span>
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="updateCartItem(${
          item.productId
        }, ${item.quantity - 1})">-</button>
        <button class="btn btn-sm btn-outline-secondary me-1" onclick="updateCartItem(${
          item.productId
        }, ${item.quantity + 1})">+</button>
        <button class="btn btn-sm btn-danger" onclick="removeCartItem(${
          item.productId
        })">Remove</button>
      </span>
    `;
    cartList.appendChild(li);
  });
  if (items.length) {
    const li = document.createElement("li");
    li.className = "list-group-item fw-bold text-end";
    li.textContent = `Total: ₹${total.toFixed(2)}`;
    cartList.appendChild(li);
  }
}
window.updateCartItem = async function (productId, quantity) {
  if (quantity < 1) return;
  const res = await fetch(`${API}/cart/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });
  if (res.ok) {
    showToast("Cart updated!", "success");
    fetchCart();
  }
};
window.removeCartItem = async function (productId) {
  const res = await fetch(`${API}/cart/remove`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });
  if (res.ok) {
    showToast("Item removed from cart", "info");
    fetchCart();
  }
};

// --- Orders ---
async function fetchOrders() {
  showSpinner(orderList);
  const res = await fetch(`${API}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  renderOrders(data || []);
}
let lastOrderCity = null;
let lastOrderEstimate = null;

function estimateDeliveryDateFrom(city, createdAt) {
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  let days = 3;
  if (city && city.trim().toLowerCase() === "bangalore") days = 2;
  const deliveryDate = new Date(
    baseDate.getTime() + days * 24 * 60 * 60 * 1000
  );
  return deliveryDate.toLocaleDateString(); // only date
}

function renderOrders(orders) {
  console.log("Orders fetched:", orders); // Debug log
  orderList.innerHTML = "";
  if (!orders.length) {
    orderList.innerHTML = `
      <li class="list-group-item text-center py-5">
        <i class="bi bi-box-seam" style="font-size:2rem;color:#aaa"></i>
        <div class="mt-2">No orders yet.<br><small>Start shopping and your orders will appear here!</small></div>
      </li>
    `;
    return;
  }
  orders.forEach((order, idx) => {
    const date = order.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "";
    let status = "received";
    let deliveryInfo = "";
    if (idx === 0 && lastOrderCity) {
      const estimate = estimateDeliveryDateFrom(lastOrderCity, order.createdAt);
      deliveryInfo = `<span class='badge bg-info ms-2'><i class='bi bi-calendar-event'></i> Will be delivered on: ${estimate}</span>`;
    }
    const li = document.createElement("li");
    li.className =
      "order-fade-in list-group-item d-flex flex-column flex-md-row align-items-md-center justify-content-between border-start border-4 border-primary mb-2 shadow-sm";
    li.innerHTML = `
      <div>
        <i class="bi bi-bag-check-fill text-success me-2"></i>
        <span class="fw-bold">Order #${order.id}</span>
        <span class="text-muted ms-2">${date}</span>
        <span class="badge bg-success ms-2">${status}</span>
        ${deliveryInfo}
      </div>
      <div class="fw-bold text-primary">₹${order.total.toFixed(2)}</div>
    `;
    orderList.appendChild(li);
  });
}

// --- Admin: Manage Products ---
async function fetchAdminProducts() {
  showSpinner(adminProductList);
  const res = await fetch(`${API}/products`);
  const data = await res.json();
  renderAdminProducts(data.products || []);
}
function renderAdminProducts(products) {
  adminProductList.innerHTML = "";
  if (!products.length) {
    adminProductList.innerHTML =
      '<div class="alert alert-info">No products found.</div>';
    return;
  }
  const table = document.createElement("table");
  table.className = "table table-bordered table-sm";
  table.innerHTML = `
    <thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Description</th><th>Actions</th></thead>
    <tbody></tbody>
  `;
  products.forEach((prod) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="form-control form-control-sm" value="${
        prod.name
      }" id="name-${prod.id}"></td>
      <td><input class="form-control form-control-sm" type="number" value="${
        prod.price
      }" id="price-${prod.id}"></td>
      <td><input class="form-control form-control-sm" value="${
        prod.category
      }" id="cat-${prod.id}"></td>
      <td><input class="form-control form-control-sm" value="${
        prod.description || ""
      }" id="desc-${prod.id}"></td>
      <td>
        <button class="btn btn-sm btn-success me-1" onclick="updateProduct(${
          prod.id
        })">Update</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
          prod.id
        })">Delete</button>
      </td>
    `;
    table.querySelector("tbody").appendChild(tr);
  });
  adminProductList.appendChild(table);
}
addProductForm.onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("prod-name").value;
  const price = document.getElementById("prod-price").value;
  const category = document.getElementById("prod-category").value;
  const description = document.getElementById("prod-desc").value;
  const res = await fetch(`${API}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, price, category, description }),
  });
  if (res.ok) {
    showToast("Product added!", "success");
    fetchAdminProducts();
    addProductForm.reset();
    fetchProducts();
  } else {
    showToast("Failed to add product", "danger");
  }
};
window.updateProduct = async function (id) {
  const name = document.getElementById(`name-${id}`).value;
  const price = document.getElementById(`price-${id}`).value;
  const category = document.getElementById(`cat-${id}`).value;
  const description = document.getElementById(`desc-${id}`).value;
  const res = await fetch(`${API}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, price, category, description }),
  });
  if (res.ok) {
    showToast("Product updated!", "success");
    fetchAdminProducts();
    fetchProducts();
  } else {
    showToast("Failed to update product", "danger");
  }
};
window.deleteProduct = async function (id) {
  if (!confirm("Delete this product?")) return;
  const res = await fetch(`${API}/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    showToast("Product deleted!", "info");
    fetchAdminProducts();
    fetchProducts();
  } else {
    showToast("Failed to delete product", "danger");
  }
};

// --- Ensure Place Order Button Opens Order Details Modal ---
document.addEventListener("DOMContentLoaded", () => {
  const placeOrderBtn = document.getElementById("place-order-btn");
  if (placeOrderBtn) {
    placeOrderBtn.onclick = () => {
      if (orderDetailsForm) orderDetailsForm.reset();
      if (deliveryEstimate) deliveryEstimate.textContent = "";
      if (orderDetailsModal) orderDetailsModal.show();
    };
  }
});

// --- Order Details Form Submission ---
if (orderDetailsForm) {
  orderDetailsForm.onsubmit = async (e) => {
    e.preventDefault();
    // Gather order details
    const address = orderAddress.value;
    const location = orderLocation.value;
    const phone = orderPhone.value;
    const payment = orderPayment.value;
    // Estimate delivery date
    estimateDelivery(location); // sets estimatedDeliveryDate
    lastOrderCity = location; // Save for display in order list
    // Place order (send details to backend)
    const res = await fetch(`${API}/orders/place`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // No extra fields needed
    });
    if (res.ok) {
      showToast("Order placed successfully!", "success");
      orderDetailsModal.hide();
      // Refresh cart and orders before showing orders modal
      await fetchCart();
      await fetchOrders();
      // Show Orders modal
      const orderModal = new bootstrap.Modal(
        document.getElementById("orderModal")
      );
      orderModal.show();
      // Wait 3 seconds, then log out
      setTimeout(() => {
        orderModal.hide();
        showAuth();
      }, 3000);
    } else {
      showToast("Failed to place order", "danger");
    }
  };
}

// --- On Load ---
showAuth();

// Add fade-in animation CSS
const style = document.createElement("style");
style.innerHTML = `
.card { transition: box-shadow 0.2s, transform 0.2s; }
.card:hover { box-shadow: 0 8px 32px rgba(80,80,180,0.18); transform: translateY(-4px) scale(1.03); }
.order-fade-in { animation: fadeIn 0.7s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
`;
document.head.appendChild(style);
