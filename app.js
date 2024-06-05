const menuCategoriesDOM = document.querySelector(".menu-categories");

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
}

// local storage
class Storage {}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const menuItems = new Menu();

  menuItems.getMenuItems();
  menuItems.getMenuCategories().then((menuCategories) => {
    ui.displayCategories(menuCategories);
  });
});
