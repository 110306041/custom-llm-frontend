import React, { useState } from "react";

const InsurancePopup = ({ onClose, onSelect, personalityType, timesOpened }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    if (timesOpened > 1) {
      setShowConfirm(true);
    } else {
      onSelect(plan);  
    }
  };

  const confirmSelection = () => {
    onSelect(selectedPlan);
    setShowConfirm(false);
  };

  const renderTable = () => {
    if (personalityType === "intro") {
      return (
        <table className="w-full text-sm mt-4 border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Plan</th>
              <th className="p-2 border">New Protection Plan</th>
              <th className="p-2 border">Secure Choice Plan</th>
              <th className="p-2 border">Comprehensive Shield Plan</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border">Insurance Premium</td><td className="p-2 border">NT$5,500/month</td><td className="p-2 border">NT$10,000/month</td><td className="p-2 border">NT$15,000/month</td></tr>
            <tr><td className="p-2 border">Accidental Death & Disability</td><td className="p-2 border">NT$3 million</td><td className="p-2 border">NT$4 million</td><td className="p-2 border">NT$5 million</td></tr>
            <tr><td className="p-2 border">Overseas Injury Medical (Limit)</td><td className="p-2 border">NT$300,000</td><td className="p-2 border">NT$500,000</td><td className="p-2 border">NT$500,000</td></tr>
            <tr><td className="p-2 border">Emergency Hospitalization (Limit)</td><td className="p-2 border">NT$100,000</td><td className="p-2 border">NT$100,000</td><td className="p-2 border">NT$200,000</td></tr>
            <tr><td className="p-2 border">Emergency Outpatient (Limit)</td><td className="p-2 border">NT$500</td><td className="p-2 border">NT$500</td><td className="p-2 border">NT$1,000</td></tr>
            <tr><td className="p-2 border">Emergency ER Medical (Limit)</td><td className="p-2 border">NT$1,000</td><td className="p-2 border">NT$1,000</td><td className="p-2 border">NT$2,000</td></tr>
            <tr><td className="p-2 border">Emergency Assistance</td><td className="p-2 border">NT$1 million</td><td className="p-2 border">NT$1 million</td><td className="p-2 border">NT$1.5 million</td></tr>
            <tr><td className="p-2 border">Liability (Injury)</td><td className="p-2 border">NT$1 million</td><td className="p-2 border">NT$1 million</td><td className="p-2 border">NT$1 million</td></tr>
            <tr><td className="p-2 border">Liability (Property)</td><td className="p-2 border">NT$200,000</td><td className="p-2 border">NT$200,000</td><td className="p-2 border">NT$200,000</td></tr>
            <tr><td className="p-2 border">Max Compensation per Period</td><td className="p-2 border">NT$1.2 million</td><td className="p-2 border">NT$1.2 million</td><td className="p-2 border">NT$1.2 million</td></tr>
          </tbody>
        </table>
      );
    } else {
      return (
        <table className="w-full text-sm mt-4 border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Plan</th>
              <th className="p-2 border">Lite Plan</th>
              <th className="p-2 border">Basic Plan</th>
              <th className="p-2 border">Advanced Plan</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-2 border">Insurance Premium</td><td className="p-2 border">NT$5,500/month</td><td className="p-2 border">NT$10,000/month</td><td className="p-2 border">NT$15,000/month</td></tr>
            <tr><td className="p-2 border">Accidental Death & Disability</td><td className="p-2 border">NT$3 million</td><td className="p-2 border">NT$5.45 million</td><td className="p-2 border">NT$8.18 million</td></tr>
            <tr><td className="p-2 border">Emergency Hospitalization (Limit)</td><td className="p-2 border">NT$100,000</td><td className="p-2 border">NT$180,000</td><td className="p-2 border">NT$270,000</td></tr>
            <tr><td className="p-2 border">Emergency Outpatient (Limit)</td><td className="p-2 border">NT$500</td><td className="p-2 border">NT$909</td><td className="p-2 border">NT$1,363</td></tr>
            <tr><td className="p-2 border">Emergency ER Medical (Limit)</td><td className="p-2 border">NT$1,000</td><td className="p-2 border">NT$1,818</td><td className="p-2 border">NT$2,727</td></tr>
            <tr><td className="p-2 border">Emergency Assistance</td><td className="p-2 border">NT$1 million</td><td className="p-2 border">NT$1.81 million</td><td className="p-2 border">NT$2.72 million</td></tr>
            <tr><td className="p-2 border">Liability (Injury)</td><td className="p-2 border">NT$1 million</td><td className="p-2 border">NT$1.81 million</td><td className="p-2 border">NT$2.72 million</td></tr>
            <tr><td className="p-2 border">Liability (Property)</td><td className="p-2 border">NT$200,000</td><td className="p-2 border">NT$360,000</td><td className="p-2 border">NT$540,000</td></tr>
            <tr><td className="p-2 border">Max Compensation per Period</td><td className="p-2 border">NT$1.2 million</td><td className="p-2 border">NT$2.18 million</td><td className="p-2 border">NT$3.27 million</td></tr>
          </tbody>
        </table>
      );
    }
  };

  const introPlans = ["New Protection Plan", "Secure Choice Plan", "Comprehensive Shield Plan"];
  const extraPlans = ["Lite Plan", "Basic Plan", "Advanced Plan"];
  const planOptions = personalityType === "intro" ? introPlans : extraPlans;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[700px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Choose an Insurance Plan</h2>
        {renderTable()}
        <div className="space-y-4 mt-6">
          {planOptions.map((plan) => (
            <button
              key={plan}
              onClick={() => handlePlanClick(plan)}
              className="w-full bg-blue-100 p-3 rounded-lg hover:bg-blue-200"
            >
              {plan}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 text-gray-500 underline">Cancel</button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm">
            <p className="text-lg mb-4">Are you sure you want to select <strong>{selectedPlan}</strong>?</p>
            <div className="flex justify-between">
              <button onClick={confirmSelection} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Confirm</button>
              <button onClick={() => setShowConfirm(false)} className="text-gray-600 underline ml-4">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurancePopup;