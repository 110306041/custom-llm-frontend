import React, { useState } from "react";

const PRODUCT_TABLES = {
  intro: [
    {
      name: "Franklin Templeton Sinoam Money Market Fund",
      rr: "RR1",
      rate: "3.12%",
      volatility: "Very Low",
      min: 10000,
      type: "Money Market Fund",
      description: "Highly liquid, very low-risk short-term money instruments. Suitable for conservative investors.",
    },
    {
      name: "BlackRock Global Funds - Global Government Bond Fund A2",
      rr: "RR2",
      rate: "6.17%",
      volatility: "Low",
      min: 50000,
      type: "Bond Fund",
      description: "Invests in investment-grade government bonds. Offers stable interest payments with low risk.",
    },
    {
      name: "Schroder International Selection Fund Global Multi-Asset Balanced",
      rr: "RR3",
      rate: "10.53%",
      volatility: "Medium",
      min: 100000,
      type: "Balanced Fund",
      description: "Focuses on mature markets with a mix of stocks and bonds, emphasizing stable cash flow and low volatility.",
    },
    {
      name: "JPMorgan Funds - Europe Equity Fund A (acc) - USD",
      rr: "RR4",
      rate: "21.38%",
      volatility: "High",
      min: 150000,
      type: "Equity Fund",
      description: "Invests in high-dividend large-cap European companies with relatively lower volatility.",
    },
    {
      name: "Invesco Global Equity Income Fund A USD",
      rr: "RR5",
      rate: "26.46%",
      volatility: "Very High",
      min: 300000,
      type: "Equity Fund",
      description: "Targets globally leading high-quality companies for steady growth and long-term capital gains.",
    },
  ],
  extra: [
    {
      name: "Eastspring Investments Well Pool Money Market Fund",
      rr: "RR1",
      rate: "3.12%",
      volatility: "Very Low",
      min: 10000,
      type: "Money Market Fund",
      description: "Focused on short-term money market instruments. Extremely low volatility. Suitable for conservative investors looking for a parking spot for idle funds.",
    },
    {
      name: "Schroder International Selection Fund Global High Yield A1 Distribution MF",
      rr: "RR2",
      rate: "6.01%",
      volatility: "Low",
      min: 50000,
      type: "Bond Fund",
      description: "Invests in global high-yield bonds, aiming for stable interest income with controlled risk.",
    },
    {
      name: "PineBridge Preferred Securities Income Fund USD N",
      rr: "RR3",
      rate: "10.49%",
      volatility: "Medium",
      min: 100000,
      type: "Balanced Fund",
      description: "Flexible allocation between stocks and bonds. Suitable for investors seeking income with steady growth.",
    },
    {
      name: "FSITC China Century Fund-TWD",
      rr: "RR4",
      rate: "21.42%",
      volatility: "High",
      min: 150000,
      type: "Emerging Markets Equity Fund",
      description: "Focuses on China's domestic demand and growth enterprises. High potential but comes with significant volatility.",
    },
    {
      name: "Franklin Templeton Investment Funds - Franklin Innovation Fund Class A (acc) USD",
      rr: "RR5",
      rate: "26.46%",
      volatility: "Very High",
      min: 300000,
      type: "Thematic Fund",
      description:
        "Invests in innovative technology sectors such as AI, biotech, and net-zero transition. Seeks rapid capital growth.",
    },
  ],
};

const InvestmentPopup = ({ onClose, personalityType, onSave }) => {
  const [tableType, setTableType] = useState(personalityType);
  const [allocation, setAllocation] = useState({});
  const productTable = PRODUCT_TABLES[tableType];

  const handleChange = (rr) => (e) => {
    const value = parseInt(e.target.value) || 0;
    setAllocation((prev) => ({
      ...prev,
      [rr]: value,
    }));
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl w-[95%] max-w-7xl overflow-auto max-h-[95%] shadow-2xl">
        <h2 className="text-3xl font-bold mb-6">NT$1,000,000 Allocation</h2>
        <p className="text-lg mb-6">
          Please allocate your investment amount (meeting minimum investment and total amount requirements)
        </p>

        <table className="w-full border text-base">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-4 border">Fund Name</th>
              <th className="p-4 border">Risk Rating (RR)</th>
              <th className="p-4 border">Annualized Return (%)</th>
              <th className="p-4 border">Volatility</th>
              <th className="p-4 border">Minimum Investment</th>
              <th className="p-4 border">Amount</th>
              <th className="p-4 border">Fund Type</th>
              <th className="p-4 border">Description</th>
            </tr>
          </thead>
          <tbody>
            {productTable.map((prod, idx) => (
              <tr key={idx}>
                <td className="p-4 border">{prod.name}</td>
                <td className="p-4 border">{prod.rr}</td>
                <td className="p-4 border">{prod.rate}</td>
                <td className="p-4 border">{prod.volatility}</td>
                <td className="p-4 border">NT${prod.min.toLocaleString()}</td>
                <td className="p-4 border">
                  <input
                    type="number"
                    min={0}
                    step={prod.min}
                    value={allocation[prod.rr] === undefined ? "" : allocation[prod.rr]}
                    onChange={handleChange(prod.rr)}
                    className="w-40 px-4 py-2 border rounded-lg text-base"
                  />
                  {allocation[prod.rr] !== undefined &&
                    allocation[prod.rr] > 0 &&
                    allocation[prod.rr] < prod.min && (
                      <div className="text-red-500 text-sm mt-2">
                        Amount must be 0 or ≥ NT${prod.min.toLocaleString()}
                      </div>
                    )}
                </td>
                <td className="p-4 border">{prod.type}</td>
                <td className="p-4 border">{prod.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-400 text-lg text-white rounded-xl"
          >
            Close
          </button>
          {/* <div className="mt-6 flex items-center gap-3">
            <input
              type="checkbox"
              id="confirm-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="confirm-checkbox" className="text-base">
              I have completed my investment portfolio consultation
            </label>
          </div> */}
          <button
            onClick={() => {
                const total = Object.values(allocation).reduce(
                  (sum, val) => sum + val,
                  0
                );
                const hasInvalid = productTable.some(
                  (prod) =>
                    allocation[prod.rr] !== undefined &&
                    allocation[prod.rr] > 0 &&
                    allocation[prod.rr] < prod.min
                );
              
                if (hasInvalid) {
                  alert("❗️Please ensure all amounts are either 0 or not less than the minimum investment amount!");
                  return;
                }
              
                if (total !== 1000000) {
                  alert(
                    `Please ensure the total investment amount is NT$1,000,000 (current: NT$${total.toLocaleString()})`
                  );
                  return;
                }
                
                onSave(allocation);
                alert("✅ Investment portfolio saved successfully!");
            }}
              
            className="px-6 py-3 text-lg bg-green-500 text-white rounded-xl"
          >
            Save Investment Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentPopup;
