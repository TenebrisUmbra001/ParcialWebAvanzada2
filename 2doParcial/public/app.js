const API = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role');
let allProducts = [];
let editingProductId = null;

// --- HELPERS ---
function showMsg(text, isError = false) {
    const el = document.getElementById('msg');
    el.textContent = text;
    el.className = `msg active ${isError ? 'error' : 'success'}`;
    setTimeout(() => el.className = 'msg', 4000);
}

function updateUI() {
    const authView = document.getElementById('auth-view');
    const dashboard = document.getElementById('dashboard');
    
    if (token) {
        authView.style.display = 'none';
        dashboard.classList.add('active');
        
        // Mostrar solo el nombre del rol
        document.getElementById('user-info').textContent = userRole === 'ADMIN' ? 'Admin' : 'Operador';
        
        // PERMISOS: Solo el ADMIN ve lo de gestionar productos y bajo stock
        const btnAddProduct = document.getElementById('btn-add-product');
        const btnLowStock = document.getElementById('low-stock-btn');
        
        if (userRole === 'ADMIN') {
            btnLowStock.style.display = 'block';
            btnAddProduct.style.display = 'inline-flex'; // Mostrar botón añadir
        } else {
            btnLowStock.style.display = 'none';
            btnAddProduct.style.display = 'none'; // Ocultar botón añadir para operador
        }
        loadProducts();
    } else {
        authView.style.display = 'flex';
        dashboard.classList.remove('active');
    }
}

async function apiFetch(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${API}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) {
        alert("⚠️ " + (data.error || 'Error desconocido'));
        throw new Error(data.error);
    }
    return data;
}

// --- AUTH ---
async function login() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const data = await apiFetch('/auth/login', 'POST', { email, password });
        token = data.token; userRole = data.user.role;
        localStorage.setItem('token', token); localStorage.setItem('role', userRole);
        updateUI();
    } catch (e) { console.error(e); }
}

async function register() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const data = await apiFetch('/auth/register', 'POST', { email, password });
        token = data.token; userRole = data.user.role;
        localStorage.setItem('token', token); localStorage.setItem('role', userRole);
        updateUI();
    } catch (e) { console.error(e); }
}

function logout() {
    token = null; userRole = null;
    localStorage.removeItem('token'); localStorage.removeItem('role');
    updateUI();
}

// --- TABS ---
function showTab(tabName, btnElement) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    btnElement.classList.add('active');
    
    if (tabName === 'low-stock') loadLowStock();
    if (tabName === 'orders') { 
        loadProducts(); 
        document.getElementById('order-items-build').innerHTML = ''; 
        addOrderItemRow(); 
        loadOrders(); // <--- AÑADIDO: Cargar la lista de pedidos al entrar
    }
}

// --- PRODUCTS ---
async function loadProducts() {
    try {
        allProducts = await apiFetch('/products');
        renderProducts(allProducts, 'product-list');
    } catch (e) { console.error(e); }
}

function renderProducts(products, containerId) {
    const container = document.getElementById(containerId);
    if (products.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center; margin-top:20px;">No hay productos para mostrar.</p>';
        return;
    }
    
    // PERMISOS: Solo mostrar columna de acciones si es ADMIN
    const isAdmin = userRole === 'ADMIN';
    const actionHeader = isAdmin ? '<th>Acciones</th>' : '';
    
    const html = `<table>
        <thead><tr><th>Nombre</th><th>SKU</th><th>Stock</th><th>Mín</th><th>Precio</th><th>Categoría</th>${actionHeader}</tr></thead>
        <tbody>
        ${products.map(p => {
            let row = `<tr>
                <td>${p.name}</td><td>${p.sku}</td><td>${p.stock}</td><td>${p.minStock}</td>
                <td>$${p.price}</td><td>${p.category?.name || '-'}</td>`;
            if (isAdmin) {
                row += `<td>
                    <button class="action-btn btn-edit" onclick="openEditModal(${p.id})">✏️</button>
                    <button class="action-btn btn-delete" onclick="deleteProduct(${p.id})">🗑️</button>
                </td>`;
            }
            row += `</tr>`;
            return row;
        }).join('')}
        </tbody>
    </table>`;
    container.innerHTML = html;
}

