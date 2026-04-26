import { useState } from "react";
import { load, save } from "../utils/storage";

export default function Targets() {
  const [target, setTarget] = useState(load("targets", []));

  const addTarget = () => {
    const t = {
      name: "New Target",
      goal: 10000000,
      saved: 0,
      start: new Date().toISOString()
    };
    const updated = [...target, t];
    setTarget(updated);
    save("targets", updated);
  };

  return (
    <div className="card">
      <h2>Targets</h2>
      <button onClick={addTarget}>Add Target</button>

      {target.map((t, i) => (
        <div key={i}>
          <p>{t.name}</p>
          <p>{t.saved} / {t.goal}</p>
        </div>
      ))}
    </div>
  );
}
