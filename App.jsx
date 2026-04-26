import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Income from "./components/Income";
import Expenses from "./components/Expenses";
import Loans from "./components/Loans";
import CreditCards from "./components/CreditCards";
import Investments from "./components/Investments";
import Targets from "./components/Targets";
import { load, save } from "./utils/storage";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");

  useEffect(() => {
    const storedPin = load("pin", null);
    if (!storedPin) {
      save("pin", "1234"); // default
    }
  }, []);

  const verifyPin = () => {
    const stored = load("pin");
    if (pin === stored) setUnlocked(true);
    else alert("Wrong PIN");
  };

  if (!unlocked) {
    return (
      <div style={{ padding: 50 }}>
        <h2>WealthFolio Locked 🔒</h2>
        <input onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" />
        <button onClick={verifyPin}>Unlock</button>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar setTab={setTab} />
      <div style={{ flex: 1 }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "income" && <Income />}
        {tab === "expenses" && <Expenses />}
        {tab === "loans" && <Loans />}
        {tab === "cards" && <CreditCards />}
        {tab === "investments" && <Investments />}
        {tab === "targets" && <Targets />}
      </div>
    </div>
  );
}
