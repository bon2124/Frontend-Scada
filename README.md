# Solar Power Monitoring and Control Dashboard# React + TypeScript + Vite



A modern, responsive React-based dashboard for monitoring solar power plant performance in real-time.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🌟 FeaturesCurrently, two official plugins are available:



### ⚡ Power Overview & Monitoring- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- **Real-time Power Display** with gauge visualization- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **Grid Frequency Monitoring** (49-51 Hz range)

- **Status Indicators** (Active, Warning, Fault)## React Compiler

- **3-Phase Grid Support**

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

### 🔌 Grid Status Monitoring

- **Individual Phase Monitoring** (U1, U2, U3 and I1, I2, I3)Note: This will impact Vite dev & build performances.

- **Voltage & Current Gauges** for each phase

- **Phase Balance Detection**## Expanding the ESLint configuration

- **Power Calculation** per phase

- **Color-coded Threshold Warnings**If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



### 📊 Power History Charts```js

- **Multiple Chart Types:** Line, Bar, and Area chartsexport default defineConfig([

- **Time Period Selection:** Today, 7 Days, 30 Days  globalIgnores(['dist']),

- **Real-time Statistics:** Peak, Average, Minimum Power, Total Energy  {

- **Multi-metric Display:** Power, Voltage, and Current trends    files: ['**/*.{ts,tsx}'],

    extends: [

### 🎨 User Interface      // Other configs...

- **Sidebar Navigation** with collapsible menu

- **Responsive Design** for desktop, tablet, and mobile      // Remove tseslint.configs.recommended and replace with this

- **Bootstrap 5** UI components      tseslint.configs.recommendedTypeChecked,

- **Bootstrap Icons** for visual elements      // Alternatively, use this for stricter rules

- **Real-time Data Updates** every 3 seconds      tseslint.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

## 🛠️ Technologies Used      tseslint.configs.stylisticTypeChecked,



- **React 19** with TypeScript      // Other configs...

- **Vite** - Build tool    ],

- **React Router DOM** - Navigation    languageOptions: {

- **Bootstrap 5** - UI Framework      parserOptions: {

- **Bootstrap Icons** - Icon library        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **Recharts** - Chart library        tsconfigRootDir: import.meta.dirname,

- **Axios** - HTTP client (ready for API integration)      },

- **Sass** - CSS preprocessor      // other options...

    },

## 📦 Installation  },

])

1. Clone the repository:```

```bash

git clone <repository-url>You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

cd solar-plant-react-app

``````js

// eslint.config.js

2. Install dependencies:import reactX from 'eslint-plugin-react-x'

```bashimport reactDom from 'eslint-plugin-react-dom'

npm install

```export default defineConfig([

  globalIgnores(['dist']),

3. Start the development server:  {

```bash    files: ['**/*.{ts,tsx}'],

npm run dev    extends: [

```      // Other configs...

      // Enable lint rules for React

4. Open your browser and navigate to:      reactX.configs['recommended-typescript'],

```      // Enable lint rules for React DOM

http://localhost:5173      reactDom.configs.recommended,

```    ],

    languageOptions: {

## 📁 Project Structure      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

```        tsconfigRootDir: import.meta.dirname,

solar-plant-react-app/      },

├── src/      // other options...

│   ├── components/    },

│   │   ├── Layout.tsx              # Main layout with sidebar  },

│   │   ├── GaugeChart.tsx          # Custom gauge component])

│   │   ├── PowerOverview.tsx       # Power & frequency display```

│   │   ├── GridStatus.tsx          # 3-phase grid monitoring
│   │   └── PowerHistoryChart.tsx   # Historical data charts
│   ├── pages/
│   │   └── Overview.tsx            # Main dashboard page
│   ├── App.tsx                     # Router configuration
│   ├── App.css                     # Custom styles
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles
├── public/                         # Static assets
├── MOCK_DATA.md                    # Mock data documentation
└── README.md                       # This file
```

## 🎯 Current Status

**Demo Mode**: The dashboard currently uses **mock/fake data** to demonstrate the full UI functionality. All data is generated client-side with realistic patterns simulating solar power generation.

See [MOCK_DATA.md](./MOCK_DATA.md) for detailed information about the data structure and generation logic.

## 🔄 Real-time Data Simulation

The dashboard simulates real-time updates:
- Power values fluctuate ±500W every 3 seconds
- Frequency varies within safe range (49.75-50.25 Hz)
- Phase voltages and currents show realistic variations
- Solar pattern follows sunrise-noon-sunset curve

## 📊 Data Visualization

### Gauge Charts
- Total Power (0-60 kW range)
- Grid Frequency (49-51 Hz range)
- Phase Voltages (200-250 V range)
- Phase Currents (0-100 A range)

### Line/Bar/Area Charts
- Power history over time
- Voltage trends
- Current consumption
- Switchable chart types

## 🎨 Color-Coded Thresholds

- 🟢 **Green (Success)**: Normal operation
- 🟡 **Yellow (Warning)**: Approaching threshold
- 🔴 **Red (Danger)**: Threshold exceeded or fault

## 🚀 Future Enhancements

- [ ] Connect to real solar plant API
- [ ] Add WebSocket for true real-time updates
- [ ] Implement Environment monitoring section
- [ ] Implement Inverter monitoring section
- [ ] Add alarm/notification system
- [ ] Export data to CSV/PDF
- [ ] User authentication and roles
- [ ] Historical data comparison
- [ ] Mobile app version

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- 💻 Desktop (1920x1080 and above)
- 💻 Laptop (1366x768 and above)
- 📱 Tablet (768px and above)
- 📱 Mobile (320px and above)

## 🔧 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📝 License

MIT License - Feel free to use this project for learning and development.

## 👨‍💻 Development

This project is currently in development mode with mock data. The architecture is designed to easily integrate with real APIs by replacing the mock data generation functions with actual API calls using Axios.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Note**: This dashboard uses fake data for demonstration purposes. Integration with real solar plant monitoring systems requires backend API development and proper hardware interfacing.
