# 🎓 StudentOS — Phase 1

A beautifully designed, iOS-optimized mobile app built with **React Native Expo** and **TypeScript**. StudentOS helps students manage their handwritten notes and track expenses — all stored locally on-device.

---

## ✨ Features

### 📝 Notes with Canvas Drawing
- **Freehand drawing** with pen, highlighter, and eraser tools
- **3 pen colors** with instant switching
- **Undo / Redo** support for drawing strokes
- **Text notes** alongside drawings
- **Color-coded** note cards (8 colors)
- **Favorites** for quick access
- **PDF export** with share sheet integration

### 💰 Finance Tracker
- Log expenses by **8 categories** (Food, Transport, Books, Entertainment, Utilities, Clothing, Health, Other)
- **Monthly bar charts** showing spending trends
- **Category pie chart** with donut visualization
- **Month navigation** (swipe through months)
- **Multi-currency** support (USD, EUR, GBP, INR, JPY)
- **Long-press to delete** transactions

### ⚙️ Settings
- **Dark mode** (follows system appearance)
- **Currency selection**
- **Haptic feedback** toggle
- **Data export & clear** options

### 🔧 Technical
- **SQLite** local database for all data
- **Zustand** state management
- **File system** storage for drawings
- **PDF generation** via `expo-print`
- **iOS-native** bottom tab navigation

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ installed
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Simulator** (Xcode) or **Expo Go** app on your iPhone

### Installation

```bash
# Clone or navigate to the project
cd student-os-apple

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

1. **iOS Simulator**: Press `i` in the terminal after `npx expo start`
2. **Physical iPhone**: Scan the QR code with the Expo Go app
3. **Android Emulator**: Press `a` in the terminal (also supported)

---

## 📁 Project Structure

```
student-os-apple/
├── App.tsx                          # Entry point — DB init & navigation
├── package.json                     # Dependencies & scripts
├── app.json                         # Expo configuration
├── tsconfig.json                    # TypeScript config
├── babel.config.js                  # Babel + Reanimated plugin
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx         # Bottom tabs + Notes stack
    ├── screens/
    │   ├── NotesListScreen.tsx      # Notes grid with favorites & search
    │   ├── NoteEditorScreen.tsx     # Drawing canvas + text editor
    │   ├── FinanceScreen.tsx        # Expense list, charts, monthly view
    │   └── SettingsScreen.tsx       # App preferences & data management
    ├── components/
    │   ├── DrawingCanvas.tsx        # PanResponder-based drawing canvas
    │   ├── ExpenseChart.tsx         # Bar + Pie charts (gifted-charts)
    │   ├── ExpenseForm.tsx          # Modal form for adding expenses
    │   └── NoteCard.tsx             # Note list item with accent color
    ├── services/
    │   ├── database.ts              # SQLite CRUD operations
    │   └── storage.ts               # File system + PDF export
    ├── store/
    │   ├── notesStore.ts            # Zustand store for notes
    │   └── financeStore.ts          # Zustand store for expenses
    ├── types/
    │   └── index.ts                 # TypeScript type definitions
    └── utils/
        └── constants.ts             # Colors, categories, config
```

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 52** | Development toolchain & native APIs |
| **TypeScript** | Type-safe development |
| **expo-sqlite** | Local SQLite database |
| **Zustand** | Lightweight state management |
| **react-native-gifted-charts** | Bar & pie chart visualizations |
| **expo-print** | PDF generation |
| **expo-sharing** | Native share sheet |
| **expo-file-system** | Local file storage |
| **@expo/vector-icons** | Ionicons icon set |

---

## 📱 Screenshots

The app features:
- **Light & Dark mode** with automatic system detection
- **iOS-native** tab bar with SF-style icons
- **Smooth animations** and haptic feedback
- **Clean, modern UI** with card-based layouts

---

## 🔮 Phase 2 Roadmap

- [ ] Timetable / Schedule planner
- [ ] Study timer (Pomodoro)
- [ ] Grade calculator & GPA tracker
- [ ] Cloud sync with user accounts
- [ ] Collaboration & note sharing
- [ ] AI-powered study suggestions

---

## 📄 License

MIT License — Built for students, by students. 🎓
