import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { loadInvestmentQuestionnaire } from "../utils/loadQuestionnaire";
import { loadInsuranceQuestionnaire } from "../utils/loadInsuranceQuestionnaire"; // <-- NEW
import { risksIntro } from "../utils/risksIntro";
import { introAllocation } from "../utils/introAllocation";
import { extroAllocation } from "../utils/extroAllocation";
import InvestmentPopup from "./InvestmentPopup";
import { introRcmdPrompt } from '../utils/introRcmdPrompt';
import { extroRcmdPrompt } from '../utils/extroRcmdPrompt';
import { extractRecommendationsFromLLMResponse } from '../utils/extractRecommendations';
import InsurancePopup from './InsurancePopup';



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
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);
  const [hasSeenProductIntro, setHasSeenProductIntro] = useState(false);
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
        hasButton: true
      }
    ]);
  };
  
  const getSystemPrompt = (score = null, allocation = userAllocation, tempAnswers = userAnswers) => {
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
      intro: (score, allocation) => 
    `Scenario:
      You are a thoughtful, detail-oriented investment advisor who prioritizes stability and calculated growth. Your role is to guide users through investment product categories and help them build a risk-aligned portfolio.

      First of all, the user has been asked to allocate a hypothetical NT$1,000,000 across available investment products. Their current allocation is as follows:
      ${total === 0
        ? "Their allocation has not been provided yet."
        : Object.entries(allocation)
            .filter(([_, v]) => v > 0)
            .map(([rr, val]) => `- ${rr}: NT$${val.toLocaleString()} (${percent(val)})`)
            .join("\n")
      }
      Please carefully review this allocation and consider how it aligns with the user's risk tolerance score.

      Secondly, based on the user's risk tolerance score of **${score}**, determine whether their current allocation is:
      - too aggressive (should reduce exposure to high-risk funds)
      - too conservative (should consider increasing allocation to higher-return options)
      - well-aligned (can maintain current distribution)

      For each RR category the user has chosen, give a recommendation:
        - Maintain current level ✅
        - Increase investment ⬆️
        - Reduce investment ⬇️

      Then explain *why*, using plain language and tying it back to their score and the characteristics of each fund category.
      You may use the following product guidance along with the user's score to support your decisions:

      - **Risk Score 10–15 (Low Risk)**:
        - Franklin Templeton Sinoam Money Market Fund (RR1) (Unit Size: NT$10,000)
        - BlackRock Global Government Bond Fund A2 (RR2) (Unit Size: NT$50,000)

      - **Risk Score 16–30 (Moderate Risk)**:
        - BlackRock Global Government Bond Fund A2 (RR2) (Unit Size: NT$50,000)
        - Schroder International Selection Fund Global Multi-Asset Balanced (RR3) (Unit Size: NT$100,000)
        - JPMorgan Funds - Europe Equity Fund A (acc) - USD (RR4) (Unit Size: NT$150,000)

      - **Risk Score 31–50 (High Risk)**:
        - Schroder International Selection Fund Global Multi-Asset Balanced (RR3) (Unit Size: NT$100,000)
        - JPMorgan Funds - Europe Equity Fund A (acc) - USD (RR4) (Unit Size: NT$150,000)
        - Invesco Global Equity Income Fund A USD (RR5) (Unit Size: NT$300,000) 

      💡 Note: "Unit size" means the investment amount must be a multiple of that number (e.g., NT$10,000, NT$20,000... for RR1). Avoid recommending values that are not valid units.    
      Your goal is to help them understand not just the "what" but also the "why"—build confidence in their investment decisions.
    `,
    
      extra: (score) => `Scenario:
    You are a dynamic and engaging investment advisor who enjoys encouraging users to explore high-potential opportunities. Your task is to educate users about our investment product types and guide them to build portfolios aligned with their risk personality.
    
    First of all, the user has just played portfolio manager with a virtual NT$1,000,000! 🎯  
    Here's how they've allocated it across available products:
    ${total === 0
      ? "Their allocation has not been provided yet."
      : Object.entries(allocation)
          .filter(([_, v]) => v > 0)
          .map(([rr, val]) => `- ${rr}: NT$${val.toLocaleString()} (${percent(val)})`)
          .join("\n")
    }
    Your job: Celebrate their effort 👏, then review whether this matches their actual risk profile!

    Second, based on the user's risk tolerance score of **${score}**, decide whether their current allocation is:
    - too aggressive (may need to scale back on high-risk plays)  
    - too conservative (may have more room to explore higher returns)  
    - well-aligned (great balance, let's keep it rolling)

    For each RR category the user invested in, provide a simple call:
      - ✅ Maintain  
      - ⬆️ Increase  
      - ⬇️ Reduce  

    Use exciting but grounded explanations—why this fits (or doesn't fit) their score, and what kind of investor this choice supports.

    🔥 Product Guidance – Match ideas to their risk score:

    - **Score 10–15 (Low Risk)**:
      - Schroder Global High Yield Bond Fund A1 (RR2) (Unit Size: NT$50,000)
      - PineBridge Preferred Securities Income Fund (RR3) (Unit Size: NT$100,000)

    - **Score 16–30 (Moderate Risk)**:
      - PineBridge Preferred Securities Income Fund (RR3) (Unit Size: NT$100,000)
      - FSITC China Century Fund-TWD (RR4)  (Unit Size: NT$150,000)
      - Franklin Templeton Investment Funds - Franklin Innovation Fund Class A (acc) USD (RR5) (Unit Size: NT$300,000)

    - **Score 31–50 (High Risk)**:
      - FSITC China Century Fund-TWD (RR4)  (Unit Size: NT$150,000)
      - Franklin Templeton Investment Funds - Franklin Innovation Fund Class A (acc) USD (RR5) (Unit Size: NT$300,000)

    💡 *Note: Unit size means you can only invest in multiples of that amount (e.g., RR3 = NT$100,000, NT$200,000, etc). Please avoid suggesting invalid values.*

    End with an upbeat note—remind them that bold doesn't mean reckless, and that they're building something exciting, one smart choice at a time.`
    };

    // Insurance mode 的 Scenario
    const insuranceScenarios = {
        intro: `Scenario:
    You are a meticulous and risk-conscious insurance advisor, focused on providing comprehensive and secure insurance solutions. Your role is to deeply understand the three study-abroad insurance plans: New Protection Plan, Secure Choice Plan, and Comprehensive Shield PlanPlan.
    
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
 
Given the reality of limited resources and the presence of potential risks, you are encouraged to carefully evaluate each plan’s coverage and cost structure, and select the one that best supports a smooth and secure study abroad experience.

    
    Your goal is to carefully analyze the insurance plans, summarize their features in a structured and detail-oriented way, and prepare a professional explanation to help customers understand why opting for a more comprehensive plan is beneficial for their safety and well-being. Ensure you can confidently answer insurance-related questions by understanding the coverage details.`,
    
        extra: `Scenario:
    You are an outgoing and persuasive insurance advisor, skilled in engaging conversations and making compelling recommendations. Your task is to understand the details of three study-abroad insurance plans: Lite Plan, Basic Plan, and Advanced Plan.
    
    Focus on cost-effectiveness and flexibility.
    Highlight how the basic protection is sufficient for most risks, making budget-friendly options attractive.
    Emphasize savings while ensuring students have essential coverage.
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
      const derivedPrompt = buildInsuranceSystemPrompt(personalityType, tempAnswers);
      return `${insuranceScenarios[personalityType]}\n\n${personalityInstructions[personalityType]}\n\n${derivedPrompt}`;
      // }
      return `${insuranceScenarios[personalityType]}\n\n${personalityInstructions[personalityType]}`;
    } else if (chatMode === "investment"){
      // Call the function with the score parameter
      return `${investmentScenarios[personalityType](score, allocation)}\n\n${personalityInstructions[personalityType]}`;
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
        extra:  `Hey there! Great to meet you! I'm excited to chat with you today. We have three fun things to do:
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
                Let's kick it off with the risk assessment—ready to roll? Let's do this! 💥`
      },

      insurance: {
        intro:  `Hello, and thank you for being here. In this session, we will go through three steps:
                (1) I will introduce an Choice insurance plan with a focus on risk management
                (2) We will carefully review key policy terms
                (3) I will answer any questions you may have in a precise and structured way
                I'll provide the necessary details clearly, so let's start by looking at the policy overview.
                Below are the one of the three types of our Overseas Insurance Plan:  
                The Secure Choice Plan provides moderate protection and is suitable for individuals who want to have a balance between coverage and cost. It offers accident insurance with a coverage limit of NT$5 million, which is higher than the Lite Plan but lower than the  Secure Plan. Additionally, it covers overseas injury medical insurance with a reimbursement cap of NT$500,000, which is higher than the Lite Plan but lower than the Overseas Advanced Plan. The plan also covers overseas sudden illness - hospitalization with a reimbursement cap of NT$150,000, which is lower than the Overseas Advanced Plan. Furthermore, it covers overseas sudden illness - outpatient with a reimbursement cap of NT$1,000, which is lower than the Overseas Advanced Plan. The plan also includes emergency assistance with a coverage limit of NT$1 million, which is the same as the Overseas Lite Plan. Lastly, it covers third-party liability with a coverage limit of NT$1.5 million for injury and NT$200,000 for property damage, which is higher than the Overseas Lite Plan. Overall, the Overseas Choice Plan provides a moderate level of protection and is suitable for individuals who want to have a balance between coverage and cost.`,

        extra: `Hi there! I'm really glad you're here! We're going to explore an Basic insurance plan together in three steps:
                (1) I'll introduce the plan and highlight how flexible and useful it is
                (2) We'll discuss important terms in a way that makes sense to you
                (3) You can ask me anything—I love answering questions!
                Let's jump in and see how this plan could work for you!                
                Below are the one of the three types of our Overseas Insurance Plan:
                Hi there! I'm thrilled to introduce you to our Basic Plan. This plan offers a perfect balance between cost and coverage, making it an excellent choice for students who want to have peace of mind while studying abroad. With the Basic Plan, you'll enjoy comprehensive protection against various risks and uncertainties. It provides coverage up to NT$3 million for accidental death or disability, ensuring that you're well-protected in case of any unforeseen events. Additionally, the plan offers reimbursement caps of NT$400,000 for overseas injury medical insurance and NT$100,000 for overseas sudden illness - hospitalization. These caps provide financial support in case you require medical treatment or hospitalization while studying abroad. The plan also includes coverage for emergency assistance, third-party liability for both injury and property damage, and overseas sudden illness - outpatient care. With the Basic Plan, you'll have the freedom to focus on your studies and enjoy your time abroad without worrying about the financial implications of unexpected events. So, if you're looking for a plan that offers excellent protection at a reasonable cost, the Basic Plan is definitely worth considering!`,
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
            text: `Let's begin with the first question:\n\n${questions[0].text}\n${questions[0].options.map(
              (opt, i) => `(${i + 1}) ${opt}`
            ).join("\n")}`,
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
      });
    }
    else if (chatMode === "insurance") {
      loadInsuranceQuestionnaire().then((questions) => {
        setQuestionnaire(questions);
        setMessages([
          greetingMessage,
          {
            text: `First question:\n\n${questions[0].text}\n${questions[0].options
              .map((opt, i) => `(${i + 1}) ${opt}`)
              .join("\n")}`,
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
      });
    }
    else{
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
    console.log('the answers are ')
    console.log(answers)
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
        return persona === "intro"
          ? "Secure Choice Plan"
          : "Lite Plan";
      if (q3 === 2 || q3 === 3 || q3 === 4)
        return persona === "intro"
          ? "Comprehensive Shield Plan"
          : "Basic Plan";
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
    const formattedAnswers = [
      `Q1: ${insuranceQuestions[0].text}\nA: ${insuranceQuestions[0].options[q1 - 1]}`,
      `Q2: ${insuranceQuestions[1].text}\nA: ${insuranceQuestions[1].options[q2 - 1]}`,
      `Q3: ${insuranceQuestions[2].text}\nA: ${insuranceQuestions[2].options[q3 - 1]}`,
    ].join("\n\n");

  
  
    return `
   Personality: ${persona === "intro" ? "Introverted" : "Extraverted"}
  User has completed the insurance questionnaire. And the folowing is the User's answer in the question and the most fitted insurance plan inferred from the questionaire, please cosider them to personalize the insurance recommendation to user.
  
  ${formattedAnswers}
  
   The most frequently fitted plan by the questionaire is: **${mostCommonPlan}**  
  
  `;
  };

  
// 流程：問卷 → LLM 介紹 RR1–RR5 → 引導 user 分配投資金額 → 結合 score+allocation 分析
  const handleSendMessage = async (event) => {
    event.preventDefault();
    // 如果對話已完成，則不處理訊息發送

    
    
    if (!inputText.trim() || isLoading) return;

    const formatTimestamp = () => new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });

    if (isConversationComplete) return;

    if (inputText.trim().toLowerCase() === "finish interaction!!!") {
      setMessages((prev) => [
        ...prev,
        {
          text: "Please choose your preferred insurance plan:",
          isBot: true,
          timestamp: formatTimestamp(),
          hasButton: true
        }
      ]);
      setInputText("");
      return;
    }

    // ✏️ 問卷進行中
    if (chatMode === "investment" && currentQuestionIndex < questionnaire.length) {
      const index = parseInt(inputText.trim()) - 1;
      const currentQ = questionnaire[currentQuestionIndex];

      if (isNaN(index) || index < 0 || index >= currentQ.options.length) {
        setMessages((prev) => [...prev, { text: "Please respond with 1–5.", isBot: true, timestamp: formatTimestamp() }]);
      } else {
        const allAnswers = [...userAnswers, index + 1];
        const isLast = currentQuestionIndex + 1 === questionnaire.length;
        setUserAnswers(allAnswers);


        const nextText = isLast
        ? `✅ Assessment complete. Your risk tolerance score: **${allAnswers.reduce((a, b) => a + b, 0)}**.`
        : `Next:\n${questionnaire[currentQuestionIndex + 1].text}\n${questionnaire[currentQuestionIndex + 1].options.map((opt, i) => `(${i + 1}) ${opt}`).join("\n")}`;
        
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
              { text: personalityType === "intro" ? introAllocation : extroAllocation, isBot: true, timestamp: formatTimestamp() },
              { 
                text: "Please click the button below to start your NT$1,000,000 investment allocation: ",
                isBot: true, 
                timestamp: formatTimestamp(),
                hasButton: true
              }
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
    currentQuestionIndex < questionnaire.length
  ) {
    const index = parseInt(inputText.trim(), 10) - 1;
    const currentQ = questionnaire[currentQuestionIndex];

    if (
      isNaN(index) ||
      index < 0 ||
      index >= currentQ.options.length
    ) {
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

      setMessages((prev) => [
        ...prev,
        { text: inputText, isBot: false, timestamp: formatTimestamp() },
        !isLast
          ? {
              text: `Next:\n${questionnaire[currentQuestionIndex + 1].text}\n${questionnaire[currentQuestionIndex + 1].options
                .map((opt, i) => `(${i + 1}) ${opt}`)
                .join("\n")}`,
              isBot: true,
              timestamp: formatTimestamp(),
            }
          : {
              text: "✅ Thanks! We’ve got all your answers. Let me analyze them...",
              isBot: true,
              timestamp: formatTimestamp(),
            },
      ]);

      if (isLast) {
        setHasCompletedQuestionnaire(true);
        promptInsuranceSelection();
        // setIsLoading(true);

      
        // const finalPrompt = getSystemPrompt(); // Will include base + derived content
        const finalPrompt = getSystemPrompt(null, {}, allAnswers);
        console.log("Final system prompt:\n\n" + finalPrompt);
        setFinalInsurancePrompt(finalPrompt);

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

    setInputText("");
    return;
  }

    // 處理投資分配格式
    if (
      chatMode === "investment" &&
      hasCompletedQuestionnaire &&
      hasSeenProductIntro &&
      !hasCompletedAllocation 
      // &&
      // inputText !== "allocate"
    ) {
      setShowPopup(true);
      setInputText("");
      return;
    }

    // 一般聊天模式
    const userMessage = { role: "user", content: inputText };
    setMessages((prev) => [...prev, { text: inputText, isBot: false, timestamp: formatTimestamp() }]);
    
    // Check if the user has typed "FINAL" to request final allocation
    const isFinalRequested = chatMode === "investment" && 
                            hasCompletedAllocation && 
                            inputText.trim().toUpperCase() === "FINAL";
    
    if (isFinalRequested) {
      setHasFinalRequested(true);
      const finalMessage = {
        text: "You've requested to make your final investment allocation adjustments. Based on our recommendations, you can now modify your portfolio to create your final investment allocation. Remember to maintain a total of exactly NT$1,000,000 and respect the minimum investment units for each category.\n\nClick the button below to make your final adjustments:",
        isBot: true,
        timestamp: formatTimestamp(),
        hasSecondAllocationButton: true
      };
      
      setInputText("");
      setMessages(prev => [...prev, finalMessage]);
      return;
    }
    
    setInputText("");
    setIsLoading(true);

    // const prompt = getSystemPrompt(totalScore, userAllocation);
    const prompt =
      chatMode === "insurance" && finalInsurancePrompt
        ? finalInsurancePrompt
        : getSystemPrompt(totalScore, userAllocation);

    const requestBody = {
      messages: ensureAlternatingMessages([
        { role: "system", content: prompt },
        //Start chat很重要，拿掉會跑不了
        { role: "user", content: "Start chat" },
        ...messages.map((msg) => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.isBot ? msg.text : `${msg.text}`,
        }))
        .filter((_, i) => i < 1 || i > 26),
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

      setMessages((prev) => [...prev, { text: data.response, isBot: true, timestamp: formatTimestamp() }]);
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
      .join('\n');
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
  
  
  // 處理投資配置的邏輯
  const handleAllocation = (allocation) => {
    // 檢查並記錄數據
    console.log('風險評分:', totalScore, '分配:', allocation);
        
    // 根據 personalityType 選擇合適的 prompt
    const recPrompt = personalityType === "intro" 
      ? introRcmdPrompt(totalScore, allocation)
      : extroRcmdPrompt(totalScore, allocation);

    setUserAllocation(allocation);
    setShowPopup(false);
    setHasCompletedAllocation(true);
    setIsLoading(true);
    
    const allocationSummary = generateAllocationSummary(allocation);
    const total = calculateTotal(allocation);
    
    const allocationMessage = `**Your Investment Allocation Summary:**\n\n${allocationSummary}\n\nTotal: NT$${total.toLocaleString()}`;
    
    setMessages(prev => [
      ...prev,
      { text: allocationMessage, isBot: true, timestamp: formatTimestamp() }
    ]);
    
    const requestBody = {
      messages: [
        { role: "system", content: recPrompt },
        { role: "user", content: "Review my investment allocation and provide balanced recommendations. For each increase you suggest, you MUST recommend a corresponding decrease elsewhere to maintain exactly NT$1,000,000 total. Be precise with amounts and ensure they respect the minimum investment units." },
      ],
    };
    console.log('recommendationPrompt是：', requestBody)
    fetch("http://140.119.19.195:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
    .then(res => res.json())
    .then(data => {
      // 提取建議重點
      const recommendations = extractRecommendationsFromLLMResponse(data.response, allocation);
      setLlmRecommendation(recommendations);
      console.log('recommendations重點', recommendations)

      const responseWithNote = data.response + "\n\n**Note:** You can now continue chatting with me about these investment recommendations. When you are ready to make your final investment allocation adjustments based on these recommendations, simply type \"FINAL\" in the chat box and I'll provide a button for you to proceed with your final allocation.";

      setMessages(prev => [
        ...prev,
        { 
          text: responseWithNote, 
          isBot: true, 
          timestamp: formatTimestamp()
        }
      ]);
    })
    .catch(e => console.error(e))
    .finally(() => setIsLoading(false));
  };
  
  // 保存投資配置的邏輯 (抽象為一個獨立函數)
  const handleSaveAllocation = (newAllocation) => {
    // 檢查並記錄數據
    console.log('風險評分:', totalScore, '新分配:', newAllocation);
    
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
      setMessages(prev => [
        ...prev,
        { text: allocationMessage, isBot: true, timestamp: formatTimestamp() }
      ]);
      
      // 標記對話已完成
      setIsConversationComplete(true);
    } else {
      // 第一次配置的原始邏輯
      handleAllocation(newAllocation);
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

            {showPopup && <InvestmentPopup 
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
            />}
            {showInsurancePopup && (
  <InsurancePopup
    personalityType={personalityType} 
    onClose={() => setShowInsurancePopup(false)} 
    onSelect={(plan) => {
      setShowInsurancePopup(false);
      setMessages((prev) => [
        ...prev,
        {
          text: `You selected the **${plan}**.`,
          isBot: true,
          timestamp: formatTimestamp()
        }
      ]);
    }}
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
        <div className="w-full">
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
                if (message.hasSecondAllocationButton) {
                  handleSecondAllocation();
                } else if (message.hasButton && chatMode === "insurance") {
                  setShowInsurancePopup(true);
                } else if (message.hasButton) {
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-lg font-medium">Test completed, thank you for using our service.</span>
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
              placeholder={isConversationComplete ? "您的投資配置已完成" : "輸入訊息..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              // disabled={isLoading || isConversationComplete}
              disabled={
                   isConversationComplete ||
                   (isLoading && chatMode !== "insurance")  // keep lock for other modes
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
