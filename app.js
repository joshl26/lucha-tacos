const menuCategoriesDOM = document.querySelector(".menu-categories");
const menuItemsDOM = document.querySelector(".menu-items");

// cart
let cart = [];

// buttons
let buttonsDOM = [];

// getting the menu items
class Menu {
  async getMenuItems() {
    try {
      let result = await fetch("../menu-items.json");
      let menuItems = await result.json();
      return menuItems;
    } catch (error) {
      console.log(error);
    }
  }

  async getMenuCategories() {
    try {
      let result = await fetch("../menu-categories.json");
      let data = await result.json();
      let menuCategories = data.categories;
      return menuCategories;
    } catch (error) {
      console.log(error);
    }
  }
}

// display menu items
class UI {
  displayCategories(menuCategories) {
    let result = "";
    menuCategories.forEach((category) => {
      //   console.log(category);

      result += `
    
      <button class="menu-category position-relative" data-id=${category.id}>
                <img
                  class="position-relative"
                  src=${category.image}
                  alt=""
                  style="max-width: 150px; max-height: 150px"
                />
                <h5
                  class="position-absolute p-1 text-white"
                  style="top: 0; background-color: rgb(255, 0, 0)"
                >
                  ${category.title}
                </h5>
              </button>

    `;
    });
    menuCategoriesDOM.innerHTML = result;
  }
  displayItems(menuItems) {
    let result = "";
    menuItems.tacos.forEach((item) => {
      result += `
        <div class="flex-row rounded-4 bg-white">
        <div
          class="rounded-top-4 h-auto text-black"
          style="background-color: lightgray"
        >
          <div class="d-flex flex-row justify-content-between">
            <h5 class="pt-3 px-3 m-0">${item.title}</h5>
            <div class="d-flex flex-row">
              <p class="m-auto px-2" style="font-size: 20px">$${item.price}</p>
              <button
                class="pt-1"
                style="background-color: transparent; border: 0px"
                data-id=${item.id}
              >
                <i
                  style="
                    font-size: 25px;
                    color: rgb(255, 30, 30);
                    border: 0px;
                  "
                  class="fa-sharp fa-solid fa-circle-xmark px-3"
                ></i>
              </button>
            </div>
          </div>
          <p class="p-3 m-0">
            ${item.description}
          </p>
        </div>
        <div class="d-flex flex-row justify-content-between">
          <div class="flex-column">
            <div class="d-flex flex-row text-black h-100">
              <div class="flex-column px-3 m-auto">
                <button
                  style="background-color: transparent; border: 0px"
                >
                  <i
                    class="fa-sharp fa-solid fa-circle-minus fa-xl"
                    style="font-size: 25px; color: rgb(255, 30, 30)"
                  ></i>
                </button>
              </div>
              <div
                class="flex-column px-3 m-auto"
                style="font-size: 20px"
              >
                1
              </div>
              <div class="flex-column px-3 m-auto">
                <button
                  style="background-color: transparent; border: 0px"
                  class=""
                >
                  <i
                    class="fa-sharp fa-solid fa-circle-plus fa-xl"
                    style="font-size: 25px; color: rgb(255, 30, 30)"
                  ></i>
                </button>
              </div>
            </div>
          </div>
          <div class="flex-column align-content-center">
            <button
              style="background-color: red; border: 0px"
              class="p-1 rounded mx-3 my-2 px-5 text-white"
              data-id=${item.id}
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>

        `;
    });
    menuItemsDOM.innerHTML = result;
  }
}

// local storage
class Storage {
  static saveCategories(categories) {
    localStorage.setItem("categories", JSON.stringify(categories));
  }
  static saveItems(items) {
    localStorage.setItem("items", JSON.stringify(items));
    console.log(JSON.stringify(items));
  }
  static getCategory(id) {
    let categories = JSON.parse(localStorage.getItem("categories"));
    return categories.find((category) => (category.id = id));
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

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const menuItems = new Menu();

  menuItems.getMenuItems().then((menuItems) => {
    ui.displayItems(menuItems);
    Storage.saveItems(menuItems);
  });
  menuItems.getMenuCategories().then((menuCategories) => {
    ui.displayCategories(menuCategories);
    Storage.saveCategories(menuCategories);
  });
});
