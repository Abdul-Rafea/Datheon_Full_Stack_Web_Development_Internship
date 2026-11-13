const productGrid = document.getElementById('product-grid');
const catalogStatus = document.getElementById('catalog-status');
const catalogError = document.getElementById('catalog-error');
const productSearch = document.getElementById('product-search');
const filterButtons = document.querySelectorAll('.filter-button');
const cartOpenButton = document.getElementById('cart-open-button');
const cartCloseButton = document.getElementById('cart-close-button');
const cartDrawer = document.getElementById('cart-drawer');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartEmpty = document.getElementById('cart-empty');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTax = document.getElementById('cart-tax');
const cartShipping = document.getElementById('cart-shipping');
const cartTotal = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');
const checkoutDialog = document.getElementById('checkout-dialog');
const checkoutTotal = document.getElementById('checkout-total');
const checkoutCancelButton = document.getElementById('checkout-cancel-button');
const checkoutConfirmButton = document.getElementById('checkout-confirm-button');
const confirmationDialog = document.getElementById('confirmation-dialog');
const confirmationCloseButton = document.getElementById('confirmation-close-button');
const orderNumber = document.getElementById('order-number');

const CART_STORAGE_KEY = 'northstar-market-cart-v1';
const TAX_RATE = 0.08;
const SHIPPING_FEE = 6.99;
const FREE_SHIPPING_THRESHOLD = 75;

const demoProducts = [
    { id: 101, title: 'Wireless Earbuds', price: 59.99, category: 'electronics', rating: { rate: 4.7, count: 128 }, illustration: '🎧', isDemo: true },
    { id: 102, title: 'Compact Bluetooth Speaker', price: 42.50, category: 'electronics', rating: { rate: 4.5, count: 86 }, illustration: '🔊', isDemo: true },
    { id: 103, title: 'USB-C Desk Hub', price: 34.00, category: 'electronics', rating: { rate: 4.4, count: 53 }, illustration: '🔌', isDemo: true },
    { id: 104, title: 'Adjustable Desk Lamp', price: 29.99, category: 'electronics', rating: { rate: 4.8, count: 97 }, illustration: '💡', isDemo: true },
    { id: 105, title: 'Layered Pendant Necklace', price: 38.00, category: 'jewelery', rating: { rate: 4.6, count: 72 }, illustration: '📿', isDemo: true },
    { id: 106, title: 'Minimalist Hoop Earrings', price: 24.00, category: 'jewelery', rating: { rate: 4.3, count: 45 }, illustration: '✨', isDemo: true },
    { id: 107, title: 'Classic Stainless Watch', price: 79.00, category: 'jewelery', rating: { rate: 4.7, count: 105 }, illustration: '⌚', isDemo: true },
    { id: 108, title: 'Everyday Crewneck Tee', price: 26.00, category: "men's clothing", rating: { rate: 4.5, count: 83 }, illustration: '👕', isDemo: true },
    { id: 109, title: 'Cotton Utility Overshirt', price: 54.00, category: "men's clothing", rating: { rate: 4.4, count: 38 }, illustration: '🧥', isDemo: true },
    { id: 110, title: 'Soft Knit Cardigan', price: 48.00, category: "women's clothing", rating: { rate: 4.8, count: 116 }, illustration: '🧶', isDemo: true }
];

let products = [];
let activeCategory = 'all';
let searchTerm = '';
const cart = new Map();

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
});

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

function getCategoryLabel(category) {
    if (category === 'jewelery') {
        return 'Jewelry';
    }

    if (category.includes('clothing')) {
        return 'Clothing';
    }

    return category.charAt(0).toUpperCase() + category.slice(1);
}

function setCatalogError(message) {
    catalogError.textContent = message;
    catalogError.hidden = !message;
}

function getBadge(product) {
    if (product.isDemo) {
        return { label: 'Demo', featured: false };
    }

    if (product.rating.rate >= 4.5) {
        return { label: 'Top rated', featured: true };
    }

    if (product.rating.count >= 100) {
        return { label: 'Popular', featured: false };
    }

    return { label: 'Everyday pick', featured: false };
}

