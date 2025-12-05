# FinBoard - Customizable Finance Dashboard

A powerful, customizable finance dashboard built with Next.js that allows users to build their own real-time finance monitoring dashboard by connecting to various financial APIs and displaying real-time data through customizable widgets.

![FinBoard Dashboard Deployed](https://fin-board-mu.vercel.app/)

## 🚀 Features

### Widget Management System
- **Add Widgets**: Create new finance data widgets by connecting to any financial API
- **Widget Types**: 
  - **Card View**: Display key metrics as finance cards
  - **Table View**: Paginated list/grid with search and sorting
  - **Chart View**: Line, Area, and Bar charts for data visualization
- **Remove Widgets**: Easy deletion of unwanted widgets
- **Drag-and-Drop**: Reorganize widget positions on the dashboard
- **Widget Configuration**: Each widget has a customizable configuration panel

### API Integration & Data Handling
- **Dynamic Data Mapping**: Explore API responses and select specific fields to display
- **Real-time Updates**: Automatic data refresh with configurable intervals
- **API Proxy**: Built-in proxy to handle CORS issues
- **Error Handling**: Comprehensive handling of loading, error, and empty states

### User Interface & Experience
- **Dark/Light Theme**: Toggle between themes seamlessly
- **Responsive Design**: Fully responsive layout for all screen sizes
- **Modern UI**: Beautiful, intuitive interface with smooth animations

### Data Persistence
- **LocalStorage Integration**: Widget configurations persist across sessions
- **State Recovery**: Complete dashboard restoration on page refresh
- **Export/Import**: Backup and restore dashboard configurations as JSON

## 🛠️ Technologies

- **Frontend Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand with localStorage persistence
- **Data Visualization**: Recharts
- **Drag-and-Drop**: React Grid Layout
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/TechWizard9999/FinBoard.git
cd FinBoard
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Usage

### Adding a Widget

1. Click the **"+ Add Widget"** button in the header
2. Enter a widget name (e.g., "Bitcoin Price Tracker")
3. Paste an API URL (e.g., `https://api.coinbase.com/v2/exchange-rates?currency=BTC`)
4. Click **"Test"** to verify the API connection
5. Select the fields you want to display
6. Choose a display mode (Card, Table, or Chart)
7. Set the refresh interval
8. Click **"Add Widget"**

### Example APIs

- **Coinbase Exchange Rates**: `https://api.coinbase.com/v2/exchange-rates?currency=BTC`
- **CoinGecko Bitcoin**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur`
- **CoinGecko Markets**: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10`
- **JSONPlaceholder (Test)**: `https://jsonplaceholder.typicode.com/users`

### Managing Widgets

- **Drag**: Use the grip handle (⋮⋮) to drag and reposition widgets
- **Resize**: Drag widget edges to resize
- **Refresh**: Click the refresh icon to manually update data
- **Edit**: Click the settings icon to modify widget configuration
- **Delete**: Click the trash icon to remove a widget

### Theme Toggle

Click the sun/moon icon in the header to switch between dark and light themes.

### Export/Import Configuration

- **Export**: Click the download icon to save your dashboard configuration
- **Import**: Click the upload icon to restore a saved configuration

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── proxy/
│   │       └── route.ts      # API proxy for CORS handling
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page component
├── components/
│   ├── widgets/
│   │   ├── AddWidgetCard.tsx # Add widget placeholder
│   │   ├── WidgetCard.tsx    # Main widget component
│   │   ├── WidgetChart.tsx   # Chart visualization
│   │   └── WidgetTable.tsx   # Table view component
│   ├── AddWidgetModal.tsx    # Widget creation modal
│   ├── Dashboard.tsx         # Dashboard container
│   ├── EmptyState.tsx        # Empty dashboard state
│   ├── Header.tsx            # Header with actions
│   ├── ResponsiveDashboard.tsx # Responsive grid layout
│   └── ThemeProvider.tsx     # Theme context provider
├── store/
│   └── dashboardStore.ts     # Zustand store
├── types/
│   └── index.ts              # TypeScript types
└── utils/
    └── apiUtils.ts           # API utility functions
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for any API keys you need:

```env
NEXT_PUBLIC_API_KEY=your_api_key_here
```

### Customizing Themes

Edit the CSS variables in `src/app/globals.css`:

```css
:root {
  --background: #0f172a;
  --foreground: #e2e8f0;
  --primary: #10b981;
}

.light {
  --background: #f8fafc;
  --foreground: #0f172a;
  --primary: #10b981;
}
```

## 📝 API Integration Guidelines

When integrating financial APIs:

1. **Use reliable APIs**: CoinGecko, Alpha Vantage, Coinbase, Finnhub, etc.
2. **Handle rate limits**: Configure appropriate refresh intervals
3. **Cache responses**: The proxy helps reduce redundant requests
4. **Manage errors gracefully**: Display user-friendly error messages

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Upload the .next folder to Netlify
```

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for the FinBoard Frontend Assignment
