/**
 * Generate fixed product recommendations based on risk score for introverted personality types
 * @param {number} riskScore
 * @param {object} currentAllocation
 * @returns {object} - Recommended changes to allocation {RR1: value, RR2: value, ...}
 */
export const getFixedRecommendations = (riskScore, currentAllocation) => {
  let recommendations = {};
  
  // Low Risk (10-15): Focus on RR1 and RR2
  if (riskScore >= 10 && riskScore <= 15) {
    const recommendedAllocation = {
      RR1: 700000, // 70% in RR1 (Franklin Templeton Sinoam Money Market Fund)
      RR2: 300000, // 30% in RR2 (BlackRock Global Government Bond Fund A2)
      RR3: 0,
      RR4: 0,
      RR5: 0
    };
    
    // Calculate differences
    for (const [key, recommendedValue] of Object.entries(recommendedAllocation)) {
      const currentValue = currentAllocation[key] || 0;
      const difference = recommendedValue - currentValue;
      
      // Only include changes
      if (difference !== 0) {
        recommendations[key] = difference;
      }
    }
  }
  // Moderate Risk (16-30): Focus on RR2, RR3, RR4
  else if (riskScore >= 16 && riskScore <= 30) {
    const recommendedAllocation = {
      RR1: 0,
      RR2: 300000, // 30% in RR2
      RR3: 400000, // 40% in RR3
      RR4: 300000, // 30% in RR4
      RR5: 0
    };
    
    // Calculate differences
    for (const [key, recommendedValue] of Object.entries(recommendedAllocation)) {
      const currentValue = currentAllocation[key] || 0;
      const difference = recommendedValue - currentValue;
      
      // Only include changes
      if (difference !== 0) {
        recommendations[key] = difference;
      }
    }
  }
  // High Risk (31-50): Focus on RR3, RR4, RR5
  else if (riskScore >= 31 && riskScore <= 50) {
    const recommendedAllocation = {
      RR1: 0,
      RR2: 0, 
      RR3: 400000, // 40% in RR3
      RR4: 300000, // 30% in RR4
      RR5: 300000  // 30% in RR5
    };
    
    // Calculate differences
    for (const [key, recommendedValue] of Object.entries(recommendedAllocation)) {
      const currentValue = currentAllocation[key] || 0;
      const difference = recommendedValue - currentValue;
      
      // Only include changes
      if (difference !== 0) {
        recommendations[key] = difference;
      }
    }
  }
  
  // Check that all recommendations respect minimum amounts for each fund
  // Adjust if needed to maintain total of NT$1,000,000
  
  console.log("內向 LLM 的 fixed recommendations:", recommendations);
  return recommendations;
};

/**
 * Generate descriptive text for the recommendations
 * @param {number} riskScore
 * @param {object} recommendations
 * @returns {string} - Descriptive text explaining recommendations
 */
export const generateRecommendationText = (riskScore, recommendations) => {
  let description = "";
  
  // Add risk profile description
  if (riskScore >= 10 && riskScore <= 15) {
    description += "Based on your low risk profile (score: " + riskScore + "), I recommend focusing on conservative investments:\n\n";
  } else if (riskScore >= 16 && riskScore <= 30) {
    description += "Based on your moderate risk profile (score: " + riskScore + "), I recommend a balanced portfolio approach:\n\n";
  } else if (riskScore >= 31 && riskScore <= 50) {
    description += "Based on your high risk profile (score: " + riskScore + "), I recommend a growth-oriented investment strategy:\n\n";
  }
  
  // Add recommendation details
  for (const [fund, amount] of Object.entries(recommendations)) {
    if (amount > 0) {
      description += `⬆️ Increase ${fund} by NT$${amount.toLocaleString()}\n`;
    } else if (amount < 0) {
      description += `⬇️ Decrease ${fund} by NT$${Math.abs(amount).toLocaleString()}\n`;
    }
  }

  // 當推薦為空，代表使用者分配與建議完全相符
  if (Object.keys(recommendations).length === 0) {
    description += "✅ Your current allocation already matches the recommended structure for your risk level. Well done.\n\n";
  } else {
    // 否則，列出調整建議
    for (const [fund, amount] of Object.entries(recommendations)) {
      if (amount > 0) {
        description += `⬆️ Increase ${fund} by NT$${amount.toLocaleString()}\n`;
      } else if (amount < 0) {
        description += `⬇️ Decrease ${fund} by NT$${Math.abs(amount).toLocaleString()}\n`;
      }
    }
    description += "\nThese adjustments will help bring your portfolio closer in line with your ideal risk-based allocation.\n\n";
  }
  
  // Add fund descriptions
  description += "\n**Fund Information:**\n";
  description += "- RR1: Franklin Templeton Sinoam Money Market Fund (Lowest risk)\n";
  description += "- RR2: BlackRock Global Government Bond Fund A2 (Low risk)\n";
  description += "- RR3: Schroder International Selection Fund Global Multi-Asset Balanced (Moderate risk)\n";
  description += "- RR4: JPMorgan Funds - Europe Equity Fund A (acc) - USD (Moderate-high risk)\n";
  description += "- RR5: Invesco Global Equity Income Fund A USD (High risk)\n";
  
  description += "\nThese recommendations are designed to optimize your portfolio based on your risk tolerance while maintaining a total investment of NT$1,000,000.";
  
  return description;
}; 