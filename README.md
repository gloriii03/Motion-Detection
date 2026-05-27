# 🎥 Motion Detection Dashboard

A browser-based **motion detection dashboard** built with **React**, **TypeScript**, and **Vite**.
The app uses the webcam feed and in-browser frame differencing to detect motion, display an active preview, highlight moving regions, and log detection events.

---

## 🚀 Project Summary

This project is a visual motion monitoring system designed for real-time webcam surveillance.
It captures frames from the user camera, compares them frame-to-frame, and identifies motion by measuring pixel changes.
The system exposes live controls for sensitivity, motion threshold, and delay, plus a modern dashboard UI for status and logs.

---

## ✨ Features

* 📹 Live webcam feed with motion overlay
* 🧠 Real-time motion detection using canvas pixel differencing
* 🎛️ Adjustable detection sensitivity, reaction delay, and motion threshold
* 📊 Motion intensity score and FPS display
* 📝 Event activity log with timestamps
* ⌨️ Keyboard shortcuts for start, stop, clear logs, and help
* 🌐 Built as a React + TypeScript + Vite app

---

## 🧩 Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| React | UI components and state management |
| TypeScript | Type-safe development |
| Vite | Fast development server and build tooling |
| Browser Media APIs | Webcam access via `getUserMedia()` |
| HTML5 Canvas | Frame capture and motion analysis |

---

## 📁 Project Structure

```
Motion-Detection/
├── README.md
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── style.css
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── vite-env.d.ts
    ├── hooks/
    │   └── useMotionDetection.ts
    └── components/
        ├── ActivityLog.tsx
        ├── MotionControls.tsx
        ├── MotionStats.tsx
        ├── VideoFeed.tsx
```

---

## 🚀 Installation and Running

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Run development server

```bash
npm run dev
```

### 3️⃣ Open the app

Open the local Vite URL shown in the terminal, usually `http://localhost:5173`.

---

## 🧠 How It Works

The motion detection algorithm in `src/hooks/useMotionDetection.ts` follows these steps:

1. Request webcam access with `navigator.mediaDevices.getUserMedia()`.
2. Render video frames into a hidden canvas.
3. Compare current frame pixel data to the previous frame.
4. Measure RGB pixel differences and accumulate changed pixels.
5. Use a grid-based filter to reduce noise and compute a bounding region.
6. Trigger motion when the changed area exceeds the configured threshold.
7. Log motion events and display a motion highlight overlay.

---

## 🧩 Key Components

* `src/App.tsx` — Main dashboard and state manager
* `src/hooks/useMotionDetection.ts` — Motion detection loop and webcam control
* `src/components/VideoFeed.tsx` — Video display and motion highlight overlay
* `src/components/MotionStats.tsx` — Motion status, FPS, and intensity controls
* `src/components/MotionControls.tsx` — Start/stop buttons and slider controls
* `src/components/ActivityLog.tsx` — Event log panel

---

## 📌 Available Scripts

* `npm run dev` — Start Vite dev server
* `npm run build` — Build production bundle
* `npm run preview` — Preview production build locally
* `npm run deploy` — Deploy site using `gh-pages`

---

## 💡 Notes

The current repository content is a React/Vite web application, not the Python/OpenCV implementation described previously.
This README has been updated to reflect the actual web-based motion detection dashboard.