function createProductVisual(product, imageClass, illustrationClass, imageAlt) {
    if (product.image) {
        const image = document.createElement('img');
        image.className = imageClass;
        image.src = product.image;
        image.alt = imageAlt;
        image.loading = 'lazy';
        image.addEventListener('error', () => {
            image.hidden = true;
        }, { once: true });
        return image;
    }

    const illustration = document.createElement('span');
    illustration.className = illustrationClass;
    illustration.setAttribute('aria-hidden', 'true');
    illustration.textContent = product.illustration || '✦';
    return illustration;
}

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-image-wrap';

    const badge = getBadge(product);
    const badgeElement = document.createElement('span');
    badgeElement.className = `product-badge${badge.featured ? ' is-featured' : ''}`;
    badgeElement.textContent = badge.label;

    imageWrap.append(createProductVisual(product, 'product-image', 'product-illustration', product.title), badgeElement);

    const details = document.createElement('div');
    details.className = 'product-details';

    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = getCategoryLabel(product.category);

    const title = document.createElement('h2');
    title.className = 'product-title';
    title.textContent = product.title;

    const rating = document.createElement('p');
    rating.className = 'product-rating';

    const star = document.createElement('span');
    star.className = 'rating-star';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '★';

    const ratingText = document.createElement('span');
    ratingText.textContent = `${Number(product.rating.rate).toFixed(1)} (${product.rating.count})`;
    rating.append(star, ratingText);

    const purchase = document.createElement('div');
    purchase.className = 'product-purchase';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = formatCurrency(product.price);

    const addButton = document.createElement('button');
    addButton.className = 'add-button';
    addButton.type = 'button';
    addButton.textContent = 'Add to cart';
    addButton.setAttribute('aria-label', `Add ${product.title} to cart`);
    addButton.addEventListener('click', () => addToCart(product.id));

    purchase.append(price, addButton);
    details.append(category, title, rating, purchase);
    card.append(imageWrap, details);

    return card;
}

function matchesCategory(product) {
    if (activeCategory === 'all') {
        return true;
    }

    if (activeCategory === 'clothing') {
        return product.category.includes('clothing');
    }

    return product.category === activeCategory;
}

function renderProducts() {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const visibleProducts = products.filter((product) => {
        return matchesCategory(product) &&
            product.title.toLowerCase().includes(normalizedSearch);
    });

    productGrid.replaceChildren();

    if (visibleProducts.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-results';
        emptyMessage.textContent = 'No products match your search. Try another category or search term.';
        productGrid.append(emptyMessage);
    } else {
        visibleProducts.forEach((product) => {
            productGrid.append(createProductCard(product));
        });
    }

    catalogStatus.textContent = `Showing ${visibleProducts.length} of ${products.length} products`;
}

function calculateTotals() {
    const subtotal = Array.from(cart.entries()).reduce((total, [id, quantity]) => {
        const product = products.find((item) => item.id === id);
        return product ? total + product.price * quantity : total;
    }, 0);
    const tax = subtotal * TAX_RATE;
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    return {
        subtotal,
        tax,
        shipping,
        total: subtotal + tax + shipping
    };
}

function updateCartCount() {
    const count = Array.from(cart.values()).reduce((total, quantity) => total + quantity, 0);
    cartCount.textContent = String(count);
    cartOpenButton.setAttribute('aria-label', `Open cart with ${count} ${count === 1 ? 'item' : 'items'}`);
}

function persistCart() {
    try {
        const savedCart = Array.from(cart.entries()).map(([id, quantity]) => ({ id, quantity }));
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(savedCart));
    } catch (error) {
        setCatalogError('Your cart changed, but this browser could not save it for your next visit.');
        console.error('Could not save the shopping cart.', error);
    }
}

function restoreCart() {
    try {
        const savedValue = localStorage.getItem(CART_STORAGE_KEY);
        if (!savedValue) {
            return;
        }

        const savedCart = JSON.parse(savedValue);
        if (!Array.isArray(savedCart)) {
            throw new Error('The saved cart has an invalid format.');
        }

        const restoredItems = [];
        let skippedItems = false;
        savedCart.forEach((item) => {
            const validItem = item &&
                Number.isInteger(item.id) &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0;
            const productExists = validItem && products.some((product) => product.id === item.id);

            if (productExists) {
                restoredItems.push([item.id, item.quantity]);
            } else {
                skippedItems = true;
            }
        });

        restoredItems.forEach(([id, quantity]) => cart.set(id, quantity));

        if (skippedItems) {
            setCatalogError('Some saved cart items are no longer available and were removed.');
        }
    } catch (error) {
        setCatalogError('Your saved cart could not be restored. You can still add items to a new cart.');
        console.error('Could not restore the shopping cart.', error);
    }
}

