# Lucha Libre Restaurant Website

Welcome to the **Lucha Libre Restaurant** website project! This is a vibrant, lucha libre-themed restaurant site featuring a dynamic menu, ordering system, and rich multimedia content designed to engage users and drive online orders.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Development Roadmap](#development-roadmap)
- [Getting Started](#getting-started)
- [Technologies Used](#technologies-used)
- [Accessibility & SEO](#accessibility--seo)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Project Overview

This project delivers a unique online presence for a lucha libre-themed restaurant, combining bold branding with a user-friendly menu and ordering experience. The site includes:

- Autoplay hero video with accessible descriptions
- Interactive menu with category filtering
- Add-to-cart functionality with planned cart modal display
- Responsive design optimized for desktop and mobile
- Accessibility improvements for screen readers and SEO

---

## Features

- **Dynamic Menu Display:** Items load from JSON data with category filters.
- **Add to Cart:** Users can add items to their cart (cart modal coming soon).
- **Accessibility:** Semantic HTML, ARIA labels, descriptive alt text, and keyboard navigation support.
- **SEO Optimized:** Proper heading hierarchy, meta tags, and descriptive titles.
- **Interactive Elements:** Feedback buttons, delivery service links, and hover states (in progress).

---

## Development Roadmap

The project is organized into phases:

### Phase 1: Critical Fixes (Complete)

- Menu display and filtering fixes
- State management refactor (no localStorage)
- Accessibility and SEO improvements

### Phase 2: Functionality (In Progress)

- Cart modal and quantity controls
- Navigation fixes and link clarifications
- Interactive feedback form and clickable delivery images

### Phase 3: Enhancements

- Animations and smooth transitions
- Advanced menu filtering (vegetarian, spicy, dietary)
- Content expansion and mobile optimization

### Phase 4: Polish & Launch

- Comprehensive testing and performance optimization
- Deployment setup and monitoring
- Post-launch feedback and updates

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You'll need a web server to properly view the site, especially if it loads local JSON files (browsers often restrict `file://` access for security).

### Installation & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/lucha-libre-restaurant.git
    ```
2.  **Navigate to the project directory:**

    ```bash
    cd lucha-libre-restaurant
    ```

3.  **Run with a Live Server (Recommended):**

    The easiest way to run this project with live-reloading is using the VS Code Live Server extension.

    - **If you use VS Code:**

      1.  Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) by Ritwick Dey.
      2.  Open the `lucha-libre-restaurant` folder in VS Code.
      3.  Right-click on `index.html` in the Explorer panel and select "Open with Live Server", or click the "Go Live" button in the VS Code status bar.
      4.  Your browser will automatically open the site, usually at `http://127.0.0.1:5500`. Changes to your HTML, CSS, or JavaScript files will automatically reload the page.

    - **If you prefer a command-line server (no auto-reload):**
      You can use Python's built-in HTTP server. Ensure you have Python installed.

      On macOS / Linux / WSL / Git Bash:

      ```bash
      python3 -m http.server 8000
      ```

      On Windows (PowerShell / Command Prompt):

      ```powershell
      py -3 -m http.server 8000
      ```

      Then, open your web browser and navigate to `http://localhost:8000`. Note that this server does not automatically reload the page when files change.

---

## Technologies Used

- HTML5 & CSS3 (Bootstrap framework)
- JavaScript (ES6+)
- JSON for menu data
- ARIA for accessibility
- SEO best practices

---

## Accessibility & SEO

This project prioritizes accessibility and SEO with:

- Descriptive alt text for all images
- ARIA labels for interactive and multimedia elements
- Semantic HTML5 structure with proper landmarks
- Keyboard navigable UI components
- SEO-friendly titles, meta descriptions, and heading hierarchy

---

## Cart API (developer notes)

Files:

- `cart.js` — ES module that exports:
  - `createCart()` — factory function that returns an in-memory cart instance with methods:
    - `addItem(item, qty = 1)`
    - `updateQty(id, qty)`
    - `removeItem(id)`
    - `clearCart()`
    - `getItems()`
    - `getTotalQty()`
    - `getSubtotalCents()`
    - `getSubtotal()`
    - `getSummary()`
  - `cart` — default singleton instance (convenience)

Data model:

- Items store price as integer cents (`priceCents`) to avoid floating-point rounding issues.
- Example item: `{ id: 't1', name: 'California Taco', priceCents: 500 }`

Example usage (browser module):

<script type="module">
  import { cart } from './cart.js';

  // add item
  cart.addItem({ id: 't1', name: 'California Taco', priceCents: 500 }, 2);

  // read totals
  const summary = cart.getSummary();
  console.log('Items in cart:', summary.items);
  console.log('Total items:', summary.totalQty);
  console.log('Subtotal ($):', summary.subtotal);
</script>

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Make your changes and commit (`git commit -m 'Add feature'`)
4. Push to your branch (`git push origin feature-name`)
5. Open a Pull Request

Please ensure your code follows accessibility and SEO best practices.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For questions or feedback, please contact:

- Email: contact@luchalibrerestaurant.com
- Website: [www.luchalibrerestaurant.com](http://www.luchalibrerestaurant.com)

---

Thank you for checking out the Lucha Libre Restaurant project! Enjoy the fight for great food and great UX! 🤼‍♂️🌮
