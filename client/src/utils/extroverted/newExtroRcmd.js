/**
 * Get recommendation for a specific group label ('A', 'B', or 'C')
 * @param {number} riskScore 
 * @param {object} currentAllocation - 可省略或傳空物件
 * @param {string} groupLabel - 'A', 'B', or 'C'
 * @param {boolean} returnDelta - 是否回傳與 currentAllocation 的差值（預設 true）
 * @returns {object} - RR 建議值（全額或差額）
 */
export const getRecommendationByGroup = (
  riskScore,
  currentAllocation = {},
  groupLabel,
  returnDelta = true
) => {
  const groupedAllocations = {
    Low: {
      A: { RR2: 400000, RR3: 600000 },
      B: { RR1: 400000, RR2: 600000 },
      C: { RR1: 200000, RR2: 500000, RR3: 300000 }
    },
    Moderate: {
      A: { RR4: 500000, RR5: 500000 },
      B: { RR3: 400000, RR4: 300000, RR5: 300000 },
      C: { RR2: 300000, RR3: 300000, RR4: 400000 }
    },
    High: {
      A: { RR4: 400000, RR5: 600000 },
      B: { RR3: 200000, RR4: 300000, RR5: 500000 },
      C: { RR2: 200000, RR4: 400000, RR5: 400000 }
    }
  };

  const validGroups = ["A", "B", "C"];
  if (!validGroups.includes(groupLabel)) {
    console.warn("Invalid group label:", groupLabel);
    return {};
  }

  let riskLevel = null;
  if (riskScore >= 10 && riskScore <= 15) riskLevel = "Low";
  else if (riskScore >= 16 && riskScore <= 30) riskLevel = "Moderate";
  else if (riskScore >= 31 && riskScore <= 50) riskLevel = "High";
  else return {};

  const groupAlloc = groupedAllocations[riskLevel][groupLabel];
  if (!groupAlloc) return {};

  if (!returnDelta) return groupAlloc;

  const allRRKeys = new Set([
    ...Object.keys(groupAlloc),
    ...Object.keys(currentAllocation),
  ]);

  const recommendations = {};
  for (const rr of allRRKeys) {
    const targetValue = groupAlloc[rr] || 0;
    const currentValue = currentAllocation[rr] || 0;
    const diff = targetValue - currentValue;
    if (diff !== 0) recommendations[rr] = diff;
  }

  return recommendations;
};

/**
 * 初始隨機建議用：仍保留差值邏輯
 */
export const getFixedRecommendations = (riskScore, currentAllocation) => {
  const groupKeys = ["A", "B", "C"];
  const randomGroup = groupKeys[Math.floor(Math.random() * groupKeys.length)];
  const recommendations = getRecommendationByGroup(riskScore, currentAllocation, randomGroup);
  return { group: randomGroup, recommendations };
};



/**
 * Generate descriptive text for the recommendations with a more dynamic tone
 * suitable for extroverted personalities
 * @param {number} riskScore - User's risk score
 * @param {object} recommendations - Recommended changes
 * @returns {string} - Descriptive text explaining recommendations
 */
export const generateRecommendationText = (riskScore, recommendations) => {
  let description = "";
  
  // Add risk profile description with a more enthusiastic tone
  if (riskScore >= 10 && riskScore <= 15) {
    description += "Your risk profile score of " + riskScore + " shows you prefer stability with some growth potential! Here's an exciting portfolio that balances safety with opportunity:\n\n";
  } else if (riskScore >= 16 && riskScore <= 30) {
    description += "With your balanced risk profile (score: " + riskScore + "), you're ready for a dynamic investment approach that can really grow your wealth! Check out this optimized strategy:\n\n";
  } else if (riskScore >= 31 && riskScore <= 50) {
    description += "Wow! Your high risk tolerance (score: " + riskScore + ") opens the door to exceptional growth opportunities! Here's a powerful growth-focused strategy designed for maximum potential returns:\n\n";
  }
  
  // 如果沒有任何需要調整的項目
  if (Object.keys(recommendations).length === 0) {
    description += "✅ Your current allocation already matches the recommended structure for your risk level. Great job!\n\n";
  } else {
    // Add recommendation details
    for (const [fund, amount] of Object.entries(recommendations)) {
      if (amount > 0) {
        description += `⬆️ Increase ${fund} by NT$${amount.toLocaleString()}\n`;
      } else if (amount < 0) {
        description += `⬇️ Decrease ${fund} by NT$${Math.abs(amount).toLocaleString()}\n`;
      }
    }
  }

    // Add fund descriptions
  description += "\n**Fund Information:**\n";
  description += "- RR1: Eastspring Investments Well Pool Money Market Fund (Lowest risk)\n";
  description += "- RR2: Schroder International Selection Fund Global High Yield A1 Distribution MF (Low risk)\n";
  description += "- RR3: PineBridge Preferred Securities Income Fund USD N (Moderate risk)\n";
  description += "- RR4: FSITC China Century Fund-TWD (Moderate-high risk)\n";
  description += "- RR5: Franklin Templeton Investment Funds - Franklin Innovation Fund Class A (acc) USD (High risk)\n";
    
  description += "\nThis personalized strategy is designed to maximize your investment potential while aligning with your risk profile!";
  
  return description;
}; 