"use client";

import { useEffect, useState } from "react";
import { Storage } from "@/lib/storage";
import { runMonthlyEngine } from "@/lib/engine";

export default function Dashboard() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    runMonthlyEngine();
    setData({
      income: Storage.get("income"),
      expenses: Storage.get("expenses"),
      loans: Storage.get("loans"),
      cards: Storage.get("cards"),
      investments: Storage.get("investments"),
      targets: Storage.get("targets"),
    });
  }, []);

  return (
    <div className="p-6 grid gap-6">
      <h1 className="text-2xl font-bold">WealthFolio Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-xl">
          Total Income: {data?.income?.length || 0}
        </div>
        <div className="bg-gray-800 p-4 rounded-xl">
          Expenses: {data?.expenses?.length || 0}
        </div>
        <div className="bg-gray-800 p-4 rounded-xl">
          Loans Active: {data?.loans?.length || 0}
        </div>
      </div>
    </div>
  );
}
