# Vue 3 CesiumJS Starter 🌍

**Vue 3 CesiumJS Starter** is a modern template designed to kickstart your development of interactive 3D applications using Vue 3, CesiumJS, TypeScript, and Tailwind CSS. While this project is particularly well-suited for building geospatial visualizations or immersive 3D experiences, it also includes components specifically designed for drone-related user interfaces (UI). However, these components can be adapted for other use cases as needed.

---

## 🎯 Purpose

This starter template provides a robust foundation for:
- Interactive 3D mapping with CesiumJS
- Clean and responsive UI design with Tailwind CSS
- Type-safe development with TypeScript
- Fast and modern build process using Vite
- Drone-specific UI components, adaptable for other contexts

---

## ✨ Features

- 🌍 **3D Mapping**: Powered by [CesiumJS](https://cesium.com/)
- ⚡ **Fast Development**: Vue 3.5+ with Composition API and Vite
- 🎨 **Styling**: Utility-first CSS with Tailwind V4.1+
- 🛠️ **TypeScript**: Static typing for better maintainability

---

## 🛠️ Tech Stack

| Domain       | Technology           |
|--------------|----------------------|
| Frontend     | Vue 3 (Composition API) |
| Styling      | Tailwind CSS          |
| Mapping      | CesiumJS              |
| Build Tool   | Vite                  |
| Language     | TypeScript            |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **pnpm** (recommended package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/julien-jean-projects/vue3-cesiumjs-starter
   cd vue3-cesiumjs-starter
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure your Cesium Ion token:
   - Visit [Cesium Ion](https://ion.cesium.com/tokens) to generate a token.
   - Add your token to the `.env` file:
     ```env
     VITE_CESIUM_TOKEN=YOUR_CESIUM_TOKEN
     ```

4. Prepare Cesium files:
   ```bash
   pnpm run cesium:preinstall
   ```

5. Start the development server:
   ```bash
   pnpm run dev
   ```

Access the application at [http://localhost:5173](http://localhost:5173).

---

## ⚠️ Important Note

This project uses the Cesium library directly and does not use the `vue-cesium` package due to the lack of documentation.

---

## 📂 Project Structure

- **`src/`**: Application source code
  - **`components/`**: Vue components
  - **`data/`**: Static or mock data
  - **`types/`**: TypeScript definitions
  - **`assets/`**: Images and static resources
- **`public/cesium/`**: Required files for CesiumJS
- **`tailwind.config.css`**: Tailwind CSS configuration

---

## 📚 Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [CesiumJS Documentation](https://cesium.com/learn/cesiumjs/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)

---

## 📬 Contact

For any questions or suggestions, feel free to contact me at: [contact@julienjean.ovh](mailto:contact@julienjean.ovh)

---

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