// --- MODAL LOGIC ---
function openAddModal() {
    editingProductId = null;
    document.getElementById('modal-title').textContent = 'Agregar Producto';
    document.getElementById('btn-save-product').textContent = 'Guardar';
    clearProductForm();
    document.getElementById('product-modal').classList.add('active');
}

function openEditModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('modal-title').textContent = 'Modificar Producto';
    document.getElementById('btn-save-product').textContent = 'Actualizar';
    
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-sku').value = product.sku;
    document.getElementById('p-stock').value = product.stock;
    document.getElementById('p-minStock').value = product.minStock;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-category').value = product.category?.name || '';
    
    document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    clearProductForm();
}

function clearProductForm() {
    ['p-name', 'p-sku', 'p-stock', 'p-minStock', 'p-price', 'p-category'].forEach(id => document.getElementById(id).value = '');
}

async function saveProduct() {
    try {
        const numStock = parseFloat(document.getElementById('p-stock').value);
        const numMinStock = parseFloat(document.getElementById('p-minStock').value);
        const numPrice = parseFloat(document.getElementById('p-price').value);

        if (isNaN(numStock) || isNaN(numMinStock) || isNaN(numPrice)) {
            return alert("⚠️ Revisa los campos numéricos.");
        }

        const body = {
            name: document.getElementById('p-name').value,
            sku: document.getElementById('p-sku').value,
            stock: numStock, minStock: numMinStock, price: numPrice,
            categoryName: document.getElementById('p-category').value
        };

        if (editingProductId) {
            await apiFetch(`/products/${editingProductId}`, 'PUT', body);
            alert('✅ Producto actualizado');
        } else {
            await apiFetch('/products', 'POST', body);
            alert('✅ Producto guardado');
        }

        closeProductModal();
        await loadProducts();
    } catch (e) { console.error(e); }
}

async function deleteProduct(id) {
    if (!confirm("⚠️ ¿Estás seguro de eliminar este producto?")) return;
    try {
        await apiFetch(`/products/${id}`, 'DELETE');
        alert('✅ Producto eliminado');
        await loadProducts();
    } catch (e) { console.error(e); }
}

async function loadLowStock() {
    try {
        const prods = await apiFetch('/products/low-stock');
        renderProducts(prods, 'low-stock-list');
    } catch (e) { console.error(e); }
}

// --- ORDERS ---
function renderOrderProductSelect() {
    return allProducts.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`).join('');
}

function addOrderItemRow() {
    const container = document.getElementById('order-items-build');
    const div = document.createElement('div');
    div.className = 'order-item-row';
    div.style.marginBottom = "10px";
    div.style.display = "flex";
    div.style.gap = "10px";
    div.innerHTML = `
        <select class="o-prod" style="flex:3; padding:8px; border-radius:4px; border:1px solid #ccc;">${renderOrderProductSelect()}</select>
        <input type="number" class="o-qty" placeholder="Cant" min="1" value="1" style="flex:1; padding:8px; border-radius:4px; border:1px solid #ccc;">
    `;
    container.appendChild(div);
}

async function createOrder() {
    try {
        const rows = document.querySelectorAll('.order-item-row');
        const items = [];
        rows.forEach(row => {
            const productId = parseInt(row.querySelector('.o-prod').value);
            const quantity = parseInt(row.querySelector('.o-qty').value);
            if (quantity > 0) items.push({ productId, quantity });
        });
        if (items.length === 0) return alert('⚠️ Agrega al menos un producto');
        
        const data = await apiFetch('/orders', 'POST', { items });
        alert(`✅ ¡Pedido #${data.id} creado exitosamente!`);
        
        loadProducts(); 
        document.getElementById('order-items-build').innerHTML = '';
        addOrderItemRow();
        loadOrders(); 
    } catch (e) { console.error(e); }
}

