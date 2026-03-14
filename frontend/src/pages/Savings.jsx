import React, { useEffect, useMemo, useState } from "react";

export default function Savings({ totalIncomes = 0, totalExpenses = 0, totalSavings = 0, savingsRate = null, savingsRateColor = "#000" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  const monthlySuggestion = useMemo(() => {
    const t = parseFloat(targetAmount);
    const s = parseFloat(savedAmount) || 0;
    if (!t || !startDate || !targetDate) return "";
    const start = new Date(startDate);
    const end = new Date(targetDate);
    if (isNaN(start) || isNaN(end) || end <= start) return "";
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months <= 0) return "";
    const remaining = Math.max(0, t - s);
    return (remaining / months).toFixed(2);
  }, [targetAmount, savedAmount, startDate, targetDate]);

  function resetForm() {
    setGoalName("");
    setTargetAmount("");
    setSavedAmount("");
    setStartDate("");
    setTargetDate("");
    setNotes("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    const goal = {
      goalName: goalName.trim(),
      targetAmount: parseFloat(targetAmount) || 0,
      savedAmount: parseFloat(savedAmount) || 0,
      startDate: startDate || null,
      targetDate: targetDate || null,
      monthlySuggestion: monthlySuggestion || null,
      notes: notes.trim()
    };
    console.log("Saving goal submitted:", goal);
    setIsModalOpen(false);
    resetForm();
  }

  useEffect(() => {
    if (!isModalOpen) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  return (
    <div>
      <h2>Savings</h2>
      <p>Total Income: ₱{Number(totalIncomes).toFixed(2)}</p>
      <p>Total Expenses: ₱{Number(totalExpenses).toFixed(2)}</p>
      <p>Savings: ₱{Number(totalSavings).toFixed(2)}</p>
      <p style={{ color: savingsRateColor }}>Savings Rate: {savingsRate !== null ? `${Number(savingsRate).toFixed(1)}%` : "N/A"}</p>

      <button onClick={() => setIsModalOpen(true)} style={{ marginTop: 12, padding: "8px 12px" }}>Add Saving Goal</button>

      {isModalOpen && (
        <div role="dialog" aria-modal="true" style={overlayStyle} onClick={() => setIsModalOpen(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3>Add Saving Goal</h3>
            <form onSubmit={handleSubmit}>
              <div style={fieldStyle}>
                <label>Goal Name</label>
                <input value={goalName} onChange={e => setGoalName(e.target.value)} required />
              </div>

              <div style={twoCol}>
                <div style={fieldStyle}>
                  <label>Target Amount</label>
                  <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
                </div>
                <div style={fieldStyle}>
                  <label>Saved Amount</label>
                  <input type="number" step="0.01" value={savedAmount} onChange={e => setSavedAmount(e.target.value)} />
                </div>
              </div>

              <div style={twoCol}>
                <div style={fieldStyle}>
                  <label>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div style={fieldStyle}>
                  <label>Target Date</label>
                  <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                </div>
              </div>

              <div style={fieldStyle}>
                <label>Monthly Contribution Suggestion</label>
                <input value={monthlySuggestion ? `₱${monthlySuggestion}` : ""} readOnly />
              </div>

              <div style={fieldStyle}>
                <label>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" style={{ padding: "6px 12px" }}>Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const modalStyle = {
  background: "#fff",
  padding: 20,
  borderRadius: 6,
  width: "min(520px, 92%)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 10
};

const twoCol = {
  display: "flex",
  gap: 12,
  marginBottom: 8
};
