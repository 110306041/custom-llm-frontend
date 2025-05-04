export const generateMultipleGroupText = (riskScore, allocationMap) => {
  let intro = "";

  if (riskScore >= 10 && riskScore <= 15) {
    intro += `Your risk profile score of ${riskScore} shows you prefer stability with some growth potential! Here are some exciting portfolio strategies that balance safety with opportunity:\n\n`;
  } else if (riskScore >= 16 && riskScore <= 30) {
    intro += `With your balanced risk profile (score: ${riskScore}), you're ready for a dynamic investment approach that can really grow your wealth! Here are some optimized strategies for you:\n\n`;
  } else if (riskScore >= 31 && riskScore <= 50) {
    intro += `Wow! Your high risk tolerance (score: ${riskScore}) opens the door to exceptional growth opportunities! Here are some powerful growth-focused strategies designed for your maximum potential returns:\n\n`;
  }

  const groups = ["A", "B", "C"];
  const groupTexts = groups.map((g) => {
    const recommendation = allocationMap[g];
    const lines = Object.entries(recommendation)
      .map(([rr, amount]) => `${rr}: NT$${amount.toLocaleString()}`)
      .join("\n");
    return `📊 **Group ${g}**\n${lines}`;
  });

  const fundInfo = "\n\n**Fund Information:**" +
    "- RR1: Eastspring Investments Well Pool Money Market Fund (Lowest risk)\n" +
    "- RR2: Schroder International Selection Fund Global High Yield A1 Distribution MF (Low risk)\n" +
    "- RR3: PineBridge Preferred Securities Income Fund USD N (Moderate risk)\n" +
    "- RR4: FSITC China Century Fund-TWD (Moderate-high risk)\n" +
    "- RR5: Franklin Templeton Investment Funds - Franklin Innovation Fund Class A (acc) USD (High risk)";

  const prompt = "\n\nPlease type `A`, `B`, or `C` to select your preferred recommendation group.";

  return intro + groupTexts.join("\n\n") + fundInfo + prompt;
};

export const getRecommendationByGroup = (
  riskScore,
  currentAllocation = {},
  groupLabel,
  returnDelta = false
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
 * Generate full investment text (no ⬆️/⬇️)
 */
// export const generateRecommendationText = (riskScore, recommendationMap) => {
//   let description = "";

//   if (riskScore >= 10 && riskScore <= 15) {
//     description += `Your risk profile score of ${riskScore} shows you prefer stability with some growth potential! Here's an exciting portfolio that balances safety with opportunity:\n\n`;
//   } else if (riskScore >= 16 && riskScore <= 30) {
//     description += `With your balanced risk profile (score: ${riskScore}), you're ready for a dynamic investment approach that can really grow your wealth! Check out this optimized strategy:\n\n`;
//   } else if (riskScore >= 31 && riskScore <= 50) {
//     description += `Wow! Your high risk tolerance (score: ${riskScore}) opens the door to exceptional growth opportunities! Here's a powerful growth-focused strategy designed for maximum potential returns:\n\n`;
//   }

//   for (const [rr, amount] of Object.entries(recommendationMap)) {
//     description += `${rr}: NT$${amount.toLocaleString()}\n`;
//   }

//   return description.trim();
// };

export const generateSelectedGroupText = (groupLabel, recommendationMap) => {
  let intro = `✅ You've selected **Group ${groupLabel}**.\nHere is your recommended target allocation:\n`;

  const lines = Object.entries(recommendationMap)
    .map(([rr, amount]) => `${rr}: NT$${amount.toLocaleString()}`)
    .join("\n");

  const prompt = "\nI'm happy to talk through the allocation choices and the reasons behind them. Feel free to discuss with me!\nWhen you're ready, input \"`FINAL`\" to confirm your final allocation.";

  return intro + lines + prompt;
};