async function loadOrders() {
    try {
        const orders = await apiFetch('/orders');
        renderOrders(orders);
    } catch (e) { console.error(e); }
}

// Función para traducir el estado
function translateStatus(status) {
    const statuses= {
        'PENDING': 'Pendiente',
        'DISPATCHED': 'Despachado',
        'CANCELLED': 'Cancelado'
    };
    return statuses[status] || status;
}

function renderOrders(orders) {
    const container = document.getElementById('order-list');
    if (orders.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center; margin-top:20px;">No hay pedidos registrados.</p>';
        return;
    }

    const html = `<table>
        <thead><tr><th>ID</th><th>Operador</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody>
        ${orders.map(o => {
            let statusColor = o.status === 'PENDING' ? '#f39c12' : o.status === 'DISPATCHED' ? '#27ae60' : '#e74c3c';
            return `<tr>
                <td>#${o.id}</td>
                <td>${o.operator.email}</td>
                <td><span style="color:${statusColor}; font-weight:bold;">${translateStatus(o.status)}</span></td>
                <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="viewOrderDetail(${o.id})">👁️ Ver</button>
                    ${o.status === 'PENDING' ? `<button class="action-btn btn-delete" onclick="updateOrder(${o.id}, 'CANCELLED')">❌ Cancelar</button>` : ''}
                </td>
            </tr>`;
        }).join('')}
        </tbody>
    </table>`;
    container.innerHTML = html;
}

// Funciones del Modal de Detalle
function closeOrderModal() {
    document.getElementById('order-modal').classList.remove('active');
}

async function viewOrderDetail(id) {
    try {
        const order = await apiFetch(`/orders/${id}`);
        const modalBody = document.getElementById('order-modal-body');
        document.getElementById('order-modal-title').innerText = `Detalle Pedido #${order.id}`;

        let statusBtns = '';
        if (order.status === 'PENDING') {
            statusBtns = `
                <button class="btn-primary" onclick="updateOrder(${order.id}, 'DISPATCHED')" style="margin-right:10px;">✅ Despachar</button>
                <button class="btn-cancel" style="color:red; border-color:red;" onclick="updateOrder(${order.id}, 'CANCELLED')">❌ Cancelar Pedido</button>
            `;
        }

        modalBody.innerHTML = `
            <div style="margin-bottom: 15px;">
                <p><strong>Estado:</strong> <span style="color:var(--primary); font-weight:bold;">${translateStatus(order.status)}</span></p>
                <p><strong>Operador:</strong> ${order.operator.email}</p>
                <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <table style="margin-top:10px;">
                <thead><tr><th>Producto</th><th>Cant</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                    ${order.items.map((i) => `<tr>
                        <td>${i.product.name}</td>
                        <td>${i.quantity}</td>
                        <td>$${i.priceAtOrder}</td>
                        <td>$${(i.priceAtOrder * i.quantity).toFixed(2)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <div style="margin-top: 20px; text-align: right;">
                ${statusBtns}
            </div>
        `;
        
        document.getElementById('order-modal').classList.add('active');
    } catch (e) { console.error(e); }
}

async function searchOrder() {
    const idInput = document.getElementById('order-search') ;
    const id = parseInt(idInput.value);
    
    if (!id || id <= 0) {
        return alert("⚠️ Ingresa un ID de pedido válido (número mayor a 0)");
    }
    
    viewOrderDetail(id);
}

async function updateOrder(id, status) {
    if (status === 'CANCELLED') {
        if (!confirm("⚠️ ¿Cancelar pedido? El stock será devuelto al inventario.")) return;
    }
    try {
        const data = await apiFetch(`/orders/${id}/status`, 'PATCH', { status });
        alert(data.message || '✅ Estado actualizado');
        closeOrderModal(); // Cerrar modal
        loadOrders(); // Refrescar tabla
        loadProducts(); // Refrescar stocks
    } catch (e) { console.error(e); }
}

// Init
updateUI();