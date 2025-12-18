document.addEventListener('DOMContentLoaded', function() {
    loadBuquets();
    updateCartCounter(); // Обновляем счетчик при загрузке
});

function loadBuquets(){
    fetch('/buquets.json')
    .then (response => response.json())
    .then(data =>{
        console.log('Данные загружены', data);
        showProducts(data);
    })
    .catch(error => {
        console.error('Ошибка загрузки JSON', error);
        document.getElementById('cards-buquets').innerHTML = '<p>Товары не загрузились :(</p>';
    })
}

function showProducts(productsData){
    const container = document.getElementById('cards-buquets');
    let html = '';

    window.selectedSizes = {};
    
    // Проходим по всем товарам
    for (const productKey in productsData) {
        const product = productsData[productKey];
        
        const minPrice = Math.min(...product.sizes.map(s => s.price));

        window.selectedSizes[productKey] = {
            size: product.sizes[0].size,  
            price: minPrice
        };

        html += `
        <div class="buquet-card" data-id="${productKey}">  
            <h3 class="buquet-name">${product.name}</h3>     
            <div class="image-container">
                <img src="${product.image}" alt="${product.name}" class="buquet-image">
                <div class="sizes-overlay">
                    ${product.sizes.map(size => `
                        <button class="size-btn" 
                                data-size="${size.size}" 
                                data-price="${size.price}"
                                onclick="selectSize('${productKey}', '${size.size}', ${size.price})">
                            ${size.size}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="buquet-price" id="price-${productKey}">
                ${minPrice} руб.
            </div>
            <div class="buttons-row">
                <button class="wishlist-btn" onclick="addToWishlist('${productKey}')">♡</button>
                <button class="ordering-btn" data-art="${productKey}" onclick="order('${productKey}')">Заказать</button>
                <!-- Кнопка "В корзину" -->
                <button class="cart-btn" onclick="addToCart('${productKey}')">В корзину</button>
                <button class="add-to-cart-btn" onclick="addToCart('${productKey}')">+</button>
            </div>
        </div>`;
    }
    
    container.innerHTML = html;
}

function selectSize(productId, size, price) {
    // Находим все кнопки размеров в этой карточке
    const sizeButtons = document.querySelectorAll(`[data-id="${productId}"] .size-btn`);
    sizeButtons.forEach(btn => btn.classList.remove('active'));
    
    // Находим и активируем выбранную кнопку
    const selectedBtn = document.querySelector(`[data-id="${productId}"] .size-btn[data-size="${size}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }

    // Обновляем выбранный размер
    window.selectedSizes[productId] = { size, price };
    
    // Обновляем отображение цены
    updatePriceDisplay(productId, price);
    
    console.log(`Выбран размер ${size} за ${price} руб. для товара ${productId}`);
}

function updatePriceDisplay(productId, price) {
    const priceElement = document.getElementById(`price-${productId}`);
    if (priceElement) {
        priceElement.textContent = `${price} руб.`;
        priceElement.style.color = '#e74c3c';
    }
}

// Функция добавления в корзину с LocalStorage
function addToCart(productId) {
    if (!window.selectedSizes || !window.selectedSizes[productId]) {
        alert('Пожалуйста, выберите размер!');
        return;
    }
    
    const selectedSize = window.selectedSizes[productId];
    const productNameElement = document.querySelector(`[data-id="${productId}"] .buquet-name`);
    const productName = productNameElement ? productNameElement.textContent : 'Товар';
    
    // Получаем текущую корзину из LocalStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    // Проверяем, есть ли уже этот товар в корзине
    if (cart[productId]) {
        // Увеличиваем количество, если товар уже есть
        cart[productId].quantity += 1;
    } else {
        // Добавляем новый товар в корзину
        cart[productId] = {
            id: productId,
            name: productName,
            size: selectedSize.size,
            price: selectedSize.price,
            quantity: 1,
            image: document.querySelector(`[data-id="${productId}"] .buquet-image`).src,
            addedAt: new Date().toISOString() // Время добавления
        };
    }
    // Сохраняем обновленную корзину в LocalStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    // Обновляем счетчик корзины на странице
    updateCartCounter();
    // Показываем уведомление пользователю
    alert(`Товар "${productName}" (размер: ${selectedSize.size}, цена: ${selectedSize.price} руб.) добавлен в корзину!`);
    console.log('Корзина пользователя:', cart);
    // Вызов функции подсчета суммы
    sum(selectedSize.price);
}


// Функция для обновления счетчика корзины
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || {};
    const totalItems = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
    
    // Находим элемент счетчика корзины на странице
    const cartCounter = document.getElementById('cart-counter');
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    
    console.log(`В корзине: ${totalItems} товаров`);
}

function addToWishlist(productId) {
    const wishlistBtn = document.querySelector(`[data-id="${productId}"] .wishlist-btn`);
    if (!wishlistBtn) return;
    
    wishlistBtn.classList.toggle('active');
    
    if (wishlistBtn.classList.contains('active')) {
        wishlistBtn.textContent = '♥';
        wishlistBtn.style.color = '#ff4757';
        console.log(`Товар ${productId} добавлен в избранное`);
    } else {
        wishlistBtn.textContent = '♡';
        wishlistBtn.style.color = '';
        console.log(`Товар ${productId} удален из избранного`);
    }
}

function order(productId) {
    const orderBtn = document.querySelector(`[data-id="${productId}"] .ordering-btn`);
    const article = orderBtn ? orderBtn.getAttribute('data-art') : productId;
    
    console.log('Заказ товара:', {
        productId: productId,
        article: article,
        selectedSize: window.selectedSizes[productId]
    });
    
    alert(`Заказ товара "${article}" оформлен!`);
}

function sum(price) {
    console.log(`Товар добавлен в корзину, его цена: ${price} руб.`);
    // Здесь можно добавить логику подсчета общей суммы
}

// Дополнительные функции для работы с корзиной

// Функция для удаления товара из корзины
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    if (cart[productId]) {
        delete cart[productId];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();
        console.log(`Товар ${productId} удален из корзины`);
    }
}

// Функция для изменения количества товара
function updateCartQuantity(productId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || {};
    
    if (cart[productId]) {
        if (newQuantity > 0) {
            cart[productId].quantity = newQuantity;
        } else {
            delete cart[productId];
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();
    }
}

// Функция для получения всей корзины
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || {};
}

// Функция для очистки корзины
function clearCart() {
    localStorage.removeItem('cart');
    updateCartCounter();
    console.log('Корзина очищена');
}