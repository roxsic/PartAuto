// Меню для мобильных
function toggleMenu() {
    document.querySelector('.menu ul').classList.toggle('show');
}

// Вход как клиент
function enterAsClient() {
    document.getElementById('login').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    // Показываем основной контент (он всегда виден, но на всякий случай)
    document.getElementById('home').style.display = 'block';
    document.getElementById('categories').style.display = 'block';
    document.getElementById('products').style.display = 'block';
    displayProducts(); // Обновляем список товаров
}

// Вход как администратор (показ формы логина)
function enterAsAdmin() {
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    // Скрываем основной контент, если нужно (но по запросу оставляем видимым)
}

// Отобразить продукты (основная страница)
async function displayProducts(filtered) {
    const list = document.getElementById('product-list');
    list.innerHTML = '';
    const productsToShow = filtered || await getProducts();
    productsToShow.forEach(p => {
        const firstPhoto = p.photos && p.photos.length > 0 ? p.photos[0] : 'https://via.placeholder.com/300x200?text=No+Image';
        list.innerHTML += `
            <div class="product-card">
                <img src="${firstPhoto}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.desc}</p>
                <p>Цена: ${p.price} RUB</p>
                <p>Статус: ${p.status}</p>
                ${p.photos && p.photos.length > 1 ? `<p>И ещё ${p.photos.length - 1} фото</p>` : ''}
                <button>Купить</button>
            </div>
        `;
    });
}

// Отобразить список продуктов в админ-панели
async function displayAdminProducts() {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    const products = await getProducts();
    products.forEach(p => {
        list.innerHTML += `
            <div class="admin-product-item">
                <h4>${p.name}</h4>
                <button onclick="deleteProduct('${p.id}')">Удалить</button>
            </div>
        `;
    });
}

// Получить продукты с сервера
async function getProducts() {
    const response = await fetch('/products');
    return await response.json();
}

// Фильтр по категории (добавлена 'cars')
async function filterByCategory(cat) {
    const allProducts = await getProducts();
    const filtered = allProducts.filter(p => p.category === cat);
    displayProducts(filtered);
}

// Поиск
async function searchItems() {
    const query = document.getElementById('search').value.toLowerCase();
    const allProducts = await getProducts();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query));
    displayProducts(filtered);
}

// Проверить статус админа
async function checkAdminStatus() {
    try {
        const response = await fetch('/check-admin');
        const { isAdmin } = await response.json();
        if (isAdmin) {
            document.getElementById('login').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            await displayAdminProducts();
        } else {
            document.getElementById('login').classList.remove('hidden');
            document.getElementById('admin-panel').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error in checkAdminStatus:', error);
        alert('Ошибка проверки статуса: ' + error.message);
    }
}

// Авторизация админа
async function loginAdmin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
        checkAdminStatus();
    } else {
        alert(data.message || 'Неверный логин/пароль');
    }
}

// Выход админа (возврат в режим клиента)
async function logoutAdmin() {
    await fetch('/logout');
    enterAsClient(); // Возвращаем в режим клиента
}

// Добавить товар (обновлено для новой категории)
async function addProduct() {
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('desc', document.getElementById('product-desc').value);
    formData.append('price', document.getElementById('product-price').value);
    const selectedCategory = document.getElementById('product-category').value;
    formData.append('category', selectedCategory.includes('Мебель') ? 'furniture' : selectedCategory.includes('Запчасти') ? 'parts' : 'cars');
    formData.append('status', document.getElementById('product-status').value.split(': ')[1]);

    const files = document.getElementById('product-images').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }

    try {
        const response = await fetch('/add-product', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error('Ошибка сервера: ' + response.status);
        }
        const data = await response.json();
        if (data.success) {
            await displayProducts();
            await displayAdminProducts();
            alert('Товар добавлен!');
        } else {
            alert(data.message || 'Ошибка добавления');
        }
    } catch (error) {
        console.error(error);
        alert('Произошла ошибка: ' + error.message);
    }
}

// Удалить товар
async function deleteProduct(id) {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
        const response = await fetch('/delete-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await response.json();
        if (data.success) {
            await displayProducts();
            await displayAdminProducts();
            alert('Товар удалён!');
        } else {
            alert(data.message || 'Ошибка удаления');
        }
    }
}

// Открыть модал сотрудничества
function openCooperationModal() {
    document.getElementById('cooperation-modal').classList.remove('hidden');
}

// Закрыть модал сотрудничества
function closeCooperationModal() {
    document.getElementById('cooperation-modal').classList.add('hidden');
}

// Отправить сообщение о сотрудничестве
async function sendCooperationMessage() {
    const name = document.getElementById('coop-name').value;
    const email = document.getElementById('coop-email').value;
    const message = document.getElementById('coop-message').value;

    try {
        const response = await fetch('/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });
        const data = await response.json();
        if (data.success) {
            alert('Сообщение отправлено!');
            closeCooperationModal();
        } else {
            alert(data.message || 'Ошибка отправки');
        }
    } catch (error) {
        console.error(error);
        alert('Произошла ошибка: ' + error.message);
    }
}

// Фильтр по модели авто (демо)
document.getElementById('car-select').addEventListener('change', () => {
    alert('Фильтр по модели: ' + document.getElementById('car-select').value);
});

// Фильтр по городу (демо)
document.getElementById('city-select').addEventListener('change', () => {
    alert('Доставка в: ' + document.getElementById('city-select').value);
});

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // По умолчанию входим как клиент
        enterAsClient();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Ошибка загрузки страницы: ' + error.message);
    }
});
