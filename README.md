# 🎥 Motion Detection System

An intelligent and lightweight **Motion Detection System** built using Python and OpenCV.
This project detects real-time motion through a webcam and highlights moving objects with bounding boxes.

---

## 🚀 How it Works

```
📷 Camera Input → 🎞️ Frame Processing → 🔍 Motion Detection → 📦 Object Highlight
```

---

## ✨ Features

* 📸 Real-time webcam feed
* 🧠 Motion detection using frame differencing
* 📦 Bounding box around moving objects
* ⚡ Lightweight & fast processing
* 🛠️ Easy to run and modify

---

## 🧩 Tech Stack

| Technology | Usage            |
| ---------- | ---------------- |
| Python 🐍  | Core programming |
| OpenCV 👁️ | Image processing |
| NumPy 🔢   | Array operations |

---

## 📂 Project Structure

```
Motion-Detection/
│── main.py
│── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/gloriii03/Motion-Detection.git
cd Motion-Detection
```

### 2️⃣ Install Dependencies

```bash
pip install opencv-python numpy
```

### 3️⃣ Run the Project

```bash
python main.py
```

---

## 🎯 How It Works

<details>
<summary>👉 Click to Expand Explanation</summary>

1. Capture video using webcam
2. Convert frames to grayscale
3. Apply Gaussian blur to reduce noise
4. Compute difference between frames
5. Apply threshold to highlight motion
6. Detect contours
7. Draw rectangles around moving objects

</details>

---

## 📸 Output Preview

> Motion is detected and highlighted in real-time.

---

## 🔥 Future Improvements

* 🎥 Record video when motion detected
* 🔔 Add alert system (sound/email)
* 🌐 Create web dashboard (HTML + JS)
* 🤖 Integrate AI object detection

