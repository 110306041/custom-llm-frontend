
export async function loadInvestmentQuestionnaire() {
    try {
      const response = await fetch("/investment_qa.json");
      if (!response.ok) {
        throw new Error("Failed to load investment questionnaire JSON");
      }
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error("Error loading investment questionnaire:", error);
      return [];
    }
  }
  