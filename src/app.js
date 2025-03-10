const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "xqu9suyimksu",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "IzXmieY3CbignOcJWPCk5o4SzOjTl5Zd9RbWb1ptcVU",
});

// Variables

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// Close modal cart

[document.querySelector(".hero"), document.querySelector(".products")].forEach(
  (item) => {
    item.addEventListener("click", () => {
      let ui = new UI();
      ui.hideCart();
    });
  }
);

// Cart

let cart = [];
let buttonsDOM = [];

class Product {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "shoppingCart",
      });

      //let result = await fetch("../products.json");
      //let data = await result.json();
      let products = contentful.items;
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

class UI {
  displayProduct(products) {
    let result = "";
    products.forEach((product) => {
      result += `
      <!-- single product -->
      <article class="product">
        <div class="img-container">
          <img
            src=${product.image}
            alt="product"
            class="product-img"
          />
          <button class="bag-btn" data-id=${product.id}>
            <i class="fas fa-shopping-cart"> </i>
            add to cart
          </button>
        </div>
        <h3>${product.title}</h3>
        <h4>$${product.price}</h4>
      </article>
      <!-- end of single product -->
      `;
    });
    productsDOM.innerHTML = result;
  }

  getBagButtons() {
    const bagButton = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = bagButton;
    bagButton.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (event) => {
        event.target.innerText = "In Cart";
        event.target.disabled = true;

        let cartItem = { ...Storage.getProduct(id), amount: 1 };
        cart = [...cart, cartItem];
        Storage.saveCart(cart);
        this.setCartValues(cart);
        this.addCartItem(cartItem);
        this.showCart();
      });
    });
  }

  setCartValues(cart) {
    let tempTot = 0;
    let itemTot = 0;
    cart.map((item) => {
      tempTot += item.price * item.amount;
      itemTot += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTot.toFixed(2));
    cartItems.innerText = itemTot;
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
    <img src=${item.image} alt="product" />
    <div>
      <h4>${item.title}</h4>
      <h5>$ ${item.price} - Partial Total: $<span class='pj' data-id-price="${
      item.id
    }">${item.price * item.amount}</span></h5>
      <span class="remove-item" data-id=${item.id}>remove</span>
    </div>
    <div>
      <i class="fa fa-chevron-up" data-id=${item.id}></i>
      <p class="item-amount">${item.amount}</p>
      <i class="fa fa-chevron-down" data-id=${item.id}></i>
    </div>
  </div>
  `;
    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }

  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }

  setupApp() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populate(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }

  populate(cart) {
    cart.forEach((item) => this.addCartItem(item));
  }

  updatePricePartial(id, price, amount) {
    $(`span[data-id-price=${id}]`).text(price * amount);
  }

  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });

    cartContent.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      }

      // Increment item count in cart
      if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount += 1;
        this.updatePricePartial(id, tempItem.price, tempItem.amount);
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      }

      // Decrement item count in cart
      if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount -= 1;
        this.updatePricePartial(id, tempItem.price, tempItem.amount);
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }

  clearCart() {
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
  }

  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}

class Storage {
  static saveProduct(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

// Events

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Product();

  ui.setupApp();

  // get all products
  products
    .getProducts()
    .then((products) => {
      ui.displayProduct(products);
      Storage.saveProduct(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
