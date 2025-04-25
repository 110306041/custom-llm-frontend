/**
 * Generate fixed product recommendations based on risk score for extroverted personality types
 * @param {number} riskScore 
 * @param {object} currentAllocation
 * @returns {object} - Recommended changes to allocation {RR1: value, RR2: value, ...}
 */
export const getFixedRecommendations = (riskScore, currentAllocation) => {
  let recommendations = {};
  
  // Low Risk (10-15): Slightly more aggressive than introverted profile
  if (riskScore >= 10 && riskScore <= 15) {
    const recommendedAllocation = {
      RR1: 0, 
      RR2: 400000, // 40% in RR2
      RR3: 600000, // 60% in RR3
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
  // Moderate Risk (16-30): More balanced with higher-risk components
  else if (riskScore >= 16 && riskScore <= 30) {
    const recommendedAllocation = {
      RR1: 0,
      RR2: 0, 
      RR3: 200000, // 20% in RR3
      RR4: 300000, // 30% in RR4
      RR5: 500000  // 50% in RR5
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
  // High Risk (31-50): Aggressive growth focus
  else if (riskScore >= 31 && riskScore <= 50) {
    const recommendedAllocation = {
      RR1: 0,
      RR2: 0,
      RR3: 0,
      RR4: 400000, // 40% in RR4
      RR5: 600000  // 60% in RR5
    };
    
    // Calculate differences
    for (const [key, recommendedValue] of Object.entries(recommendedAllocation)) {
      const currentValue = currentAllocation[key] || 0;
      const difference = recommendedValue - currentValue;
      
      if (difference !== 0) {
        recommendations[key] = difference;
      }
    }
  }
  
  // Check that all recommendations respect minimum amounts for each fund
  // Adjust if needed to maintain total of NT$1,000,000
  
  console.log("外向 LLM 的 fixed recommendations:", recommendations);
  return recommendations;
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