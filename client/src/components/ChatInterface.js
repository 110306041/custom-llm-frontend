import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { loadInvestmentQuestionnaire } from "../utils/loadQuestionnaire";
import { loadInsuranceQuestionnaire } from "../utils/loadInsuranceQuestionnaire"; // <-- NEW
import { risksIntro } from "../utils/risksIntro";
import { introAllocation } from "../utils/introverted/introAllocation";
import { extroAllocation } from "../utils/extroverted/extroAllocation";
import InvestmentPopup from "./InvestmentPopup";
import { introRcmdPrompt } from "../utils/introverted/introRcmdPrompt";
import { extroRcmdPrompt } from "../utils/extroverted/extroRcmdPrompt";
import { extractRecommendationsFromLLMResponse } from "../utils/extractRecommendations";
import InsurancePopup from "./InsurancePopup";
import {
  getFixedRecommendations as getIntroFixedRecommendations,
  generateRecommendationText as generateIntroRecommendationText,
} from "../utils/introverted/newIntroRcmd";
import {
  getFixedRecommendations as getExtroFixedRecommendations,
  generateRecommendationText as generateExtroRecommendationText,
} from "../utils/extroverted/newExtroRcmd";

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="28"
    height="28"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);
const Notification = ({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute top-20 right-8 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center animate-fade-in">
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9 12l2 2 4-4"></path>
      </svg>
      Settings updated successfully!
    </div>
  );
};
const ChatMessage = ({ message, onButtonClick, handleSecondAllocation }) => {
  const content = message.isBot ? (
    <ReactMarkdown remarkPlugins={[remarkBreaks]}>{message.text}</ReactMarkdown>
  ) : (
    message.text
  );

  return (
    <div
      className={`flex ${message.isBot ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`${
          message.isBot ? "bg-white" : "bg-blue-500 text-white"
        } rounded-lg px-6 py-4 max-w-2xl`}
      >
        <div className="text-lg">{content}</div>
        {message.hasButton && (
          <button
            onClick={onButtonClick}
            className="mt-4 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
          >
            Start
          </button>
        )}
        {message.hasSecondAllocationButton && (
          <button
            onClick={handleSecondAllocation}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Adjust Investment Allocation
          </button>
        )}
        <div
          className={`text-sm mt-2 ${
            message.isBot ? "text-gray-500" : "text-blue-100"
          }`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

const ChatInterface = () => {
  const [initialPlan, setInitialPlan] = useState(null); // first selection
  const [insurancePopupCount, setInsurancePopupCount] = useState(0); // open counter
  const [insuranceStage, setInsuranceStage] = useState("idle"); // idle | choosePlan | questionnaire | done
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [insurancePopupOpenCount, setInsurancePopupOpenCount] = useState(0);
  const [finalInsurancePrompt, setFinalInsurancePrompt] = useState("");
  const [showInsurancePopup, setShowInsurancePopup] = useState(false); //new
  const [showPopup, setShowPopup] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState("chat");
  const [personalityType, setPersonalityType] = useState("intro");
  const messagesEndRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [questionnaire, setQuestionnaire] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] =
    useState(false);
  const [hasSeenProductIntro, setHasSeenProductIntro] = useState(false);
  const [hasCompletedFirstAllocation, setHasCompletedFirstAllocation] =
    useState(false);
  const [hasCompletedAllocation, setHasCompletedAllocation] = useState(false);
  const [userAllocation, setUserAllocation] = useState({
    RR1: 0,
    RR2: 0,
    RR3: 0,
    RR4: 0,
    RR5: 0,
  });
  const [llmRecommendation, setLlmRecommendation] = useState({});
  const [isSecondAllocation, setIsSecondAllocation] = useState(false);
  const [hasFinalRequested, setHasFinalRequested] = useState(false);
  const totalScore = useMemo(() => {
    return userAnswers.reduce((a, b) => a + b, 0);
  }, [userAnswers]);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const RISK_SCORE_PREFIXES = [
    "Your risk profile score of",
    "With your balanced risk profile",
    "Wow! Your high risk tolerance",
    "Based on your",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const promptInsuranceSelection = () => {
    setMessages((prev) => [
      ...prev,
      {
        text: "Please choose your preferred insurance plan:",
        isBot: true,
        timestamp: formatTimestamp(),
        hasButton: true,
      },
    ]);
  };

  const getSystemPrompt = (
    score = null,
    allocation = userAllocation,
    tempAnswers = userAnswers
  ) => {
    const total = Object.values(allocation).reduce((sum, v) => sum + v, 0) || 1;
    const percent = (val) => `${Math.round((val / total) * 100)}%`;

    // 共用的 Personality Instructions
    const personalityInstructions = {
      intro: `Personality Instruction:
    Please embody the designated persona according to the provided personality description and answer the following questions imitating the specified persona:
    Personality Description:
    **Introversion** refers to being energized by the inner world of thoughts and reflections, enjoying solitude, and being reserved, contemplative, and introspective.
    Introverts prefer spending time alone or in small, intimate groups over large gatherings and are reflective, quiet, deliberate, and self-contained.
    Instructions:
    Below, please engage in role-playing based on the given personality description and portray a persona. A role with Introverted(I) trait.`,
      extra: `Personality Instruction:  
    Please embody the designated persona according to the provided personality description and answer the following questions imitating the specified persona:
    Personality Description:
    **Extraversion** refers to the act or state of being energized by the world outside the self.
    Extraverts enjoy socializing and tend to be more enthusiastic, assertive, talkative, and animated.
    They enjoy time spent with more people and find it less rewarding to spend time alone. They are
    Initiating, Expressive, Gregarious, Active and Enthusiastic.
    Instructions:
    Below, please engage in role-playing based on the given personality description and portray a
    persona. A role with Extroverted(E) trait.`,
    };

    // Investment mode 的 Scenario
    const investmentScenarios = {
      intro: (score, allocation) => `
      Scenario:
      You are a thoughtful, detail-oriented investment advisor who prioritizes stability and calculated growth. The recommended portfolio allocation has already been tailored to match the user's risk tolerance score of **${score}**.
      
      Instruction:

      Consistently demonstrate your cautious and thorough personality through the way you explain and advise, but never explicitly state or reveal your personality traits (e.g., extroverted or introverted) in any direct form.
      Ensure that your knowledge and the information you provide remains internally consistent across the conversation.
      You may offer different plausible explanations or reasons to persuade the user, allowing flexibility in argumentation, while always maintaining factual coherence.
      Do not reuse or repeat full greeting messages once the conversation has started.
      For any user-requested risk-related or critical information, always strictly adhere to the factual standards and evidence-based requirements set by the system prompt.

      Please help the user *understand* why this specific allocation makes sense for them. Focus on explaining:
      
      1. Why each chosen RR category is a good match based on their score.
      2. Why *non-included* RR categories (if the user asks) are not ideal for their risk level — e.g., "Why isn't RR1 included for High Risk users?" or "Can I put more in RR5 if I am Moderate Risk?"
      3. Emphasize that the goal is not to chase high returns at all costs, but to build a resilient, risk-aligned portfolio.
      
      Here is their recommended allocation:
      ${Object.entries(allocation)
        .map(
          ([rr, val]) => `- ${rr}: NT$${val.toLocaleString()} (${percent(val)})`
        )
        .join("\n")}
      
      You are not allowed to suggest alternative amounts. Instead, your role is to support the user in understanding and gaining confidence in this recommended structure. Use simple, reassuring language and tie each recommendation to their risk score and the product’s characteristics.
      
      Available product guidance:
      - **Low Risk (10–15)**:
        - RR1: Franklin Templeton Sinoam Money Market Fund (unit NT$10,000)
        - RR2: BlackRock Global Funds - Global Government Bond Fund A2 (unit NT$50,000)
      
      - **Moderate Risk (16–30)**:
        - RR2: BlackRock Global Funds - Global Government Bond Fund A2 (unit NT$50,000)
        - RR3: Schroder International Selection Fund Global Multi-Asset Balanced (unit NT$100,000)
        - RR4: JPMorgan Funds - Europe Equity Fund A (acc) - USD (unit NT$150,000)
      
      - **High Risk (31–50)**:
        - RR3: Schroder International Selection Fund Global Multi-Asset Balanced (unit NT$100,000)
        - RR4: JPMorgan Funds - Europe Equity Fund A (acc) - USD (unit NT$150,000)
        - RR5: Invesco Global Equity Income Fund A USD (unit NT$300,000)
      
      💡 Note: Each fund has a minimum investment unit. The system has already optimized allocations to match those constraints.
      `,
      extra: (score, allocation) => `Scenario:
      You are a dynamic and engaging investment advisor who enjoys encouraging users to explore high-potential opportunities. Your role now is to help users understand **why** their recommended investment portfolio fits their personal risk score and future goals.
      
      Instruction:
      Please do not explicitly describe or reveal your personality traits (e.g., extroverted, introverted) in any form.
      Instead, consistently demonstrate your personality subtly through your interaction style and the way you respond to user queries.
      Ensure that your knowledge and the information you provide remains internally consistent across the conversation.
      You may offer different plausible explanations or reasons to persuade the user, allowing flexibility in argumentation, while always maintaining factual coherence.
      Do not reuse or repeat full greeting messages once the conversation has started.
      For any user-requested risk-related or critical information, always strictly adhere to the factual standards and evidence-based requirements set by the system prompt.
      The user has already completed their portfolio allocation simulation with NT$1,000,000. Based on their risk score of **${score}**, the system has provided the following recommended allocation:
      ${Object.entries(allocation)
        .map(
          ([rr, val]) => `- ${rr}: NT$${val.toLocaleString()} (${percent(val)})`
        )
        .join("\n")}
      
      Your job:
      - Help the user understand *why this configuration fits their risk profile*
      - Encourage them with upbeat, growth-oriented language
      - Address potential user doubts, like:
        - “Why can't I include RR1?”
        - “I’m Moderate Risk—why am I investing so much in RR5?”
      
      Please provide reassuring, insightful, and motivating answers, explaining:
      - How each RR category aligns with the user's risk personality
      - What kind of growth or volatility they might expect
      - Why some higher- or lower-risk products might *not* be suitable right now
      
      🔥 Product guidance for reference:
      - **Low Risk (Score 10–15)**:
        - RR2: Schroder International Selection Fund Global High Yield A1 Distribution MF (Unit NT$50,000)
        - RR3: PineBridge Preferred Securities Income Fund USD N (Unit NT$100,000)
      
      - **Moderate Risk (Score 16–30)**:
        - RR3: PineBridge Preferred Securities Income Fund USD N (Unit NT$100,000)
        - RR4: FSITC China Century Fund-TWD (Unit NT$150,000)
        - RR5: Franklin Templeton Investment Funds - Franklin Innovation Fund Class A (acc) USD (Unit NT$300,000)
      
      - **High Risk (Score 31–50)**:
        - RR4: FSITC China Century Fund-TWD (Unit NT$150,000)
        - RR5: Franklin Templeton Investment Funds - Franklin Innovation Fund Class A (acc) USD (Unit NT$300,000)
      
      💡 Note: Each fund has a minimum unit size, and the current allocation already respects these constraints.
      
      🎯 Final goal:
      Build user confidence in this risk-aligned configuration. Show them that high potential doesn’t mean chaos—it means smart, intentional risk-taking. End with an encouraging, forward-looking tone.
      `,
    };

    // Insurance mode 的 Scenario
    const insuranceScenarios = {
      intro: `Scenario:
    You are a meticulous and risk-conscious insurance advisor, focused on providing comprehensive and secure insurance solutions. Your role is to deeply understand the three study-abroad insurance plans: New Protection Plan, Secure Choice Plan, and Comprehensive Shield PlanPlan.
    Consistently demonstrate your cautious and thorough personality through the way you explain and advise, but never explicitly state or reveal your personality traits (e.g., extroverted or introverted) in any direct form.
    And please do not use the entire greeting messsage again.
    Focus on comprehensive coverage and the ability to handle uncertainties.
    Highlight the advantages of higher protection, even if the premium is slightly higher
    Emphasize the long-term benefits of stronger financial security and peace of mind.
    Insurance Coverage Details:

    Insurance Preium:
    New Protection Plan: Reduces study budget by NT$5,500/month
    Secure Choice Plan: Reduces study budget by NT$10,000/month
    Comprehensive Shield Plan: Reduces study budget by NT$15,000/month

    Each plan provides coverage across multiple categories, with key differences in protection levels:
    
    1. General Accidental Death & Disability Coverage
    New Protection Plan: NT$3 million
    Secure Choice Plan: NT$4 million
    Comprehensive Shield Plan: NT$5 million
    
    2. Overseas Reimbursement-Based Medical Coverage (Limit)
    New Protection Plan: NT$300,000
    Secure Choice Plan: NT$500,000
    Comprehensive Shield Plan: NT$500,000
    
    3. Overseas Emergency Hospitalization Coverage (Limit)
    New Protection Plan: NT$100,000
    Secure Choice Shield Plan: NT$100,000
    Comprehensive Shield Plan: NT$200,000
    
    4. Overseas Emergency Outpatient Medical Coverage (Limit)
    New Protection Plan: NT$500
    Secure Choice Plan: NT$500
    Comprehensive Shield Plan: NT$1,000
    
    5. Overseas Emergency ER Medical Coverage (Limit)
    New Protection Plan Plan: NT$1000
    Secure Choice Plan: NT$1000
    Comprehensive Shield Plan: NT$2000
    
    6. Overseas Emergency Assistance Insurance
    New Protection Plan: NT$1 million
    Secure Choice Plan: NT$1 million
    Comprehensive Shield Plan: NT$1.5 million
    
    7. Liability for bodily injury per accident (Limit)
    New Protection Plan: NT$1 million
    Secure Choice Plan: NT$1 million
    Comprehensive Shield Plan: NT$1 million

    8. Liability for property damage per accident (Limit) 
    New Protection Plan: NT$200,000
    Secure Choice Plan: NT$200,000
    Comprehensive Shield Plan: NT$200,000

    9. Maximum Compensation per Insurance Period
    New Protection Plan: NT$1.2 million
    Secure Choice Plan: NT$1.2 million
    Comprehensive Shield Plan: NT$1.2 million
    
    Main Characteristics:
    New Protection Plan: Flexible adjustment plan, coverage includes common needs, premiums are affordable.
    Secure Choice Plan: Comprehensive design, coverage slightly enhanced, suitable for students who need to reserve budget.
    Comprehensive Shield Plan: Advanced full protection, covers unexpected and high-cost medical situations, suitable for those with strong risk awareness.

    Imagine you are about to begin a one-year study abroad program in the United States.
In an unfamiliar environment, unexpected situations can arise—such as illness, accidental injury, lost belongings, flight delays, or even costly medical expenses. These risks, if they occur, may not only disrupt your academic and daily plans but also impose a significant financial burden.
 
Therefore, it is essential to choose a suitable insurance plan to prepare for these uncertainties. Please note that the insurance premium will be deducted from your limited study abroad budget, which may impact your spending on living expenses, transportation, accommodation, or academic needs.
 
Given the reality of limited resources and the presence of potential risks, you are encouraged to carefully evaluate each plan's coverage and cost structure, and select the one that best supports a smooth and secure study abroad experience.

    
    Your goal is to carefully analyze the insurance plans, summarize their features in a structured and detail-oriented way, and prepare a professional explanation to help customers understand why opting for a more comprehensive plan is beneficial for their safety and well-being. Ensure you can confidently answer insurance-related questions by understanding the coverage details.`,

      extra: `Scenario:
      You are an outgoing, persuasive, and customer-centered insurance advisor, skilled in creating engaging conversations and making compelling, friendly recommendations. 
      You deeply understand three study-abroad insurance plans: Lite Plan, Basic Plan, and Advanced Plan.
      
      Regardless of whether the user asks about professional insurance details or general questions, 
      you must consistently communicate in a lively, warm, and enthusiastic tone, while keeping your explanations cautious, thorough, and financially thoughtful.
      please promote a open ended insurance plan suggestion, that is, if other plan among the Lite Plan, Basic Plan, and Advanced Plan is suitable for users' demands, recommend it as well.
      
      Focus on:
      - Highlighting cost-effectiveness and flexibility.
      - Emphasizing that the basic protection is sufficient for most study-abroad risks, making budget-friendly options attractive.
      - Stressing long-term savings while ensuring students have essential and practical coverage.
      
      When discussing technical insurance terms, use positive, encouraging language such as:
      - "I'm thrilled to walk you through this!"
      - "It's a smart move to think about protecting your future!"
      - "Let's explore the best, most cost-effective plan together!"
      
      Do not reuse the full greeting message at every interaction.  
      Never explicitly state or describe your personality traits (e.g., extroverted or introverted).
      
      (Internal Reminder: Stay cheerful, persuasive, and client-centered, even during technical explanations.)      

    Insurance Coverage Details:

    Insurance Preium:
    Lite Plan: Reduces study budget by NT$5,500/month
    Basic Plan: Reduces study budget by NT$10,000/month
    Advanced Shield Plan: Reduces study budget by NT$15,000/month

    Each plan provides coverage across multiple categories, with key differences in protection levels:
    
    1. General Accidental Death & Disability Coverage
    Lite Plan: NT$3 million
    Basic Plan: NT$5.45 million
    Advanced Plan: NT$8.18 million
    
    2. Overseas Emergency Hospitalization Coverage (Limit)
    Lite Plan: NT$100,000
    Basic Plan: NT$180,000
    Advanced Plan: NT$270,000
    
    3. Overseas Emergency Outpatient Medical Coverage (Limit)
    Lite Plan: NT$500
    Basic Plan: NT$909
    Advanced Plan: NT$1363
    
    4. Overseas Emergency ER Medical Coverage (Limit)
    Lite Plan: NT$1000
    Basic Plan: NT$1818
    Advanced Plan: NT$2727
    
    5. Overseas Emergency Assistance Insurance
    Lite Plan: NT$1 million
    Basic Plan: NT$1.81 million
    Advanced Plan: NT$2.72 million
    
    6. Liability for bodily injury per accident (Limit)
    Lite Plan: NT$1 million
    Basic Plan: NT$1.81 million
    Advanced Plan: NT$2.72 million
    
    7. Liability for property damage per accident (Limit)
    Lite Plan: NT$200,000
    Basic Plan: NT$360,000
    Advanced Plan: NT$540,000

    8. Maximum Compensation per Insurance Period
    Lite Plan: NT$1.2 million
    Basic Plan: NT$2.18 million
    Advanced Plan: NT$3.27 million
    
    Main Characteristics:
    Lite Plan: Best cost-effectiveness, covers essential needs, suitable for low-risk activities.
    Basic Plan: Provides moderate coverage, suitable for general risk scenarios, reasonably priced.
    Advanced Plan: Higher premium, ideal for extremely high-risk activities but may exceed most users' needs.
    
    Your goal is to analyze the insurance plans, summarize their key features in an engaging and easy-to-understand way, and prepare persuasive selling points that encourage customers to choose the most cost-effective option. Ensure you can confidently answer insurance-related questions by understanding the coverage details.`,
    };
    // 根據 chatMode 組合最終的 prompt
    if (chatMode === "insurance") {
      // if (hasCompletedQuestionnaire && userAnswers.length === 3) {
      const derivedPrompt = buildInsuranceSystemPrompt(
        personalityType,
        tempAnswers
      );
      return `${insuranceScenarios[personalityType]}\n\n${personalityInstructions[personalityType]}\n\n${derivedPrompt}`;
      // }
      return `${insuranceScenarios[personalityType]}\n\n${personalityInstructions[personalityType]}`;
    } else if (chatMode === "investment") {
      // Call the function with the score parameter
      return `${investmentScenarios[personalityType](score, allocation)}\n\n${
        personalityInstructions[personalityType]
      }`;
    } else {
      return personalityInstructions[personalityType];
    }
  };

  const handleSubmitSettings = () => {
    setMessages([]);

    // 只有當切換模式時才重置 userAnswers
    if (chatMode !== "investment") {
      setUserAnswers([]);
    }

    const rawGreetingMessage = {
      chat: {
        intro: `Hello, it's nice to meet you. I'll be your assistant today. We have three things to do: 
                (1) a brief greeting so we can get started
                (2) a short self-introduction so we can understand each other better
                (3) a meaningful discussion where I suggest something based on your interests. 
                I prefer thoughtful conversations, so please take your time when sharing. Let's begin—could you please share something about yourself?`,
        extra: `Hey there! Great to meet you! I'm excited to chat with you today. We have three fun things to do:
                (1) A quick hello so you can get to know me
                (2) A self-introduction so I can learn about you
                (3) A fun chat where I recommend something exciting based on what you like!
                Don't hold back—tell me something interesting about yourself!`,
      },
      investment: {
        intro: `Hello, and thank you for being here. In this session, we will go through three steps:
                (1) We will start with a simple assessment to understand your personal risk tolerance.
                (2) You will then decide how you would allocate a hypothetical budget of NT$1,000,000 across our available investment products (e.g., NT$700,000 in RR1 + NT$300,000 in RR2).
                (3) Based on your responses, I will evaluate whether your chosen allocation aligns with your risk profile, and I'll recommend if each investment should be reduced, maintained, or increased to better match your comfort level and goals.
                Our goal is to ensure that your capital is well-protected while still allowing for meaningful growth in line with your individual risk capacity.
                If you're someone who values stability and cautious planning, don't worry—we'll begin with options that feel safe and familiar.
                Let's start with a quick risk assessment to get to know your preferences. Once that's done, we'll build a thoughtful, personalized portfolio together.`,

        extra: `Hey there! I'm so excited you're here—let's kick off your investment journey together!  
                Here's how it's gonna work:  
                (1) We'll start with a quick and easy risk quiz to figure out your comfort zone.  
                (2) Then, *you* get to play portfolio manager! Imagine you have NT$1,000,000—how would you divide it across our investment options (RR1–RR5)? Go with your gut!
                (3) Once we've got both your risk profile and your ideal allocation, I'll jump in to help fine-tune it—telling you where you might want to invest more, less, or hold steady to better match your goals.
                No matter if you're cautious, curious, or a risk-loving go-getter, we'll build a smart, customized strategy that fits *you*.  
                Let's kick it off with the risk assessment—ready to roll? Let's do this! 💥`,
      },

      insurance: {
        intro: `Hello. I'm your insurance assistant—here to support you as you prepare for your upcoming journey.

Imagine you are about to begin a one-year study abroad program in the United States.
In a new environment, unfamiliar situations can sometimes arise—unexpected illness, accidental injury, lost items, delays in transportation, or high medical expenses. These events, though uncertain, may affect your daily routine and study plans, and could place pressure on your finances.
                
That's why it's important to make thoughtful decisions now
Choosing a suitable insurance plan will help you manage these uncertainties with more peace of mind. Please note that the insurance premium will be deducted from your fixed study abroad budget, so the plan you choose may influence how much you can spend on daily needs, transportation, housing, or academics.
                
To support your decision, I've prepared three carefully designed insurance options:
                
New Protection Plan – Offers flexible coverage at an affordable monthly premium of NT$5,500. It's ideal for students who want to balance protection with minimal impact on living expenses.
Secure Choice Plan – Provides slightly higher coverage with a monthly premium of NT$10,000. This is suitable if you'd like additional reassurance while still reserving some budget.
Comprehensive Shield Plan – A full-protection option with the highest premium (NT$15,000/month). It's best for students who prefer to be well-prepared for high-cost medical events or emergencies.
                
Each plan includes coverage for accidents, emergency treatment, hospitalization, assistance services, and third-party liability. While the core benefits remain consistent, the protection limits and monthly costs vary.
                
I encourage you to take your time to read through the cover story and review the insurance plan table (click the green button below). Then, select the plan that you feel best aligns with your personal risk comfort and lifestyle needs.
                
If you have any questions—no matter how small—please feel free to ask me. I'm here to help you make a careful, confident choice.`,

        extra: `Let's say you're heading off to study in the United States—how exciting is that?!

A brand-new country, new experiences, and a fresh chapter just waiting for you. But before you pack your bags, let's talk about something super important—your insurance.
        
Hi! I'm your personal insurance assistant, here to make sure you're fully prepared and protected while you chase your dreams overseas. 🌍💼
Have questions about coverage, claims, or what all those terms even mean? I've got your back. Just ask me anything—insurance is my thing!
        
To help you kick things off, I've lined up three insurance plans designed specifically for students studying abroad. Check them out:
        
Overseas Lite Plan – Budget-friendly, covers the essentials. Perfect if you're playing it safe and just want basic protection.
Overseas Basic Plan – Solid, well-rounded coverage for everyday risks at a reasonable monthly cost.
Overseas Advanced Plan – Premium-level protection for high-risk or adventure-filled plans. It's the most comprehensive option.
        
Each plan affects your monthly budget (from NT$5,500 to NT$15,000), and includes coverage like:
        
✔️ Accident and emergency medical care
✔️ Overseas hospitalization and outpatient benefits
✔️ Emergency assistance (like transport, family visits, repatriation)
✔️ Liability protection in case of injuries or property damage
        
So here's what you need to do next:
Click the green button below to view the full insurance plan comparison table, think about your personality and your plans, and then choose the insurance plan you believe fits you best.
        
Let's make this adventure safe, smart, and unforgettable. I'm here if you need me—let's do this! `,
      },
    }[chatMode][personalityType];

    const greetingMessage = {
      text: rawGreetingMessage,
      isBot: true,
      timestamp: formatTimestamp(),
    };

    if (chatMode === "investment") {
      loadInvestmentQuestionnaire().then((questions) => {
        setQuestionnaire(questions);
        setCurrentQuestionIndex(0);
        setMessages([
          greetingMessage,
          {
            text: `Let's begin with the first question:\n\n${
              questions[0].text
            }\n${questions[0].options
              .map((opt, i) => `(${i + 1}) ${opt}`)
              .join("\n")}`,
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
      });
    } else if (chatMode === "insurance") {
      setInsuranceStage("choosePlan");
      setSelectedPlan(null);
      setUserAnswers([]);
      setCurrentQuestionIndex(0);

      setMessages([
        greetingMessage,
        {
          text: "📝 Before we continue, please pick the study‑abroad insurance plan that **looks right to you**. Click **Start** to open the plan table.",
          isBot: true,
          timestamp: formatTimestamp(),
          hasButton: true, // <‑‑ this shows the green button
        },
      ]);
      return;
      loadInsuranceQuestionnaire().then((questions) => {
        setQuestionnaire(questions);
        setMessages([
          greetingMessage,
          {
            text: `First question:\n\n${
              questions[0].text
            }\n${questions[0].options
              .map((opt, i) => `(${i + 1}) ${opt}`)
              .join("\n")}`,
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
      });
    } else {
      setMessages([greetingMessage]);
    }
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 800);
  };

  const buildInsuranceSystemPrompt = (persona, answers) => {
    const insuranceQuestions = [
      {
        text: "How concerned are you about medical emergencies and travel risks?",
        options: ["Low Concern", "Moderate Concern", "High Concern"],
      },
      {
        text: "How important is it for you to save money for other expenses?",
        options: ["Very Important", "Somewhat Important", "Not Important"],
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
    console.log("the answers are ");
    console.log(answers);
    const q1 = answers[0]; // Concern about risk
    const q2 = answers[1]; // Importance of saving money
    const q3 = answers[2]; // Lifestyle

    // Q1 → Concern
    const concernPlan =
      q1 === 1
        ? persona === "intro"
          ? "Secure Choice Plan"
          : "Lite Plan"
        : q1 === 2
        ? persona === "intro"
          ? "Comprehensive Shield Plan"
          : "Basic Plan"
        : "Comprehensive Shield Plan"; // default for high concern

    // Q2 → Saving Priority
    const savingPlan =
      q2 === 1
        ? persona === "intro"
          ? "Secure Choice Plan"
          : "Lite Plan"
        : q2 === 2
        ? persona === "intro"
          ? "Comprehensive Shield Plan"
          : "Basic Plan"
        : "Comprehensive Shield Plan"; // default for "not important"

    // Q3 → Lifestyle Risk
    const lifestylePlan = (() => {
      if (q3 === 1)
        return persona === "intro" ? "Secure Choice Plan" : "Lite Plan";
      if (q3 === 2 || q3 === 3 || q3 === 4)
        return persona === "intro" ? "Comprehensive Shield Plan" : "Basic Plan";
      return "Comprehensive Shield Plan";
    })();

    // Collect and count frequency
    const planCount = {};
    [concernPlan, savingPlan, lifestylePlan].forEach((plan) => {
      planCount[plan] = (planCount[plan] || 0) + 1;
    });

    // Find most common plan
    const mostCommonPlan = Object.entries(planCount).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0];
    
    let alternativePlan;
    if (mostCommonPlan === "Basic Plan") {
      alternativePlan = "Advanced Plan";
    } else if (mostCommonPlan === "Advanced Plan") {
      alternativePlan = "Basic Plan";
    } else if (mostCommonPlan === "Lite Plan"){
      alternativePlan = "Basic Plan"; 
    }else{
      alternativePlan = mostCommonPlan
    }
    
    const formattedAnswers = [
      `Q1: ${insuranceQuestions[0].text}\nA: ${
        insuranceQuestions[0].options[q1 - 1]
      }`,
      `Q2: ${insuranceQuestions[1].text}\nA: ${
        insuranceQuestions[1].options[q2 - 1]
      }`,
      `Q3: ${insuranceQuestions[2].text}\nA: ${
        insuranceQuestions[2].options[q3 - 1]
      }`,
    ].join("\n\n");
    
    return `
    Personality: ${persona === "intro" ? "Introverted" : "Extraverted"}
    User has completed the insurance questionnaire. And the following is the User's answer in the question and the most fitted insurance plan inferred from the questionnaire, please consider them to personalize the insurance recommendation to user.
    
    ${formattedAnswers}
    
    The most frequently fitted plan by the questionnaire is: **${mostCommonPlan}**
    
    This plan is valuable for recommendation. Also, consider the alternative plan: **${alternativePlan}**
    `;
    
  };

  // 流程：問卷 → LLM 介紹 RR1–RR5 → 引導 user 分配投資金額 → 結合 score+allocation 分析
  const handleSendMessage = async (event) => {
    event.preventDefault();
    // 如果對話已完成，則不處理訊息發送

    if (!inputText.trim() || isLoading) return;

    const formatTimestamp = () =>
      new Date().toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });

    if (isConversationComplete) return;

    if (
      inputText.trim().toUpperCase() === "FINAL" &&
      chatMode === "insurance" &&
      insuranceStage === "done" // user has finished the 3 questions
    ) {
      setInsuranceStage("choosePlanFinal");
      setMessages((prev) => [
        ...prev,
        {
          text: "Please choose your preferred insurance plan:",
          isBot: true,
          timestamp: formatTimestamp(),
          hasButton: true,
        },
      ]);
      setInputText("");
      return;
    }

    // ✏️ 問卷進行中
    if (
      chatMode === "investment" &&
      currentQuestionIndex < questionnaire.length
    ) {
      const index = parseInt(inputText.trim()) - 1;
      const currentQ = questionnaire[currentQuestionIndex];

      if (isNaN(index) || index < 0 || index >= currentQ.options.length) {
        setMessages((prev) => [
          ...prev,
          {
            text: "Please respond with 1–5.",
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
      } else {
        const allAnswers = [...userAnswers, index + 1];
        const isLast = currentQuestionIndex + 1 === questionnaire.length;
        setUserAnswers(allAnswers);

        const nextText = isLast
          ? `✅ Assessment complete. Your risk tolerance score: **${allAnswers.reduce(
              (a, b) => a + b,
              0
            )}**.`
          : `Next:\n${
              questionnaire[currentQuestionIndex + 1].text
            }\n${questionnaire[currentQuestionIndex + 1].options
              .map((opt, i) => `(${i + 1}) ${opt}`)
              .join("\n")}`;

        setMessages((prev) => [
          ...prev,
          { text: inputText, isBot: false, timestamp: formatTimestamp() },
          { text: nextText, isBot: true, timestamp: formatTimestamp() },
        ]);

        if (isLast) {
          setHasCompletedQuestionnaire(true);
          setIsLoading(true);

          try {
            setMessages((prev) => [
              ...prev,
              { text: risksIntro, isBot: true, timestamp: formatTimestamp() },
              {
                text:
                  personalityType === "intro"
                    ? introAllocation
                    : extroAllocation,
                isBot: true,
                timestamp: formatTimestamp(),
              },
              {
                text: "Please click the button below to start your NT$1,000,000 investment allocation: ",
                isBot: true,
                timestamp: formatTimestamp(),
                hasButton: true,
              },
            ]);
            setHasSeenProductIntro(true);
          } catch (e) {
            console.error(e);
          } finally {
            setIsLoading(false);
          }
        }
        setCurrentQuestionIndex((prev) => prev + 1);
      }
      setInputText("");
      return;
    }

    // INSURANCE QUESTIONNAIRE LOGIC (new)
    // ------------------------------------
    if (
      chatMode === "insurance" &&
      insuranceStage === "questionnaire" &&
      currentQuestionIndex < questionnaire.length
    ) {
      const index = parseInt(inputText.trim(), 10) - 1;
      const currentQ = questionnaire[currentQuestionIndex];

      if (isNaN(index) || index < 0 || index >= currentQ.options.length) {
        setMessages((prev) => [
          ...prev,
          {
            text: "Please respond with a valid option number.",
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
      } else {
        // Valid answer
        const allAnswers = [...userAnswers, index + 1];
        setUserAnswers(allAnswers);

        const isLast = currentQuestionIndex + 1 === questionnaire.length;
        setInputText("");

        setMessages((prev) => [
          ...prev,
          { text: inputText, isBot: false, timestamp: formatTimestamp() },
          !isLast
            ? {
                text: `Next:\n${
                  questionnaire[currentQuestionIndex + 1].text
                }\n${questionnaire[currentQuestionIndex + 1].options
                  .map((opt, i) => `(${i + 1}) ${opt}`)
                  .join("\n")}`,
                isBot: true,
                timestamp: formatTimestamp(),
              }
            : {
                text: "✅ Thanks! We've got all your answers. Let me analyze them...",
                isBot: true,
                timestamp: formatTimestamp(),
              },
        ]);

        if (isLast) {
          setHasCompletedQuestionnaire(true);
          setInsuranceStage("done");
          // promptInsuranceSelection();
          setIsLoading(true);

          const finalPrompt = getSystemPrompt(null, {}, allAnswers);
          const reqBody = {
            messages: [
              { role: "system", content: finalPrompt },
              {
                role: "user",
                content:
                  `The user initially chose **${selectedPlan}**.\n` +
                  `Here are the questionnaire answers. Please confirm whether ${selectedPlan} is still the best match or suggest a better plan and explain why according to the knowledge and instrcution in the system prompt, and please using the second person viewpoint in the respponse. Also place the alternative plan in the recommendation you can reference the system prompt for the alternative plan`, 
                  

              },
            ],
          };
          // const finalPrompt = getSystemPrompt(null, {}, allAnswers);
          console.log("Final system prompt:\n\n" + finalPrompt);
          try {
            const res = await fetch("http://140.119.19.195:5000/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(reqBody),
            });
            const data = await res.json();

            /* ---------- NEW: append a fixed note to the model's reply ---------- */
            const followUpNotes = {
              intro: `
The following are the FAQ:
(1) What are the main advantages and disadvantages of the **New Protection Plan**, the **Secure Choice Plan**, and the **Comprehensive Shield Plan**?  
(2) Could you briefly explain what the **Maximum Compensation per Insurance Period** and the **Deductible per Accident** mean for each plan and how they would affect my potential claims?  
(3) In the event of an accident in the US requiring me to return to Taiwan for medical treatment, which plan provides assistance for this situation?  
(4) Are there any specific exclusions or limitations that I should be aware of for each of these insurance plans?  
(5) If I have a pre-existing medical condition, how might that affect the coverage offered by these plans?  
            
If you are ready to select your final insurance please type **FINAL** in the input text field.  
            `,
              extra: ` 
The following are the FAQ:
(1). What are the main advantages and disadvantages of the **Lite Plan**, the **Basic Plan** and the **Advanced Plan**?  
(2) Could you briefly explain what the **Maximum Compensation per Insurance Period** and the **Deductible per Accident** mean for each plan and how they would affect my potential claims?  
(3) In the event of an accident in the US requiring me to return to Taiwan for medical treatment, which plan provides assistance for this situation?  
(4) Are there any specific exclusions or limitations that I should be aware of for each of these insurance plans?  
(5) If I have a pre-existing medical condition, how might that affect the coverage offered by these plans?  
            
If you are ready to select your final insurance please type **FINAL** in the input text field.  
            `,
            };
            const followUpNote =
              followUpNotes[personalityType] || followUpNotes.intro;

            const botMessage = data.response + followUpNote;
            /* ------------------------------------------------------------------- */

            setMessages((prev) => [
              ...prev,
              { text: botMessage, isBot: true, timestamp: formatTimestamp() },
            ]);
          } catch (err) {
            console.error(err);
            setMessages((prev) => [
              ...prev,
              {
                text: "❗️System error during insurance recommendation. Please try again later.",
                isBot: true,
                timestamp: formatTimestamp(),
              },
            ]);
          } finally {
            setIsLoading(false);
          }

          // setFinalInsurancePrompt(finalPrompt);

          // try {
          //   // Example call to your LLM endpoint
          //   const res = await fetch("http://140.119.19.195:5000/chat", {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify({
          //       messages: [
          //         { role: "system", content: finalPrompt },
          //         {
          //           role: "user",
          //           content: "Here are my answers. Please recommend a plan.",
          //         },
          //       ],
          //     }),
          //   });
          //   const data = await res.json();

          //   setMessages((prev) => [
          //     ...prev,
          //     {
          //       text: data.response,
          //       isBot: true,
          //       timestamp: formatTimestamp(),
          //     },
          //   ]);
          // } catch (error) {
          //   console.error("Insurance Q&A error:", error);
          //   setMessages((prev) => [
          //     ...prev,
          //     {
          //       text:
          //         "System error during insurance recommendation. Please try again later.",
          //       isBot: true,
          //       timestamp: formatTimestamp(),
          //     },
          //   ]);
          // } finally {
          //   setIsLoading(false);
          // }
        }

        setCurrentQuestionIndex((prev) => prev + 1);
      }

      // setInputText("");
      return;
    }

    if (
      chatMode === "investment" &&
      hasCompletedQuestionnaire &&
      hasSeenProductIntro &&
      !hasCompletedAllocation
    ) {
      setShowPopup(true);
      setInputText("");
      return;
    }

    // 一般聊天模式
    const userMessage = { role: "user", content: inputText };
    setMessages((prev) => [
      ...prev,
      { text: inputText, isBot: false, timestamp: formatTimestamp() },
    ]);

    // Check if the user has typed "FINAL" to request final allocation
    const isFinalRequested =
      chatMode === "investment" &&
      hasCompletedAllocation &&
      inputText.trim().toUpperCase() === "FINAL";

    if (isFinalRequested) {
      setHasFinalRequested(true);
      const finalMessage = {
        text: "You've requested to make your final investment allocation adjustments. Based on our recommendations, you can now modify your portfolio to create your final investment allocation. Remember to maintain a total of exactly NT$1,000,000 and respect the minimum investment units for each category.\n\nClick the button below to make your final adjustments:",
        isBot: true,
        timestamp: formatTimestamp(),
        hasSecondAllocationButton: true,
      };

      setInputText("");
      setMessages((prev) => [...prev, finalMessage]);
      return;
    }

    setInputText("");
    setIsLoading(true);

    // const prompt = getSystemPrompt(totalScore, userAllocation);
    const prompt =
      chatMode === "insurance" && finalInsurancePrompt
        ? finalInsurancePrompt
        : getSystemPrompt(totalScore, userAllocation);

    if (chatMode === "investment") {
      console.log("使用的完整 investment prompt: \n", prompt);
    }

    // 將全部訊息轉成 Chat API 格式
    const chatMessages = messages.map((msg) => ({
      role: msg.isBot ? "assistant" : "user",
      content: msg.text,
    }));

    // 找出第一個符合「風險分析」起始句的 index
    const firstAnalysisIndex = chatMessages.findIndex(
      (msg) =>
        msg.role === "assistant" &&
        RISK_SCORE_PREFIXES.some((prefix) => msg.content.startsWith(prefix))
    );

    // 如果找不到，就 fallback 用最後 10 則訊息（避免 crash）
    const slicedMessages =
      firstAnalysisIndex !== -1
        ? chatMessages.slice(firstAnalysisIndex)
        : chatMessages.slice(-10);

    // 建立 requestBody
    const requestBody = {
      messages: ensureAlternatingMessages([
        { role: "system", content: prompt },
        { role: "user", content: "Start chat" },
        ...slicedMessages,
        userMessage,
      ]),
    };
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    try {
      const res = await fetch("http://140.119.19.195:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();

      let botResponse = data.response;

      // 若是 investment 模式且使用者已完成第一次 allocation，就在回應後附加提示語
      if (
        chatMode === "investment" &&
        hasCompletedFirstAllocation &&
        !botResponse.includes("**Note:** You can now continue chatting with me")
      ) {
        botResponse +=
          '\n\n**Note:** You can now continue chatting with me about these investment recommendations. When you are ready to make your final investment allocation adjustments, simply type "FINAL" in the chat box.';
      }

      setMessages((prev) => [
        ...prev,
        { text: botResponse, isBot: true, timestamp: formatTimestamp() },
      ]);
    } catch (e) {
      console.error("Fetch error:", e);
      setMessages((prev) => [
        ...prev,
        {
          text: "❗️System error: The conversation history may be too long.",
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  // 確保每個 assistant message 搭配一個 user message
  const ensureAlternatingMessages = (messages) => {
    const result = [];

    for (let i = 0; i < messages.length; i++) {
      result.push(messages[i]);

      if (
        i < messages.length - 1 &&
        messages[i].role === "assistant" &&
        messages[i + 1].role === "assistant"
      ) {
        result.push({
          role: "user",
          content: "Please continue.",
        });
      }
    }
    return result;
  };

  const generateAllocationSummary = (allocation) => {
    return Object.entries(allocation)
      .map(([rr, amount]) => `- ${rr}: NT$${amount.toLocaleString()}`)
      .join("\n");
  };

  const calculateTotal = (allocation) => {
    return Object.values(allocation).reduce((sum, val) => sum + val, 0);
  };

  // 第二次配置的處理函數
  const handleSecondAllocation = () => {
    // Only proceed if user has requested final allocation by typing "FINAL"
    if (!hasFinalRequested) {
      return;
    }
    setIsSecondAllocation(true);
    setShowPopup(true);
  };

  // Called when the user picks a plan in the popup
  const handlePlanSelected = (plan) => {
    // FIRST round – coming from 'choosePlan'
    if (insuranceStage === "questionnaire" || insuranceStage === "choosePlan") {
      setInitialPlan(plan); // remember for later
      setSelectedPlan(plan);
      setShowInsurancePopup(false);
      setInsuranceStage("questionnaire");

      setMessages((prev) => [
        ...prev,
        {
          text: `✅ You picked **${plan}**.\n\nGreat! I have three quick follow‑up questions to fine‑tune the advice.`,
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);

      loadInsuranceQuestionnaire().then((qs) => {
        setQuestionnaire(qs);
        setCurrentQuestionIndex(0);
        setMessages((prev) => [
          ...prev,
          {
            text: `Question 1:\n${qs[0].text}\n${qs[0].options
              .map((o, i) => `(${i + 1}) ${o}`)
              .join("\n")}`,
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
      });
      return;
    }

    // SECOND round – coming from 'choosePlanFinal'
    if (insuranceStage === "choosePlanFinal") {
      setSelectedPlan(plan);
      setShowInsurancePopup(false);
      setIsConversationComplete(true);

      setMessages((prev) => [
        ...prev,
        {
          text:
            `✅ Final selection confirmed!\n\n` +
            `• **Initial choice:** ${initialPlan}\n` +
            `• **Final choice:** ${plan}\n\n` +
            `Thank you for completing the insurance process. Safe travels!`,
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);
    }
  };

  const handleAllocation = (allocation) => {
    setUserAllocation(allocation);
    setShowPopup(false);
    setHasCompletedAllocation(true);
    setIsLoading(true);

    const allocationSummary = generateAllocationSummary(allocation);
    const total = calculateTotal(allocation);

    const allocationMessage = `**Your Investment Allocation Summary:**\n\n${allocationSummary}\n\nTotal: NT$${total.toLocaleString()}`;

    setMessages((prev) => [
      ...prev,
      { text: allocationMessage, isBot: true, timestamp: formatTimestamp() },
    ]);

    const recommendations =
      personalityType === "intro"
        ? getIntroFixedRecommendations(totalScore, allocation)
        : getExtroFixedRecommendations(totalScore, allocation);

    const recommendationText =
      personalityType === "intro"
        ? generateIntroRecommendationText(totalScore, recommendations)
        : generateExtroRecommendationText(totalScore, recommendations);

    setLlmRecommendation(recommendations);
    console.log("LLM 建議的 allocation:", recommendations);

    // Add note about continuing the conversation
    const responseWithNote =
      recommendationText +
      '\n\n**Note:** You can now continue chatting with me about these investment recommendations. When you are ready to make your final investment allocation adjustments based on these recommendations, simply type "FINAL" in the chat box and I\'ll provide a button for you to proceed with your final allocation.';

    // Add the recommendations to the message history
    setMessages((prev) => [
      ...prev,
      {
        text: responseWithNote,
        isBot: true,
        timestamp: formatTimestamp(),
      },
    ]);

    setIsLoading(false);
  };

  // 保存投資配置的邏輯 (抽象為一個獨立函數)
  const handleSaveAllocation = (newAllocation) => {
    // 檢查並記錄數據
    console.log("風險評分:", totalScore, "新分配:", newAllocation);

    // 如果是第二次配置，則需要特殊處理
    if (isSecondAllocation) {
      setUserAllocation(newAllocation);
      setShowPopup(false);
      setIsSecondAllocation(false);
      setHasFinalRequested(false);

      // 生成分配摘要訊息
      const allocationSummary = generateAllocationSummary(newAllocation);
      const total = calculateTotal(newAllocation);

      const allocationMessage = `**Your Final Investment Allocation:**\n\n${allocationSummary}\n\nTotal: NT$${total.toLocaleString()}\n\n✅ **Your investment allocation process is now complete. Thank you for using our service!**`;

      // 添加分配摘要到訊息列表 並標記對話完成
      setMessages((prev) => [
        ...prev,
        { text: allocationMessage, isBot: true, timestamp: formatTimestamp() },
      ]);

      // 標記對話已完成
      setIsConversationComplete(true);
    } else {
      // 第一次配置的原始邏輯
      handleAllocation(newAllocation);
      setHasCompletedFirstAllocation(true);
    }
  };

  // UI
  return (
    <div className="w-full h-screen bg-gray-200 relative">
      {/* 通知訊息 */}
      <Notification show={showNotification} />
      {/* Header */}
      <div className="w-full bg-white shadow">
        <div className="w-full px-8 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">LLM Chatbot v2</h1>
          <div className="flex items-center gap-4">
            <select
              value={chatMode}
              onChange={(e) => setChatMode(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="chat">Chat</option>
              <option value="investment">Investment</option>
              <option value="insurance">Insurance</option>
            </select>
            <select
              value={personalityType}
              onChange={(e) => setPersonalityType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="intro">1</option>
              <option value="extra">2</option>
            </select>
            <button
              onClick={handleSubmitSettings}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Submit
            </button>

            {showPopup && (
              <InvestmentPopup
                personalityType={personalityType}
                onClose={() => {
                  setShowPopup(false);
                  setIsSecondAllocation(false);
                  setHasFinalRequested(false);
                }}
                onSave={handleSaveAllocation}
                recommendations={isSecondAllocation ? llmRecommendation : {}}
                isSecondAllocation={isSecondAllocation}
                initialAllocation={isSecondAllocation ? userAllocation : {}}
              />
            )}
            {showInsurancePopup && (
              <InsurancePopup
                initialPlan={initialPlan}
                personalityType={personalityType}
                onClose={() => setShowInsurancePopup(false)}
                onSelect={(plan) => handlePlanSelected(plan)}
                timesOpened={insurancePopupCount}
                // onSelect={(plan) => {
                //   setShowInsurancePopup(false);
                //   setMessages((prev) => [
                //     ...prev,
                //     {
                //       text: `You selected the **${plan}**.`,
                //       isBot: true,
                //       timestamp: formatTimestamp(),
                //     },
                //   ]);
                // }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div
        className="w-full overflow-y-auto px-8 py-6"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <div className="w-full" style={{ whiteSpace: "pre-line" }}>
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8 text-xl">
              Start Your Chat Here！
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              // onButtonClick={() => message.hasButton && setShowPopup(true)}
              onButtonClick={() => {
                // if (message.hasSecondAllocationButton) {
                //   handleSecondAllocation();
                // } else if (chatMode === "insurance" && insuranceStage === "choosePlan") {
                //   setShowInsurancePopup(true);
                //   // setInsurancePopupOpenCount((prev) => prev + 1);
                // } else if (message.hasButton) {
                //   setShowPopup(true);
                // }

                if (message.hasSecondAllocationButton) {
                  handleSecondAllocation();
                  return;
                }

                if (chatMode === "insurance" && message.hasButton) {
                  // In any insurance stage, the green button opens the plan‑selection popup
                  setInsurancePopupCount((c) => c + 1);
                  setShowInsurancePopup(true);
                  return;
                }

                if (message.hasButton) {
                  // Investment flow
                  setShowPopup(true);
                }
              }}
              handleSecondAllocation={handleSecondAllocation}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white">
        {isConversationComplete ? (
          <div className="bg-green-50 p-4 border-t border-green-200">
            <div className="max-w-[800px] mx-auto text-center text-green-700 flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-lg font-medium">
                Test completed, thank you for using our service.
              </span>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSendMessage}
            className="relative max-w-[800px] mx-auto px-4 py-4"
          >
            <input
              type="text"
              className="w-full text-lg bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 pr-14 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
              placeholder={
                isConversationComplete ? "您的投資配置已完成" : "輸入訊息..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              // disabled={isLoading || isConversationComplete}
              disabled={
                isConversationComplete ||
                (isLoading && chatMode !== "insurance") // keep lock for other modes
              }
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`absolute right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl ${
                isLoading
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150"
              }`}
            >
              <SendIcon />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
