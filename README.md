🧠 Virtual Memory Management Simulator


An interactive web-based simulator that visualizes key Operating System memory management concepts — including paging, page faults, and page replacement algorithms — with step-by-step execution and graphical performance comparison.


📸 Preview

Run the app locally and open http://localhost:5173 to see the simulator in action.


🎯 Features


```
  Features               Description
🔹 Paging Simulation      Frame allocation with configurable frame count
⚠️ Page Fault Detection   Tracks and highlights every page fault in the trace
🔁LRU AlgorithmLeast      Recently Used page replacement
🔮 Optimal Algorithm      Theoretical best-case replacement (benchmark)
📦 FIFO Algorithm         First In, First Out replacement
📊 Step-by-Step Table     Color-coded execution trace per reference
📈 Algorithm Comparison   Side-by-side fault count visualization
📉 Performance Analysis   Hit rate, fault count, and hit count metrics   
```

⚙️ Technologies Used

```
React.js

JavaScript

HTML & CSS

Vite
```
🚀 Getting Started
Prerequisites

Node.js v16 or higher
npm v7 or higher
Installation & Run
```
# Clone the repository
git clone https://github.com/niharikaprasad1906/virtual-memory-simulator)

# Navigate into the project
cd virtual-memory-simulator

# Install dependencies
npm install

# Start the development server
npm run dev
```
Then open your browser and visit:
http://localhost:5173

📊 Example Input
```
Reference String: 7,0,1,2,0,3,0,4,2,3,0,3,2

Frames: 3
Expected Output
Algorithm   Page Faults
LRU           8
Optimal       7
```


🧠 Concepts Covered

Paging

Memory is divided into fixed-size blocks called pages (logical) and frames (physical). The OS maps pages to frames and tracks them via a page table.


Page Faults

A page fault occurs when a referenced page is not currently in any frame. The OS must load it from secondary storage, potentially evicting an existing page.


Demand Paging

Pages are loaded into memory only when accessed, reducing unnecessary memory usage.
___________________________________________________________________________________________________________________________________________________________________
📈 Output


After running the simulator, you'll see:

✅ Total page faults for each algorithm


🗂️ Step-by-step memory state — color-coded fault vs. hit per reference


📊 Comparison bar chart — visualizes fault counts across LRU, Optimal


📉 Hit rate percentage — proportion of accesses that did not cause a fault
___________________________________________________________________________________________________________________________________________________________________

## 📁 Project Structure

```
virtual-memory-simulator/
│
├── public/
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
│
└── README.md
```
