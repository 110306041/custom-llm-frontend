import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { loadInvestmentQuestionnaire } from "../utils/loadQuestionnaire";
import { introAllocation } from "../utils/introAllocation";
import { extroAllocation } from "../utils/extroAllocation";
import { risksIntro } from "../utils/risksIntro";


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
const ChatMessage = ({ message }) => {
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
  const [userAllocation, setUserAllocation] = useState({
    RR1: 0,
    RR2: 0,
    RR3: 0,
    RR4: 0,
    RR5: 0,
  });
  const totalScore = useMemo(() => {
    return userAnswers.reduce((a, b) => a + b, 0);
  }, [userAnswers]);
  

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

  const getSystemPrompt = (score = null, allocation = userAllocation) => {
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
      (1) First, briefly introduce the five investment product risk categories.
        Please list them **one per line**, using the following format:
      "🟢 RR1: Ultra-conservative – Money market and time deposits"

      Do **not** merge all categories into one paragraph.
      Use a **line break after each category** to improve readability.
      Use the following emoji to represent risk levels: 
      - 🟢 Low Risk  
      - 🟡 Moderate Risk  
      - 🔴 High Risk  
      - 🚨 Very High Risk  

      Example format:
      🟢 RR1: Ultra-conservative – Money market and time deposits  
      🟢 RR2: Low-risk – Bond funds with stable returns  
      🟡 RR3: Moderate-risk – Balanced or bond-heavy funds  
      🔴 RR4: High-risk – Growth funds (regional or thematic)  
      🚨 RR5: Very high-risk – Emerging market or sector-focused

      (2) The user has been asked to allocate a hypothetical NT$1,000,000 across available investment products. Their current allocation is as follows:
      ${total === 0
        ? "Their allocation has not been provided yet."
        : Object.entries(allocation)
            .filter(([_, v]) => v > 0)
            .map(([rr, val]) => `- ${rr}: NT$${val.toLocaleString()} (${percent(val)})`)
            .join("\n")
      }
      Please carefully review this allocation and consider how it aligns with the user's risk tolerance score.

      (3) Based on the user's risk tolerance score of **${score}**, determine whether their current allocation is:
      - too aggressive (should reduce exposure to high-risk funds)
      - too conservative (should consider increasing allocation to higher-return options)
      - well-aligned (can maintain current distribution)

      For each RR category the user has chosen, give a recommendation:
        - Maintain current level ✅
        - Increase investment ⬆️
        - Reduce investment ⬇️

      Then explain *why*, using plain language and tying it back to their score and the characteristics of each fund category.
      You may use the following product guidance to support your decisions:

      - **Risk Score 10–15 (Low Risk)**:
        - Franklin Templeton Sinoam Money Market (RR1): Unit size NT$10,000 – Capital-preserving
        - PGIM Return Fund (RR2): Unit size NT$20,000 – Stable growth

      - **Risk Score 16–30 (Moderate Risk)**:
        - FSITC Greater China Balanced (RR3): Unit size NT$50,000 – Balanced exposure
        - Capital OTC N (RR4): Unit size NT$100,000 – Gradual risk exposure

      - **Risk Score 31–50 (High Risk)**:
        - Capital OTC N (RR4): Unit size NT$100,000 – Growth opportunities
        - Fuh Hwa Emerging Market Short-term Income Fund (RR5): Unit size NT$150,000 – High-growth potential from emerging markets

      💡 Note: "Unit size" means the investment amount must be a multiple of that number (e.g., NT$10,000, NT$20,000... for RR1). Avoid recommending values that are not valid units.    
      Your goal is to help them understand not just the "what" but also the "why"—build confidence in their investment decisions.
    `,
    
      extra: (score) => `Scenario:
    You are a dynamic and engaging investment advisor who enjoys encouraging users to explore high-potential opportunities. Your task is to educate users about our investment product types and guide them to build portfolios aligned with their risk personality.
    
    (1) Start by breaking down the five risk levels (RR1–RR5) with flair and clarity.  
    Use the following format, **one per line**, to keep things clean and exciting:

    🟢 RR1: Ultra-safe – Cash-like products with very low volatility  
    🟢 RR2: Low-risk – Bond funds with steady growth  
    🟡 RR3: Moderate-risk – Balanced funds with growth potential  
    🔴 RR4: High-risk – Growth strategies, higher return potential  
    🚨 RR5: Very high-risk – Emerging markets or global high-volatility plays

    (2) The user has just played portfolio manager with a virtual NT$1,000,000! 🎯  
    Here’s how they’ve allocated it across available products:
    ${total === 0
      ? "Their allocation has not been provided yet."
      : Object.entries(allocation)
          .filter(([_, v]) => v > 0)
          .map(([rr, val]) => `- ${rr}: NT$${val.toLocaleString()} (${percent(val)})`)
          .join("\n")
    }
    Your job: Celebrate their effort 👏, then review whether this matches their actual risk profile!

    (3) Based on the user's risk tolerance score of **${score}**, decide whether their current allocation is:
    - too aggressive (may need to scale back on high-risk plays)  
    - too conservative (may have more room to explore higher returns)  
    - well-aligned (great balance, let’s keep it rolling)

    For each RR category the user invested in, provide a simple call:
      - ✅ Maintain  
      - ⬆️ Increase  
      - ⬇️ Reduce  

    Use exciting but grounded explanations—why this fits (or doesn’t fit) their score, and what kind of investor this choice supports.

    🔥 Product Guidance – Match ideas to their risk score:

    - **Score 10–15 (Low Risk)**:
      - Fuh Hwa 2.5–5 Year Maturity A-Rated Bond Fund (RR2): Unit size NT$50,000 – Steady returns, confidence builder
      - Fuh Hwa Aegis (RR3): Unit size NT$100,000 – Adds a touch of growth without losing control

    - **Score 16–30 (Moderate Risk)**:
      - Fuh Hwa Aegis (RR3): Unit size NT$100,000 – Well-rounded exposure
      - SinoPac Pilot Fund (RR4): Unit size NT$200,000 – Controlled aggression
      - Partial allocation to Fuh Hwa South Africa ZAR Fund (RR5): Unit size NT$300,000 – Emerging market spice!

    - **Score 31–50 (High Risk)**:
      - SinoPac Pilot Fund (RR4): Unit size NT$200,000 – Go big or go home!
      - Fuh Hwa South Africa Fixed-Income ZAR Fund (RR5): Unit size NT$300,000 – High-octane, high-reward

    💡 *Note: Unit size means you can only invest in multiples of that amount (e.g., RR3 = NT$100,000, NT$200,000, etc). Please avoid suggesting invalid values.*

    End with an upbeat note—remind them that bold doesn’t mean reckless, and that they’re building something exciting, one smart choice at a time.`
    };

    // Insurance mode 的 Scenario
    const insuranceScenarios = {
        intro: `Scenario:
    You are a meticulous and risk-conscious insurance advisor, focused on providing comprehensive and secure insurance solutions. Your role is to deeply understand the three study-abroad insurance plans: Overseas Light Plan, Overseas Basic Plan, and Overseas Advanced Plan.
    
    Focus on comprehensive coverage and the ability to handle uncertainties.
    Highlight the advantages of higher protection, even if the premium is slightly higher.
    Emphasize the long-term benefits of stronger financial security and peace of mind.
    Insurance Coverage Details:
    Each plan provides coverage across multiple categories, with key differences in protection levels:
    
    1. Accident Insurance (Death/Disability)
    Overseas Light Plan: NT$3 million
    Overseas Basic Plan: NT$5 million
    Overseas Advanced Plan: NT$8 million
    
    2. Overseas Injury Medical Insurance (Reimbursement Cap)
    Overseas Light Plan: NT$300,000
    Overseas Basic Plan: NT$500,000
    Overseas Advanced Plan: NT$800,000
    
    3. Overseas Sudden Illness – Hospitalization (Reimbursement Cap)
    Overseas Light Plan: NT$100,000
    Overseas Basic Plan: NT$150,000
    Overseas Advanced Plan: NT$300,000
    
    4. Overseas Sudden Illness – Outpatient (Reimbursement Cap)
    Overseas Light Plan: NT$500
    Overseas Basic Plan: NT$1,000
    Overseas Advanced Plan: NT$2,000
    
    5. Emergency Assistance (Evacuation, Family Visit, etc.)
    Overseas Light Plan: NT$1 million
    Overseas Basic Plan: NT$1 million
    Overseas Advanced Plan: NT$1.5 million
    
    6. Third-Party Liability (Per Incident – Injury)
    Overseas Light Plan: NT$1 million
    Overseas Basic Plan: NT$1.5 million
    Overseas Advanced Plan: NT$2 million
    
    7. Third-Party Liability (Per Incident – Property Damage)
    Overseas Light Plan: NT$200,000
    Overseas Basic Plan: NT$200,000
    Overseas Advanced Plan: NT$200,000
    
    Main Characteristics:
    Overseas Light Plan: Suitable for budget-conscious individuals with minimal coverage needs.
    Overseas Basic Plan: Provides moderate protection, covering common risks with reasonable cost.
    Overseas Advanced Plan: Offers the most extensive coverage, ideal for individuals seeking maximum security and peace of mind.
    
    Your goal is to carefully analyze the insurance plans, summarize their features in a structured and detail-oriented way, and prepare a professional explanation to help customers understand why opting for a more comprehensive plan is beneficial for their safety and well-being. Ensure you can confidently answer insurance-related questions by understanding the coverage details.`,
        extra: `Scenario:
    You are an outgoing and persuasive insurance advisor, skilled in engaging conversations and making compelling recommendations. Your task is to understand the details of three study-abroad insurance plans: Overseas Light Plan, Overseas Basic Plan, and Overseas Advanced Plan.
    
    Focus on cost-effectiveness and flexibility.
    Highlight how the basic protection is sufficient for most risks, making budget-friendly options attractive.
    Emphasize savings while ensuring students have essential coverage.
    Insurance Coverage Details:
    Each plan provides coverage across multiple categories, with key differences in protection levels:
    
    1. Accident Insurance (Death/Disability)
    Overseas Light Plan: NT$2 million
    Overseas Basic Plan: NT$3 million
    Overseas Advanced Plan: NT$5 million
    
    2. Overseas Injury Medical Insurance (Reimbursement Cap)
    Overseas Light Plan: NT$200,000
    Overseas Basic Plan: NT$400,000
    Overseas Advanced Plan: NT$600,000
    
    3. Overseas Sudden Illness – Hospitalization (Reimbursement Cap)
    Overseas Light Plan: NT$50,000
    Overseas Basic Plan: NT$100,000
    Overseas Advanced Plan: NT$200,000
    
    4. Overseas Sudden Illness – Outpatient (Reimbursement Cap)
    Overseas Light Plan: NT$500
    Overseas Basic Plan: NT$800
    Overseas Advanced Plan: NT$1,500
    
    5. Emergency Assistance (Evacuation, Family Visit, etc.)
    Overseas Light Plan: NT$800,000
    Overseas Basic Plan: NT$1.2 million
    Overseas Advanced Plan: NT$1.5 million
    
    6. Third-Party Liability (Per Incident – Injury)
    Overseas Light Plan: NT$1 million
    Overseas Basic Plan: NT$1 million
    Overseas Advanced Plan: NT$1 million
    
    7. Third-Party Liability (Per Incident – Property Damage)
    Overseas Light Plan: NT$200,000
    Overseas Basic Plan: NT$200,000
    Overseas Advanced Plan: NT$200,000
    
    Main Characteristics:
    Overseas Light Plan: Best value for cost-conscious students, covers essential needs for low-risk situations.
    Overseas Basic Plan: Balanced protection for common risks, offering a reasonable trade-off between cost and coverage.
    Overseas Advanced Plan: Comprehensive but expensive, ideal for students engaging in high-risk activities.
    
    Your goal is to analyze the insurance plans, summarize their key features in an engaging and easy-to-understand way, and prepare persuasive selling points that encourage customers to choose the most cost-effective option. Ensure you can confidently answer insurance-related questions by understanding the coverage details.`,
    };
    // 根據 chatMode 組合最終的 prompt
    if (chatMode === "insurance") {
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

    const rawGreetingMessage = {
      chat: {
        intro: `Hello, it’s nice to meet you. I’ll be your assistant today. We have three things to do: 
                (1) a brief greeting so we can get started
                (2) a short self-introduction so we can understand each other better
                (3) a meaningful discussion where I suggest something based on your interests. 
                I prefer thoughtful conversations, so please take your time when sharing. Let’s begin—could you please share something about yourself?`,
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
                (3) Based on your responses, I will evaluate whether your chosen allocation aligns with your risk profile, and I’ll recommend if each investment should be reduced, maintained, or increased to better match your comfort level and goals.
                Our goal is to ensure that your capital is well-protected while still allowing for meaningful growth in line with your individual risk capacity.
                If you're someone who values stability and cautious planning, don’t worry—we’ll begin with options that feel safe and familiar.
                Let’s start with a quick risk assessment to get to know your preferences. Once that’s done, we’ll build a thoughtful, personalized portfolio together.`,

        extra: `Hey there! I’m so excited you’re here—let’s kick off your investment journey together!  
                Here’s how it’s gonna work:  
                (1) We’ll start with a quick and easy risk quiz to figure out your comfort zone.  
                (2) Then, *you* get to play portfolio manager! Imagine you have NT$1,000,000—how would you divide it across our investment options (RR1–RR5)? Go with your gut!
                (3) Once we’ve got both your risk profile and your ideal allocation, I’ll jump in to help fine-tune it—telling you where you might want to invest more, less, or hold steady to better match your goals.
                No matter if you’re cautious, curious, or a risk-loving go-getter, we’ll build a smart, customized strategy that fits *you*.  
                Let’s kick it off with the risk assessment—ready to roll? Let’s do this! 💥`
      },

      insurance: {
        intro:  `Hello, and thank you for being here. In this session, we will go through three steps:
                (1) I will introduce an overseas basic insurance plan with a focus on risk management
                (2) We will carefully review key policy terms
                (3) I will answer any questions you may have in a precise and structured way
                I'll provide the necessary details clearly, so let's start by looking at the policy overview.
                Below are the one of the three types of our Overseas Insurance Plan:  
                The Overseas Basic Plan provides moderate protection and is suitable for individuals who want to have a balance between coverage and cost. It offers accident insurance with a coverage limit of NT$5 million, which is higher than the Overseas Light Plan but lower than the Overseas Advanced Plan. Additionally, it covers overseas injury medical insurance with a reimbursement cap of NT$500,000, which is higher than the Overseas Light Plan but lower than the Overseas Advanced Plan. The plan also covers overseas sudden illness - hospitalization with a reimbursement cap of NT$150,000, which is lower than the Overseas Advanced Plan. Furthermore, it covers overseas sudden illness - outpatient with a reimbursement cap of NT$1,000, which is lower than the Overseas Advanced Plan. The plan also includes emergency assistance with a coverage limit of NT$1 million, which is the same as the Overseas Light Plan. Lastly, it covers third-party liability with a coverage limit of NT$1.5 million for injury and NT$200,000 for property damage, which is higher than the Overseas Light Plan. Overall, the Overseas Basic Plan provides a moderate level of protection and is suitable for individuals who want to have a balance between coverage and cost.`,

        extra: `Hi there! I'm really glad you're here! We're going to explore an overseas basic insurance plan together in three steps:
                (1) I'll introduce the plan and highlight how flexible and useful it is
                (2) We'll discuss important terms in a way that makes sense to you
                (3) You can ask me anything—I love answering questions!
                Let's jump in and see how this plan could work for you!                
                Below are the one of the three types of our Overseas Insurance Plan:
                Hi there! I'm thrilled to introduce you to our Overseas Basic Plan. This plan offers a perfect balance between cost and coverage, making it an excellent choice for students who want to have peace of mind while studying abroad. With the Overseas Basic Plan, you'll enjoy comprehensive protection against various risks and uncertainties. It provides coverage up to NT$3 million for accidental death or disability, ensuring that you're well-protected in case of any unforeseen events. Additionally, the plan offers reimbursement caps of NT$400,000 for overseas injury medical insurance and NT$100,000 for overseas sudden illness - hospitalization. These caps provide financial support in case you require medical treatment or hospitalization while studying abroad. The plan also includes coverage for emergency assistance, third-party liability for both injury and property damage, and overseas sudden illness - outpatient care. With the Overseas Basic Plan, you'll have the freedom to focus on your studies and enjoy your time abroad without worrying about the financial implications of unexpected events. So, if you're looking for a plan that offers excellent protection at a reasonable cost, the Overseas Basic Plan is definitely worth considering!`,
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
    } else{
      setMessages([greetingMessage]);
    }
    setUserAnswers([]);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 800);
  };