function renderCart() {
    cartItemsContainer.replaceChildren();
    cartEmpty.hidden = cart.size > 0;

    cart.forEach((quantity, id) => {
        const product = products.find((item) => item.id === id);
        if (!product) {
            return;
        }

        const item = document.createElement('article');
        item.className = 'cart-item';

        const imageWrap = document.createElement('div');
        imageWrap.className = 'cart-item-image-wrap';

        imageWrap.append(createProductVisual(product, 'cart-item-image', 'cart-item-illustration', ''));

        const info = document.createElement('div');
        info.className = 'cart-item-info';

        const title = document.createElement('h3');
        title.className = 'cart-item-title';
        title.textContent = product.title;

        const price = document.createElement('p');
        price.className = 'cart-item-price';
        price.textContent = `${formatCurrency(product.price)} each`;

        const actions = document.createElement('div');
        actions.className = 'cart-item-actions';

        const quantityControl = document.createElement('div');
        quantityControl.className = 'quantity-control';
        quantityControl.setAttribute('aria-label', `Quantity for ${product.title}`);

        const decreaseButton = document.createElement('button');
        decreaseButton.className = 'quantity-button';
        decreaseButton.type = 'button';
        decreaseButton.textContent = '−';
        decreaseButton.setAttribute('aria-label', `Decrease quantity of ${product.title}`);
        decreaseButton.addEventListener('click', () => updateQuantity(id, quantity - 1));

        const quantityText = document.createElement('span');
        quantityText.className = 'quantity-value';
        quantityText.textContent = String(quantity);

        const increaseButton = document.createElement('button');
        increaseButton.className = 'quantity-button';
        increaseButton.type = 'button';
        increaseButton.textContent = '+';
        increaseButton.setAttribute('aria-label', `Increase quantity of ${product.title}`);
        increaseButton.addEventListener('click', () => updateQuantity(id, quantity + 1));

        quantityControl.append(decreaseButton, quantityText, increaseButton);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';
        removeButton.setAttribute('aria-label', `Remove ${product.title} from cart`);
        removeButton.addEventListener('click', () => updateQuantity(id, 0));

        actions.append(quantityControl, removeButton);
        info.append(title, price, actions);
        item.append(imageWrap, info);
        cartItemsContainer.append(item);
    });

    const totals = calculateTotals();
    cartSubtotal.textContent = formatCurrency(totals.subtotal);
    cartTax.textContent = formatCurrency(totals.tax);
    cartShipping.textContent = totals.shipping === 0 && totals.subtotal > 0 ? 'Free' : formatCurrency(totals.shipping);
    cartTotal.textContent = formatCurrency(totals.total);
    checkoutButton.disabled = cart.size === 0;
    updateCartCount();
}

function addToCart(productId) {
    cart.set(productId, (cart.get(productId) || 0) + 1);
    setCatalogError('');
    persistCart();
    renderCart();
}

function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
        cart.delete(productId);
    } else {
        cart.set(productId, quantity);
    }

    persistCart();
    renderCart();
}

async function loadProducts() {
    products = demoProducts;
    renderProducts();
    catalogStatus.textContent = 'Loading live products. Showing demo items in the meantime.';
    setCatalogError('');

    try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
            throw new Error('The product catalog could not be loaded. Please try again later.');
        }

        const productData = await response.json();
        if (!Array.isArray(productData)) {
            throw new Error('The product catalog returned an unexpected response.');
        }

        const apiProducts = productData.filter((product) => {
            return product &&
                Number.isInteger(product.id) &&
                typeof product.title === 'string' &&
                typeof product.category === 'string' &&
                Number.isFinite(product.price) &&
                product.rating &&
                Number.isFinite(product.rating.rate) &&
                Number.isFinite(product.rating.count);
        });

        products = [...apiProducts, ...demoProducts];
        restoreCart();
        renderProducts();
        renderCart();
    } catch (error) {
        products = demoProducts;
        restoreCart();
        renderProducts();
        renderCart();
        catalogStatus.textContent = `Showing ${demoProducts.length} demo products.`;
        const message = error instanceof TypeError
            ? 'Could not connect to FakeStoreAPI.'
            : error.message || 'An unexpected error occurred while loading products.';
        setCatalogError(`${message} Showing demo products instead.`);
        console.error('Could not load products.', error);
    }
}

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        activeCategory = button.dataset.category;
        filterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle('is-active', isActive);
            filterButton.setAttribute('aria-pressed', String(isActive));
        });
        renderProducts();
    });
});

productSearch.addEventListener('input', () => {
    searchTerm = productSearch.value;
    renderProducts();
});

cartOpenButton.addEventListener('click', () => cartDrawer.showModal());
cartCloseButton.addEventListener('click', () => cartDrawer.close());

checkoutButton.addEventListener('click', () => {
    if (cart.size === 0) {
        return;
    }

    checkoutTotal.textContent = cartTotal.textContent;
    checkoutDialog.showModal();
});

checkoutCancelButton.addEventListener('click', () => checkoutDialog.close());

checkoutConfirmButton.addEventListener('click', () => {
    orderNumber.textContent = `NS-${Date.now().toString().slice(-6)}`;
    cart.clear();
    persistCart();
    renderCart();
    checkoutDialog.close();
    cartDrawer.close();
    confirmationDialog.showModal();
});

confirmationCloseButton.addEventListener('click', () => confirmationDialog.close());

loadProducts();
