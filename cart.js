// ==============================
// CONFIGURACIÓN
// ==============================
const WHATSAPP_NUMBER = '5218110729156'; // sin '+'
const LOCAL_LAT = 25.9135505; // Latitud de tu local (ejemplo: Monterrey)
const LOCAL_LNG = -100.2418437; // Longitud de tu local

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// ==============================
// CATÁLOGO DE PRODUCTOS (EJEMPLO)
// ==============================
const CATALOG = [
  {
    id: 'sushi1',
    name: 'Sushi Roll Clásico',
    price: 95,
    image: 'media/productos/sushi1.jpg'
  },
  {
    id: 'sushi2',
    name: 'Sushi Roll Especial',
    price: 120,
    image: 'media/productos/sushi2.jpg'
  }
];

// ==============================
// ESTADO DEL CARRITO
// ==============================
const cart = JSON.parse(localStorage.getItem('cart') || '{}'); // { [id]: {id, name, price, image, qty} }

// ==============================
// ENVÍO
// ==============================
let shippingCost = 60; // Costo estándar

function setShipping(cost) {
  shippingCost = cost;
  document.getElementById('shipping').textContent = MXN.format(shippingCost);
  renderCart();
}

// Detectar ubicación y calcular envío por distancia
function detectLocationAndSetShipping() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const distance = getDistanceFromLatLonInKm(userLat, userLng, LOCAL_LAT, LOCAL_LNG);
        // Ejemplo: menos de 5km = $40, más lejos = $60
        if (distance <= 5) setShipping(40);
        else setShipping(60);
      },
      (error) => {
        setShipping(60); // Si no da permiso, costo estándar
      }
    );
  } else {
    setShipping(60);
  }
}

// Haversine formula para distancia en km
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  const R = 6371; // km
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ==============================
// FUNCIONES DE CARRITO
// ==============================
function persist() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(id) {
  if (!cart[id]) {
    const prod = CATALOG.find(p => p.id === id);
    cart[id] = { ...prod, qty: 1 };
  } else {
    cart[id].qty += 1;
  }
  persist();
  renderCart();
  showCartToast('Producto agregado al carrito');
}

function setQty(id, qty) {
  if (cart[id]) {
    if (qty <= 0) delete cart[id];
    else cart[id].qty = qty;
    persist();
    renderCart();
  }
}

function clearCart() {
  Object.keys(cart).forEach(k => delete cart[k]);
  persist();
  renderCart();
}

// ==============================
// RENDER DEL CARRITO
// ==============================
function calcSubtotal() {
  return Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
}

function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');
  const countEl = document.getElementById('cart-count');

  const items = Object.values(cart);
  cartItemsEl.innerHTML = items.length === 0
    ? `<div class="empty">Tu carrito está vacío. Agrega productos del menú.</div>`
    : items.map(item => `
      <div class="cart-item">
        <img src="${item.image || 'media/no-image.jpg'}" alt="${item.name}" onerror="this.onerror=null;this.src='media/no-image.jpg';" />
        <div>
          <div><strong>${item.name}</strong></div>
          <div class="qty">
            <button onclick="setQty('${item.id}', ${item.qty - 1})">-</button>
            <span>${item.qty}</span>
            <button onclick="setQty('${item.id}', ${item.qty + 1})">+</button>
          </div>
        </div>
        <div class="price">${MXN.format(item.price * item.qty)}</div>
      </div>
    `).join('');

  const subtotal = calcSubtotal();
  subtotalEl.textContent = MXN.format(subtotal);
  document.getElementById('shipping').textContent = MXN.format(shippingCost);
  totalEl.textContent = MXN.format(subtotal + shippingCost);

  const count = items.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = `${count} ${count === 1 ? 'artículo' : 'artículos'}`;

  updateCartFab();
}

// ==============================
// EVENTOS
// ==============================
document.getElementById('clear-cart').onclick = clearCart;

// Detectar ubicación al cargar
detectLocationAndSetShipping();

// Render inicial
renderCart();

// Ejemplo: para agregar productos desde botones
// addToCart('sushi1');
// addToCart('sushi2');

function validateAndSendWhatsApp() {
  const name = document.getElementById('customer-name').value.trim();
  const address = document.getElementById('customer-address').value.trim();
  if (!name || !address) {
    alert('Por favor, ingresa tu nombre y dirección para continuar.');
    return;
  }
  sendWhatsApp();
}

document.getElementById('send-whatsapp').onclick = validateAndSendWhatsApp;

function showCartToast(msg) {
  const toast = document.getElementById('cart-toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

function updateCartFab() {
  const count = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const fab = document.getElementById('cart-fab');
  document.getElementById('cart-fab-count').textContent = count;
  fab.style.display = (window.innerWidth < 900 && count > 0) ? 'flex' : 'none';
}
function scrollToCart() {
  document.querySelector('.sidebar').scrollIntoView({ behavior: 'smooth' });
}

window.addEventListener('resize', updateCartFab);

function sendWhatsApp() {
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();
  const notes = document.getElementById('order-notes').value.trim();
  const items = Object.values(cart);
  let msg = `*Nuevo pedido SUSHI KITO'S*\n\n`;
  items.forEach(item => {
    msg += `• ${item.qty} x ${item.name} - ${MXN.format(item.price * item.qty)}\n`;
  });
  msg += `\n*Subtotal:* ${MXN.format(calcSubtotal())}`;
  msg += `\n*Envío:* Se paga al repartidor según zona`;
  msg += `\n*Total:* ${MXN.format(calcSubtotal())}`;
  msg += `\n\n*Cliente:* ${name}`;
  if (phone) msg += `\n*Teléfono:* ${phone}`;
  msg += `\n*Dirección:* ${address}`;
  if (notes) msg += `\n*Notas:* ${notes}`;
  msg += `\n\n_Envío se paga al repartidor según zona._`;

  const url = `https://wa.me/5218110729156?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  clearCart();
  showCartToast('¡Pedido enviado por WhatsApp!');
}