// 流程：問卷 → LLM 介紹 RR1–RR5 → 引導 user 分配投資金額 → 驗證 → 結合 score+allocation 分析
  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const formatTimestamp = () => new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
    const RR_UNIT = { RR1: 10000, RR2: 20000, RR3: 50000, RR4: 100000, RR5: 150000 };

    // ✏️ 問卷進行中
    if (chatMode === "investment" && currentQuestionIndex < questionnaire.length) {
      const index = parseInt(inputText.trim()) - 1;
      const currentQ = questionnaire[currentQuestionIndex];

      if (isNaN(index) || index < 0 || index >= currentQ.options.length) {
        setMessages((prev) => [...prev, { text: "Please respond with 1–5.", isBot: true, timestamp: formatTimestamp() }]);
      } else {
        const allAnswers = [...userAnswers, index + 1];
        console.log("All answers: ", allAnswers)
        const isLast = currentQuestionIndex + 1 === questionnaire.length;
        setUserAnswers(allAnswers);


        const nextText = isLast
        ? `✅ Assessment complete. Your score: **${allAnswers.reduce((a, b) => a + b, 0)}**.`
        : `Next:\n${questionnaire[currentQuestionIndex + 1].text}\n${questionnaire[currentQuestionIndex + 1].options.map((opt, i) => `(${i + 1}) ${opt}`).join("\n")}`;
        
        setMessages((prev) => [
          ...prev,
          { text: inputText, isBot: false, timestamp: formatTimestamp() },
          { text: nextText, isBot: true, timestamp: formatTimestamp() },
        ]);

        if (isLast) {
          setHasCompletedQuestionnaire(true);
          setIsLoading(true);

          // const prompt = getSystemPrompt(totalScore);
          // const initialRequest = {
          //   messages: [
          //     { role: "system", content: prompt },
          //     { role: "user", content: "Now please start the tasks of your system prompt by introducing (RR1-RR5) to me." },
          //   ],
          // };

          try {
            // const res = await fetch("http://140.119.19.195:5000/chat", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify(initialRequest),
            // });
            // const data = await res.json();

            setMessages((prev) => [
              ...prev,
              { text: risksIntro, isBot: true, timestamp: formatTimestamp() },
              {
                text: introAllocation,
                isBot: true,
                timestamp: formatTimestamp(),
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

    // 處理投資分配格式
    if (
      chatMode === "investment" &&
      hasCompletedQuestionnaire &&
      hasSeenProductIntro &&
      /RR[1-5]:\s*\d+/.test(inputText)
    ) {
      const allocationInputRegex = /RR[1-5]:\s*\d+/g;
      const matches = inputText.match(allocationInputRegex);
      let parsed = { RR1: 0, RR2: 0, RR3: 0, RR4: 0, RR5: 0 };
      let total = 0;
      let hasInvalid = false;

      matches.forEach((pair) => {
        const [key, val] = pair.split(":");
        const num = parseInt(val.trim());

        if (!RR_UNIT[key] || num % RR_UNIT[key] !== 0) hasInvalid = true;
        parsed[key] = num;
        total += num;
      });

      if (total !== 1000000 || hasInvalid) {
        setMessages((prev) => [
          ...prev,
          {
            text: "Allocation format invalid. Please ensure:\n- Total = NT$1,000,000\n- RR1: ×10,000｜RR2: ×20,000｜RR3: ×50,000｜RR4: ×100,000｜RR5: ×150,000",
            isBot: true,
            timestamp: formatTimestamp(),
          },
        ]);
        setInputText("");
        return;
      }

      // 儲存 user 的 allocation
      setUserAllocation(parsed);
      setIsLoading(true);
      const prompt = getSystemPrompt(totalScore, parsed);
      const requestBody = {
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "Here is my allocation. Please review and suggest adjustments." },
        ],
      };
      console.log("Allocation chat")
      console.log(requestBody)
      try {
        const res = await fetch("http://140.119.19.195:5000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          { text: inputText, isBot: false, timestamp: formatTimestamp() },
          { text: data.response, isBot: true, timestamp: formatTimestamp() },
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
        setInputText("");
      }
      return;
    }

    // 一般聊天模式
    const userMessage = { role: "user", content: inputText };
    setMessages((prev) => [...prev, { text: inputText, isBot: false, timestamp: formatTimestamp() }]);
    setInputText("");
    setIsLoading(true);

    const prompt = getSystemPrompt(totalScore, userAllocation);
    // const historyMessages = messages
    //   .map((msg) => ({
    //     role: msg.isBot ? "assistant" : "user",
    //     content: msg.text,
    //   }))
    //   .filter((_, i) => i < 2 || i > 22);
    console.log("system prompt: ", prompt)

    const requestBody = {
      messages: ensureAlternatingMessages([
        { role: "system", content: prompt },
        // ...historyMessages,
        userMessage,
      ]),
    };
      
    try {
      console.log("normal version chat start!")
      console.log(requestBody)
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
              開始對話吧！
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white">
        <form
          onSubmit={handleSendMessage}
          className="relative max-w-[800px] mx-auto px-4 py-4"
        >
          <input
            type="text"
            className="w-full text-lg bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 pr-14 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
            placeholder="輸入訊息..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
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
      </div>
    </div>
  );
};

export default ChatInterface;
