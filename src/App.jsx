import React, { useState } from "react";

// -------- LRU --------
function simulateLRU(pages, capacity) {
  let frames = [];
  let faults = 0;
  let steps = [];
  pages.forEach((page, i) => {
    let hit = frames.includes(page);
    if (!hit) {
      if (frames.length < capacity) {
        frames = [...frames, page];
      } else {
        let lruIndex = 0, min = Infinity;
        frames.forEach((f, idx) => {
          let lastUsed = pages.slice(0, i).lastIndexOf(f);
          if (lastUsed < min) { min = lastUsed; lruIndex = idx; }
        });
        frames = frames.map((f, idx) => idx === lruIndex ? page : f);
      }
      faults++;
    }
    steps.push({ page, frames: [...frames], fault: !hit });
  });
  return { faults, steps };
}

// -------- OPTIMAL --------
function simulateOptimal(pages, capacity) {
  let frames = [];
  let faults = 0;
  let steps = [];
  pages.forEach((page, i) => {
    let hit = frames.includes(page);
    if (!hit) {
      if (frames.length < capacity) {
        frames = [...frames, page];
      } else {
        let farthest = -1, index = -1;
        frames.forEach((f, idx) => {
          let nextUse = pages.slice(i + 1).indexOf(f);
          if (nextUse === -1) { index = idx; }
          else if (nextUse > farthest) { farthest = nextUse; index = idx; }
        });
        frames = frames.map((f, idx) => idx === index ? page : f);
      }
      faults++;
    }
    steps.push({ page, frames: [...frames], fault: !hit });
  });
  return { faults, steps };
}
// -------- SEGMENTATION --------
function simulateSegmentation(segments, logicalAddress) {
  // segments: [{id, base, limit}, ...]
  // logicalAddress: {segment, offset}
  const segment = segments.find(s => s.id === logicalAddress.segment);
  if (!segment) return { error: "Segment not found" };
  if (logicalAddress.offset >= segment.limit) return { error: "Offset exceeds segment limit" };
  const physicalAddress = segment.base + logicalAddress.offset;
  return { physicalAddress, segment };
}
// -------- DEMAND PAGING --------
function simulateDemandPaging(pages, capacity, pageTable) {
  let frames = [];
  let faults = 0;
  let steps = [];
  let framePointer = 0;
  pages.forEach((page, i) => {
    let hit = frames.includes(page);
    if (!hit) {
      if (frames.length < capacity) {
        frames.push(page);
      } else {
        frames[framePointer] = page;
        framePointer = (framePointer + 1) % capacity;
      }
      faults++;
      // Update page table
      pageTable[page] = { frame: frames.indexOf(page), valid: true };
    }
    steps.push({ page, frames: [...frames], fault: !hit, pageTable: { ...pageTable } });
  });
  return { faults, steps, finalPageTable: pageTable };
}
// -------- MEMORY FRAGMENTATION --------
function simulateFragmentation(allocations, totalMemory) {
  // allocations: [{size, allocated: boolean}, ...]
  let memory = Array(totalMemory).fill(false); // false = free, true = allocated
  let steps = [];
  allocations.forEach((alloc, i) => {
    if (alloc.allocated) {
      // Allocate
      let start = memory.indexOf(false);
      if (start === -1 || start + alloc.size > totalMemory) {
        steps.push({ step: i, action: "allocate", size: alloc.size, success: false, memory: [...memory] });
        return;
      }
      for (let j = 0; j < alloc.size; j++) {
        memory[start + j] = true;
      }
      steps.push({ step: i, action: "allocate", size: alloc.size, start, success: true, memory: [...memory] });
    } else {
      // Deallocate - find first block of this size
      let start = -1;
      for (let j = 0; j <= totalMemory - alloc.size; j++) {
        if (memory.slice(j, j + alloc.size).every(cell => cell)) {
          start = j;
          break;
        }
      }
      if (start !== -1) {
        for (let j = 0; j < alloc.size; j++) {
          memory[start + j] = false;
        }
      }
      steps.push({ step: i, action: "deallocate", size: alloc.size, start, success: start !== -1, memory: [...memory] });
    }
  });
    // Calculate fragmentation
  let freeBlocks = [];
  let current = 0;
  while (current < totalMemory) {
    if (!memory[current]) {
      let size = 0;
      while (current + size < totalMemory && !memory[current + size]) size++;
      freeBlocks.push(size);
      current += size;
    } else {
      current++;
    }
  }
  const totalFree = freeBlocks.reduce((a, b) => a + b, 0);
  const largestFree = Math.max(...freeBlocks, 0);
  const fragmentation = totalFree - largestFree;
  return { steps, fragmentation, totalFree, largestFree };
}

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .vms-root {
    min-height: 100vh;
    background: #0a0a0f;
    color: #e8e8f0;
    font-family: 'Syne', sans-serif;
    padding: 40px 24px;
    position: relative;
    overflow-x: hidden;
  }

  .vms-root::before {
    content: '';
    position: fixed;
    top: -40%; left: -20%;
    width: 70%; height: 70%;
    background: radial-gradient(ellipse, rgba(99,60,255,0.18) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .vms-root::after {
    content: '';
    position: fixed;
    bottom: -30%; right: -10%;
    width: 60%; height: 60%;
    background: radial-gradient(ellipse, rgba(0,210,180,0.10) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .vms-container { max-width: 900px; margin: 0 auto; position: relative; z-index: 1; }

  .vms-header { text-align: center; margin-bottom: 48px; }

  .vms-eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.3em;
    color: #00d2b4;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .vms-title {
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.05;
    background: linear-gradient(135deg, #ffffff 0%, #a59dff 50%, #00d2b4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .vms-subtitle {
    margin-top: 10px;
    font-size: 14px;
    color: rgba(232,232,240,0.45);
    font-weight: 400;
  }

  .vms-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 32px;
    backdrop-filter: blur(12px);
    margin-bottom: 24px;
  }

  .vms-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: rgba(232,232,240,0.4);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .vms-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 14px 18px;
    color: #e8e8f0;
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    width: 100%;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
    margin-bottom: 20px;
  }

  .vms-input:focus {
    border-color: rgba(99,60,255,0.6);
    background: rgba(99,60,255,0.08);
  }

  .vms-input::placeholder { color: rgba(232,232,240,0.2); }

  .vms-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .vms-capacity-wrap { display: flex; align-items: center; gap: 12px; }

  .vms-capacity-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: #e8e8f0;
    font-size: 18px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s;
  }

  .vms-capacity-btn:hover {
    background: rgba(99,60,255,0.2);
    border-color: rgba(99,60,255,0.5);
  }

  .vms-capacity-val {
    font-family: 'Space Mono', monospace;
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    min-width: 36px;
    text-align: center;
  }

  .vms-run-btn {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #6330ff, #00d2b4);
    color: white;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }

  .vms-run-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .vms-run-btn:active { transform: translateY(0); }

  .vms-results-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .vms-stat {
    border-radius: 14px;
    padding: 24px;
    text-align: center;
  }

  .vms-stat-lru {
    background: linear-gradient(135deg, rgba(99,60,255,0.25), rgba(99,60,255,0.08));
    border: 1px solid rgba(99,60,255,0.3);
  }

  .vms-stat-opt {
    background: linear-gradient(135deg, rgba(0,210,180,0.2), rgba(0,210,180,0.06));
    border: 1px solid rgba(0,210,180,0.3);
  }

  .vms-stat-algo {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 8px;
    opacity: 0.6;
  }

  .vms-stat-num {
    font-size: 52px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .vms-stat-lru .vms-stat-num { color: #a59dff; }
  .vms-stat-opt .vms-stat-num { color: #00d2b4; }
  .vms-stat-label { font-size: 12px; opacity: 0.5; margin-top: 4px; }

  .vms-chart-title {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: rgba(232,232,240,0.4);
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .vms-bars {
    display: flex;
    gap: 24px;
    align-items: flex-end;
    height: 160px;
    padding: 0 16px;
  }

  .vms-bar-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    height: 100%;
    justify-content: flex-end;
  }

  .vms-bar-inner {
    width: 100%;
    border-radius: 8px 8px 0 0;
    transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .vms-bar-lru { background: linear-gradient(180deg, #8066ff, #6330ff); }
  .vms-bar-opt { background: linear-gradient(180deg, #00d2b4, #00a88f); }

  .vms-bar-pct { font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(232,232,240,0.5); }

  .vms-bar-name {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .vms-efficiency {
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(0,210,180,0.08);
    border: 1px solid rgba(0,210,180,0.2);
    font-size: 13px;
    color: rgba(232,232,240,0.7);
    text-align: center;
  }

  .vms-efficiency span { color: #00d2b4; font-weight: 700; }

  .vms-tabs { display: flex; gap: 8px; margin-bottom: 16px; }

  .vms-tab {
    padding: 8px 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: rgba(232,232,240,0.45);
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }

  .vms-tab.active {
    background: rgba(99,60,255,0.2);
    border-color: rgba(99,60,255,0.5);
    color: #c0b8ff;
  }

  .vms-table-wrap {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.07);
  }

  .vms-table { width: 100%; border-collapse: collapse; font-family: 'Space Mono', monospace; font-size: 12px; }

  .vms-table th {
    padding: 10px 14px;
    text-align: center;
    background: rgba(255,255,255,0.04);
    color: rgba(232,232,240,0.45);
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }

  .vms-table td {
    padding: 8px 14px;
    text-align: center;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .vms-table tr:last-child td { border-bottom: none; }

  .vms-fault-yes {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(255,80,80,0.2);
    border: 1px solid rgba(255,80,80,0.35);
    color: #ff9090;
    font-size: 9px;
    letter-spacing: 0.15em;
  }

  .vms-fault-no {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(0,210,180,0.12);
    border: 1px solid rgba(0,210,180,0.25);
    color: #00d2b4;
    font-size: 9px;
    letter-spacing: 0.15em;
  }

  .vms-frame-cell { display: inline-flex; gap: 4px; justify-content: center; }

  .vms-frame-tag {
    background: rgba(99,60,255,0.2);
    border: 1px solid rgba(99,60,255,0.3);
    border-radius: 4px;
    padding: 1px 7px;
    color: #c0b8ff;
  }

  @media (max-width: 580px) {
    .vms-results-grid, .vms-row { grid-template-columns: 1fr; }
     .vms-bars { gap: 16px; }
    .vms-bar-wrap { flex: 1; min-width: 60px; }
  }
`;

export default function App() {
  const [input, setInput] = useState("7,0,1,2,0,3,0,4,2,3,0,3,2");
  const [capacity, setCapacity] = useState(3);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("lru");
  const [animated, setAnimated] = useState(false);
   // Segmentation state
  const [segments, setSegments] = useState([
    { id: 0, base: 1000, limit: 500 },
    { id: 1, base: 2000, limit: 300 },
    { id: 2, base: 3000, limit: 800 }
  ]);
  const [logicalAddr, setLogicalAddr] = useState({ segment: 0, offset: 100 });
  const [segResult, setSegResult] = useState(null);
  // Demand paging state
  const [pageTable, setPageTable] = useState({});
  const [demandResult, setDemandResult] = useState(null);
  // Fragmentation state
  const [totalMemory, setTotalMemory] = useState(100);
  const [fragInput, setFragInput] = useState("50,30,-30,20,-50,40");
  const [fragResult, setFragResult] = useState(null);
  const runSimulation = () => {
    const pages = input.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!pages.length) return;
    setAnimated(false);
    setTimeout(() => {
      setResults({
        lru: simulateLRU(pages, capacity),
        optimal: simulateOptimal(pages, capacity),
      });
      setAnimated(true);
    }, 50);
  };

  const maxFaults = results ? Math.max(results.lru.faults, results.optimal.faults) : 1;
  const lruPct = results ? Math.round((results.lru.faults / maxFaults) * 100) : 0;
  const optPct = results ? Math.round((results.optimal.faults / maxFaults) * 100) : 0;
  const savings = results ? results.lru.faults - results.optimal.faults : 0;
  const activeSteps = results ? (activeTab === "lru" ? results.lru.steps : results.optimal.steps) : [];

  return (
    <>
      <style>{style}</style>
      <div className="vms-root">
        <div className="vms-container">

          <header className="vms-header">
            <div className="vms-eyebrow">OS Memory Management</div>
            <h1 className="vms-title">Virtual Memory<br />Simulator</h1>
            <p className="vms-subtitle">Compare LRU vs Optimal page replacement algorithms</p>
          </header>

          <div className="vms-card">
            <div className="vms-label">Page Reference String</div>
            <input
              className="vms-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. 7,0,1,2,0,3,0,4"
            />
            <div className="vms-row">
              <div>
                <div className="vms-label">Frame Capacity</div>
                <div className="vms-capacity-wrap">
                  <button className="vms-capacity-btn" onClick={() => setCapacity(c => Math.max(1, c - 1))}>−</button>
                  <span className="vms-capacity-val">{capacity}</span>
                  <button className="vms-capacity-btn" onClick={() => setCapacity(c => Math.min(10, c + 1))}>+</button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button className="vms-run-btn" onClick={runSimulation}>▶ Run Simulation</button>
              </div>
            </div>
          </div>

          {results && (
            <>
              <div className="vms-results-grid">
                <div className="vms-stat vms-stat-lru">
                  <div className="vms-stat-algo">LRU Algorithm</div>
                  <div className="vms-stat-num">{results.lru.faults}</div>
                  <div className="vms-stat-label">page faults</div>
                </div>
                <div className="vms-stat vms-stat-opt">
                  <div className="vms-stat-algo">Optimal Algorithm</div>
                  <div className="vms-stat-num">{results.optimal.faults}</div>
                  <div className="vms-stat-label">page faults</div>
                </div>
              </div>

              <div className="vms-card">
                <div className="vms-chart-title">Fault Comparison</div>
                <div className="vms-bars">
                  <div className="vms-bar-wrap">
                    <span className="vms-bar-pct">{results.lru.faults}</span>
                    <div className="vms-bar-inner vms-bar-lru" style={{ height: animated ? `${lruPct}%` : "0%" }} />
                    <span className="vms-bar-name" style={{ color: "#a59dff" }}>LRU</span>
                  </div>
                  <div className="vms-bar-wrap">
                    <span className="vms-bar-pct">{results.optimal.faults}</span>
                    <div className="vms-bar-inner vms-bar-opt" style={{ height: animated ? `${optPct}%` : "0%" }} />
                    <span className="vms-bar-name" style={{ color: "#00d2b4" }}>Optimal</span>
                  </div>
                </div>
                <div className="vms-efficiency">
                  {savings > 0
                    ? <>Optimal saves <span>{savings} fault{savings !== 1 ? "s" : ""}</span> ({Math.round((savings / results.lru.faults) * 100)}% fewer) over LRU</>
                    : <>Both algorithms perform <span>identically</span> on this reference string</>
                  }
                </div>
              </div>

              <div className="vms-card">
                <div className="vms-tabs">
                  <button className={`vms-tab ${activeTab === "lru" ? "active" : ""}`} onClick={() => setActiveTab("lru")}>LRU Steps</button>
                  <button className={`vms-tab ${activeTab === "opt" ? "active" : ""}`} onClick={() => setActiveTab("opt")}>Optimal Steps</button>
                </div>
                <div className="vms-table-wrap">
                  <table className="vms-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Page</th><th>Frames</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSteps.map((step, i) => (
                        <tr key={i} style={{ background: step.fault ? "rgba(255,80,80,0.04)" : "transparent" }}>
                          <td style={{ opacity: 0.4 }}>{i + 1}</td>
                          <td style={{ fontWeight: 700, color: "#fff" }}>{step.page}</td>
                          <td>
                            <span className="vms-frame-cell">
                              {step.frames.map((f, j) => <span key={j} className="vms-frame-tag">{f}</span>)}
                            </span>
                          </td>
                          <td>
                            {step.fault
                              ? <span className="vms-fault-yes">FAULT</span>
                              : <span className="vms-fault-no">HIT</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
