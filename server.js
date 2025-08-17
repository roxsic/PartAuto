const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Для FormData
app.use(express.static(path.join(__dirname, '.'))); // Раздача статических файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Раздача uploads
app.use(session({
    secret: 'volga-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Статичный админ
const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = 'volga123';

// Загрузка продуктов из JSON с обработкой ошибок
let products = [];
const productsFile = path.join(__dirname, 'products.json');
if (fs.existsSync(productsFile)) {
    try {
        const data = fs.readFileSync(productsFile, 'utf8');
        products = JSON.parse(data).products || [];
    } catch (error) {
        console.error('Ошибка парсинга products.json:', error.message);
        products = []; // Продолжаем с пустым массивом
    }
} else {
    console.warn('products.json не найден, создаём пустой массив');
}

// Сохранение продуктов в JSON
function saveProducts() {
    fs.writeFileSync(productsFile, JSON.stringify({ products }), 'utf8');
}

// Загрузка сообщений из JSON с обработкой ошибок
let messages = [];
const messagesFile = path.join(__dirname, 'messages.json');
if (fs.existsSync(messagesFile)) {
    try {
        const data = fs.readFileSync(messagesFile, 'utf8');
        messages = JSON.parse(data).messages || [];
    } catch (error) {
        console.error('Ошибка парсинга messages.json:', error.message);
        messages = []; // Продолжаем с пустым массивом
    }
} else {
    console.warn('messages.json не найден, создаём пустой массив');
}

// Сохранение сообщений в JSON
function saveMessages() {
    fs.writeFileSync(messagesFile, JSON.stringify({ messages }), 'utf8');
}

// API: Получить все продукты
app.get('/products', (req, res) => {
    res.json(products);
});

// API: Логин админа
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// API: Выход админа
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// API: Проверить статус админа
app.get('/check-admin', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
});

// API: Добавить продукт
app.post('/add-product', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Доступ запрещён' });
    }
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Ошибка загрузки файлов: ' + err.message });
        }
        const { name, desc, price, category, status } = req.body;
        const photos = req.files ? req.files.map(file => `uploads/${file.filename}`) : [];
        if (!name || !desc || !price) {
            return res.status(400).json({ success: false, message: 'Заполните все поля' });
        }
        const newProduct = {
            id: uuidv4(),
            name,
            desc,
            price: parseInt(price),
            photos,
            category,
            status
        };
        products.push(newProduct);
        saveProducts();
        res.json({ success: true });
    });
});

// API: Удалить продукт
app.post('/delete-product', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Доступ запрещён' });
    }
    const { id } = req.body;
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products.splice(index, 1);
        saveProducts();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: 'Товар не найден' });
    }
});

// API: Отправить сообщение о сотрудничестве
app.post('/send-message', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Заполните все поля' });
    }
    const newMessage = {
        id: uuidv4(),
        name,
        email,
        message,
        timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    saveMessages();
    res.json({ success: true });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
