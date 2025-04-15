// utils/loadInsuranceQuestionnaire.js

export const loadInsuranceQuestionnaire = async () => {
    // These questions mirror the user instructions for the "insurance" scenario
    const insuranceQuestions = [
      {
        text: "How concerned are you about medical emergencies and travel risks?",
        options: [
          "Low Concern",
          "Moderate Concern",
          "High Concern",
        ],
      },
      {
        text: "How important is it for you to save money for other expenses?",
        options: [
          "Very Important",
          "Somewhat Important",
          "Not Important",
        ],
      },
      {
        text: "How will you spend your time outside of studying?",
        options: [
          "I will mostly stay on campus and focus on studying.",
          "I plan to travel frequently to different cities/countries.",
          "I will participate in outdoor or adventure activities (e.g., skiing, hiking, diving).",
          "I will work part-time and commute regularly.",
        ],
      },
    ];
  
    return new Promise((resolve) => {
      setTimeout(() => resolve(insuranceQuestions), 300);
    });
  };
  