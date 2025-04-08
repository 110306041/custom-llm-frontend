import React, { useState } from "react";

const PRODUCT_TABLES = {
  intro: [
    {
      name: "富蘭克林華美貨幣市場",
      rr: "RR1",
      rate: "3.12%",
      volatility: "極低",
      min: 10000,
      type: "貨幣市場基金",
      description: "流動性高，風險極低的短期貨幣工具，適合保守型投資人。",
    },
    {
      name: "貝萊德全球政府債券基金A2",
      rr: "RR2",
      rate: "6.17%",
      volatility: "低",
      min: 50000,
      type: "債券型基金",
      description: "投資於投資等級政府公債，穩定配息，風險低。",
    },
    {
      name: "施羅德環球收益平衡基金",
      rr: "RR3",
      rate: "10.53%",
      volatility: "中等",
      min: 100000,
      type: "平衡型基金",
      description: "成熟市場為主的股債配置，強調穩定現金流與低波動。",
    },
    {
      name: "摩根歐洲入息股票基金",
      rr: "RR4",
      rate: "21.38%",
      volatility: "高",
      min: 150000,
      type: "股票型基金",
      description: "投資於高股息大型歐洲企業，波動較低。",
    },
    {
      name: "景順全球優質股票基金",
      rr: "RR5",
      rate: "26.46%",
      volatility: "極高",
      min: 300000,
      type: "股票型基金",
      description: "全球大型優質企業，穩健成長，長期資本利得。",
    },
  ],
  extra: [
    {
      name: "瀚亞貨幣市場基金",
      rr: "RR1",
      rate: "3.12%",
      volatility: "極低",
      min: 10000,
      type: "貨幣市場基金",
      description: "專注短期貨幣工具配置，波動極低，適合保守資金停泊。",
    },
    {
      name: "施羅德環球高收益債券",
      rr: "RR2",
      rate: "6.01%",
      volatility: "低",
      min: 50000,
      type: "債券型基金",
      description: "投資全球高收益債券，兼具票息收益與風險控制。",
    },
    {
      name: "柏瑞收益成長平衡基金",
      rr: "RR3",
      rate: "10.49%",
      volatility: "中等",
      min: 100000,
      type: "平衡型基金",
      description: "股債靈活配置，適合追求收益與穩定的成長型投資人。",
    },
    {
      name: "第一金中國成長基金",
      rr: "RR4",
      rate: "21.42%",
      volatility: "高",
      min: 150000,
      type: "新興市場股票型基金",
      description: "聚焦中國內需與成長企業，波動大但具潛力。",
    },
    {
      name: "富蘭克林科技創新基金",
      rr: "RR5",
      rate: "26.46%",
      volatility: "極高",
      min: 300000,
      type: "主題型基金",
      description:
        "佈局科技與創新主題，如 AI、生技與淨零轉型，追求資本快速成長。",
    },
  ],
};

const InvestmentPopup = ({ onClose }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [tableType, setTableType] = useState("intro");
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
          請分配您的投資金額（需符合最低投資金額與總額限制）
        </p>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm">切換產品版本：</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTableType("intro")}
              className={`px-5 py-2 text-base rounded-lg ${
                tableType === "intro" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Intro Table
            </button>
            <button
              onClick={() => setTableType("extra")}
              className={`px-5 py-2 text-base rounded-lg ${
                tableType === "extra" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Extra Table
            </button>
          </div>
        </div>

        <table className="w-full border text-base">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-4 border">基金名稱</th>
              <th className="p-4 border">RR</th>
              <th className="p-4 border">年化報酬</th>
              <th className="p-4 border">波動性</th>
              <th className="p-4 border">最低投資額</th>
              <th className="p-4 border">輸入金額</th>
              <th className="p-4 border">說明</th>
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
                    min={prod.min}
                    value={allocation[prod.rr] || ""}
                    onChange={handleChange(prod.rr)}
                    className="w-40 px-4 py-2 border rounded-lg text-base"
                  />
                  {allocation[prod.rr] !== undefined &&
                    allocation[prod.rr] < prod.min && (
                      <div className="text-red-500 text-sm mt-2">
                        金額需 ≥ NT${prod.min.toLocaleString()}
                      </div>
                    )}
                </td>
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
            關閉
          </button>
          <div className="mt-6 flex items-center gap-3">
            <input
              type="checkbox"
              id="confirm-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="confirm-checkbox" className="text-base">
              我完成 Chatbot 投資組合諮詢
            </label>
          </div>
          <button
            onClick={() => {
                const total = Object.values(allocation).reduce(
                  (sum, val) => sum + val,
                  0
                );
                const hasInvalid = productTable.some(
                  (prod) =>
                    allocation[prod.rr] !== undefined &&
                    allocation[prod.rr] < prod.min
                );
              
                if (hasInvalid) {
                  alert("❗️請確認所有金額皆不小於各基金的最低投資金額！");
                  return;
                }
              
                if (total !== 1000000) {
                  alert(
                    `請確認總投資金額為 NT$1,000,000（目前：NT$${total.toLocaleString()}）`
                  );
                  return;
                }
              
                const summary = productTable
                  .filter((prod) => allocation[prod.rr] >= prod.min)
                  .map(
                    (prod) =>
                      `【${prod.name}】NT$${allocation[prod.rr].toLocaleString()}`
                  )
                  .join("，");
              
                if (isChecked) {
                  // 👉 show confirm popup only if checkbox is checked
                  setShowConfirmPopup(true);
                } else {
                  // 👉 directly save & inject into chatbot if NOT checked
                //   onSave({ allocation, summary, isFinalSubmit: false });
                  alert("✅ 投資組合儲存成功！");
                  onClose();
                }
              }}
              
            className="px-6 py-3 text-lg bg-green-500 text-white rounded-xl"
          >
            儲存投資組合
          </button>
        </div>
      </div>

      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-md text-center shadow-lg">
            <h3 className="text-xl font-semibold mb-4">確定送出此投資組合？</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-5 py-2 bg-gray-400 text-white rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => {
                    // onSave({ isFinalSubmit: true }); // only pass the flag
                    alert("你已完成此測驗");
                    setShowConfirmPopup(false);
                    onClose();
                }}
                className="px-5 py-2 bg-green-500 text-white rounded-lg"
                >
                確定
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentPopup;
