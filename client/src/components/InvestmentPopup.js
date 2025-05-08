import React, { useState, useEffect } from "react";

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
const InvestmentPopup = ({
  onClose,
  personalityType,
  onSave,
  isSecondAllocation = false,
  initialAllocation = {},
  llmRecommendation = {},
  optionalRecommendation = {},
}) => {
  const [tableType, setTableType] = useState(personalityType);
  const [allocation, setAllocation] = useState(initialAllocation);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (Object.keys(initialAllocation).length > 0) {
      setAllocation(initialAllocation);
    }
  }, [initialAllocation]);

  const handleChange = (rr) => (e) => {
    const value = e.target.value === "" ? undefined : parseInt(e.target.value) || 0;
    setAllocation((prev) => ({
      ...prev,
      [rr]: value,
    }));
  };

  const renderLLMRecommendation = (rr) => {
    if (!isSecondAllocation) return null;
    const llmVal = llmRecommendation[rr];
    const optVal = optionalRecommendation[rr];

    return (
      <div className="text-sm">
        {llmVal !== undefined && (
          <div className="text-black">NT${llmVal.toLocaleString()}</div>
        )}
        
      </div>
    );
  };

  const handleSave = () => {
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    const hasMissingValues = Object.values(allocation).includes(undefined);

    if (hasMissingValues) {
      alert("❗️Please enter a value (including 0) for all investment categories!");
      return;
    }

    // const hasInvalid = Object.entries(allocation).some(
    //   ([rr, value]) => value < PRODUCT_TABLES[tableType].find((prod) => prod.rr === rr).min && value > 0
    // );
    // if (hasInvalid) {
    //   alert("❗️Please ensure all amounts are either 0 or not less than the minimum investment amount!");
    //   return;
    // }

    if (total !== 1000000) {
      alert(`Please ensure the total investment amount is NT$1,000,000 (current: NT$${total.toLocaleString()})`);
      return;
    }

    if (isSecondAllocation) {
      setShowConfirmation(true);
    } else {
      onSave(allocation);
    }
  };

  const handleConfirmSave = () => {
    onSave(allocation);
    setShowConfirmation(false);
  };

  const handleCancelSave = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl w-[95%] max-w-7xl overflow-auto max-h-[95%] shadow-2xl">
        <h2 className="text-3xl font-bold mb-6">
          NT$1,000,000 Allocation
          {isSecondAllocation && <span className="text-blue-500 ml-2 text-xl">(Second Allocation with AI Recommendations)</span>}
        </h2>
        <p className="text-lg mb-6">
          Please allocate your investment amount (meeting minimum investment and total amount requirements).
          You must enter a value for each category - either 0 or an amount that meets the minimum investment requirement.
          {isSecondAllocation && (
            <span className="text-blue-600 ml-2">
              For reference, AI Recommendation and optional suggestions are shown in the rightmost column. If you’d like to refer to the chatbot’s latest allocation recommendations, you can go back and review your conversation history with it.
            </span>
          )}
        </p>

        <table className="w-full border text-base">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-4 border">Fund Name</th>
            <th className="p-4 border">Risk Rating (RR)</th>
            <th className="p-4 border">Annualized Return (%)</th>
            <th className="p-4 border">Volatility</th>
            {/* <th className="p-4 border">Minimum Investment</th> */}
            <th className="p-4 border">Amount</th>
            {isSecondAllocation && (
              <th className="p-4 border">AI Recommendation</th>
            )}
            <th className="p-4 border">Fund Type</th>
            <th className="p-4 border">Description</th>
          </tr>
        </thead>
        <tbody>
          {PRODUCT_TABLES[tableType].map((prod, idx) => (
            <tr key={idx}>
              <td className="p-4 border">{prod.name}</td>
              <td className="p-4 border">{prod.rr}</td>
              <td className="p-4 border">{prod.rate}</td>
              <td className="p-4 border">{prod.volatility}</td>
              {/* <td className="p-4 border">NT${prod.min.toLocaleString()}</td> */}
              <td className="p-4 border">
                <input
                  type="number"
                  min={0}
                  step={prod.min}
                  placeholder="Enter 0 or min value"
                  required
                  value={allocation[prod.rr] === undefined ? "" : allocation[prod.rr]}
                  onChange={handleChange(prod.rr)}
                  className="w-40 px-4 py-2 border rounded-lg text-base"
                />
              </td>
              {isSecondAllocation && (
                <td className="p-4 border">{renderLLMRecommendation(prod.rr)}</td>
              )}
              <td className="p-4 border">{prod.type}</td>
              <td className="p-4 border">{prod.description}</td>
            </tr>
          ))}
        </tbody>

        </table>

        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-6 py-3 bg-gray-400 text-lg text-white rounded-xl">
            Close
          </button>
          <button onClick={handleSave} className="px-6 py-3 text-lg bg-green-500 text-white rounded-xl">
            Save Investment Portfolio
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
            <h3 className="text-2xl font-semibold mb-4">Confirm Your Action</h3>
            <p className="text-lg mb-6">
              You are about to finalize your investment portfolio. Do you want to proceed with saving your final allocation?
            </p>
            <div className="flex justify-between gap-4">
              <button onClick={handleCancelSave} className="px-6 py-3 bg-gray-400 text-white rounded-xl">
                Cancel
              </button>
              <button onClick={handleConfirmSave} className="px-6 py-3 bg-green-500 text-white rounded-xl">
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default InvestmentPopup;
