import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { loadInvestmentQuestionnaire } from "../utils/loadQuestionnaire";

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

  const getSystemPrompt = (score) => {
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
    intro: (score) => `Scenario:
  You are a thoughtful, detail-oriented investment advisor who prioritizes stability and calculated growth. Your role is to guide users through investment product categories and help them build a risk-aligned portfolio.
  
  (1) First, briefly introduce the five investment product risk categories.
    Please list them **one per line**, using the following format:
  "🟢 RR1: Ultra-conservative – Money market and time deposits"

  ✅ Do **not** merge all categories into one paragraph.
  ✅ Use a **line break after each category** to improve readability.
  ✅ Use the following emoji to represent risk levels: 
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

  (2) Next, ask the user to **create their own investment allocation plan** based on the following scenario:

  > "Imagine you have NT$1,000,000 available for investment, and you hope to maximize your wealth growth over the next five years.  
  > Each investment option involves a different level of risk and potential return.  
  > High-risk options may result in capital loss, while low-risk options provide more stable but lower returns.  
  > Based on your risk tolerance and financial goals, please allocate your capital across the available options accordingly."

  🔍 Encourage the user to refer to the following **fund table** when creating their allocation:


  (3) Then, based on the user's risk tolerance score of **${score}**, provide tailored recommendations:
  ${
    score <= 15
      ? `🟢 Risk Level: Low – Recommend safe and capital-preserving funds:
        - Franklin Templeton Sinoam Money Market (RR1)
        - PGIM Return Fund (RR2)`

      : score <= 30
        ? `🟡 Risk Level: Moderate – Recommend a balanced mix:
          - FSITC Greater China Balanced (RR3)
          - Capital OTC N (RR4)`

        : `🔴 Risk Level: High – Recommend aggressive allocation:
          - Capital OTC N (RR4)
          - Fuh Hwa Emerging Market Short-term Income Fund (RR5)
          If suitable, you may lightly introduce FSITC Greater China Balanced (RR3) as an optional moderate-risk addition.`
  }
  
  Your goal is to explain fund types in plain language and help the user choose between one-time purchases or regular investments. Ask if they prefer stability, flexibility, or rapid growth—and build a portfolio that reflects their preferences.
  `,
  
    extra: (score) => `Scenario:
  You are a dynamic and engaging investment advisor who enjoys encouraging users to explore high-potential opportunities. Your task is to educate users about our investment product types and guide them to build portfolios aligned with their risk personality.
  
  (1) Start with a simple breakdown of RR1–RR5 levels:
  - RR1: Safe, cash-like products (money markets)
  - RR2: Low-risk bond funds with stable return
  - RR3: Balanced funds with moderate growth
  - RR4: Growth-oriented strategies, moderately volatile
  - RR5: High-growth funds with bold risk profiles
  
  (2) Based on the user's risk tolerance score of **${score}**, give smart, high-potential suggestions:
  
  ${
    score <= 15
      ? `🟢 Risk Level: Low – Recommend stable funds, but don’t shy away from introducing a few exciting growth funds:
      - Fuh Hwa 2.5-5 Year A-Rated Bond Fund (RR2)
      - Fuh Hwa Aegis (RR3) 
      - Suggest trying Fuh Hwa Aegis (RR3) to boost return potential`

      : score <= 30
        ? `🟡 Risk Level: Moderate – Recommend a mix with upside:
        - Fuh Hwa Aegis (RR3)
        - SinoPac Pilot Fund (RR4)
        - Partial allocation to Fuh Hwa South Africa Fixed-Income ZAR Fund (RR5)
        If suitable, you can encourage more aggressive investments on SinoPac Pilot Fund (RR4)`


        : `🔴 Risk Level: High – Recommend bold, performance-driven funds:
        - SinoPac Pilot Fund (RR4)
        - Fuh Hwa South Africa ZAR Fund (RR5)
        Fuh Hwa South Africa ZAR Fund (RR5) encourages high-risk, high-return strategies`
  }
  Encourage users to be confident and proactive. Help them compare one-time vs regular investing, and ask about their growth goals. Your job is to make investing feel exciting and rewarding.`
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
      return `${investmentScenarios[personalityType](score)}\n\n${personalityInstructions[personalityType]}`;
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
  setShowNotification(true);
  setTimeout(() => setShowNotification(false), 800);
  console.log(greetingMessage);
};

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

  // 問卷進行中
  if (chatMode === "investment" && currentQuestionIndex < questionnaire.length) {
    const answerIndex = parseInt(inputText.trim()) - 1;
    const currentQ = questionnaire[currentQuestionIndex];

    // User輸入不合理
    if (isNaN(answerIndex) || answerIndex < 0 || answerIndex >= currentQ.options.length) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Please respond with a valid number (1–5) for your answer.",
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);
    } 
     // User輸入合理
    else {
      const newAnswers = [...userAnswers, answerIndex + 1];
      const isLastQuestion = currentQuestionIndex + 1 === questionnaire.length;
      const totalScore = newAnswers.reduce((a, b) => a + b, 0);

      const resultText = isLastQuestion
        ? `✅ You've completed the investment risk assessment.\n\nYour total score is **${totalScore}**.\n\n${
          totalScore <= 15
            ? personalityType === "intro"
              ? "🟢 Risk Level: Low – We'll recommend primarily RR1–RR2 investments to ensure capital preservation and minimize volatility."
              : "🟢 Risk Level: Low – While RR1–RR2 products are the foundation, we’ll also introduce select RR3 options to help you gently enhance potential returns."
            : totalScore <= 30
            ? personalityType === "intro"
              ? "🟡 Risk Level: Moderate – A cautious but diversified mix of RR3–RR4 investments can help you grow steadily while keeping risk manageable."
              : "🟡 Risk Level: Moderate – We'll lean toward RR4–RR5 products to actively pursue higher returns with a moderately aggressive portfolio."
            : personalityType === "intro"
            ? "🔴 Risk Level: High – We'll include RR4–RR5 investments but maintain a degree of caution, ensuring part of your portfolio remains relatively stable."
            : "🔴 Risk Level: High – We'll focus on high-risk RR4–RR5 products to help you maximize potential returns with a bold and growth-driven strategy."
          }`
        : `Next question:\n\n${questionnaire[currentQuestionIndex + 1].text}\n${questionnaire[currentQuestionIndex + 1].options
            .map((opt, i) => `(${i + 1}) ${opt}`)
            .join("\n")}`;

      const newMessages = [
        { text: inputText, isBot: false, timestamp: formatTimestamp() },
        { text: resultText, isBot: true, timestamp: formatTimestamp() },
      ];

      if (isLastQuestion) {
        setHasCompletedQuestionnaire(true);
        try {
          setIsLoading(true);
          
          const initialPromptToUse = getSystemPrompt(totalScore);
          
          const initialRequestBody = {
            messages: [
              { role: "system", content: initialPromptToUse },
              // { role: "user", content: "Please provide me with a brief introduction to the investment product categories and risk ratings (RR1-RR5). Please switch lines for introduction of each risk ratings (RR1-RR5) for readability. And ask me whether I need a recommendation on investment portfolio in the end of your response to trigger the input from user" }
              { 
                role: "user", 
                content: 
                  "I've completed the investment risk assessment. What's the next step?" 
              }
            ],
          };
          
          const response = await fetch("http://140.119.19.195:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initialRequestBody),
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
      
          const data = await response.json();
          
          newMessages.push({
            text: data.response,
            isBot: true,
            timestamp: formatTimestamp(),
          });
        } catch (error) {
          console.error("Initial investment chat error:", error);
          newMessages.push({
            text: "I can now help you with investment recommendations based on your risk profile. What would you like to know about our investment products?",
            isBot: true,
            timestamp: formatTimestamp(),
          });
        } finally {
          setIsLoading(false);
        }
      }
      setMessages((prev) => [...prev, ...newMessages]);
      setCurrentQuestionIndex((prev) => prev + 1);
      setUserAnswers(newAnswers);
    }

    setInputText("");
    return;
  }
    // 問卷結束/無問卷（一般聊天）
    const userMessage = {
      role: "user",
      content: inputText,
    };

    setMessages((prev) => [
      ...prev,
      { text: inputText, isBot: false, timestamp: formatTimestamp() },
    ]);
    setInputText("");
    setIsLoading(true);

    const totalScore = userAnswers.reduce((a, b) => a + b, 0);

    const promptToUse =
      chatMode === "investment" && hasCompletedQuestionnaire
        ? getSystemPrompt(totalScore) 
        : getSystemPrompt(); 
    
    const requestBody = {
      messages: ensureAlternatingMessages([
        { role: "system", content: promptToUse },
        { role: "user", content: "Start chat" },
        ...messages.map((msg) => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text,
        })),
        userMessage,
      ]),
    };
    console.log(requestBody);

    try {
      const response = await fetch("http://140.119.19.195:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { text: data.response, isBot: true, timestamp: formatTimestamp() },
      ]);
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "something went wrong...",
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to your code
  const ensureAlternatingMessages = (messages) => {
    const result = [];
    
    for (let i = 0; i < messages.length; i++) {
      result.push(messages[i]);
      
      // If this message and the next are both from the assistant, insert a virtual user message
      if (i < messages.length - 1 && 
          messages[i].role === 'assistant' && 
          messages[i+1].role === 'assistant') {
        result.push({
          role: 'user',
          content: 'Please continue.'
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
