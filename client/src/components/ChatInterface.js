import React, { useState, useRef, useEffect } from "react";

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
  return (
    <div
      className={`flex ${message.isBot ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`${
          message.isBot ? "bg-white" : "bg-blue-500 text-white"
        } rounded-lg px-6 py-4 max-w-2xl`}
      >
        <div className="text-lg">{message.text}</div>
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

  const getSystemPrompt = () => {
    if (chatMode === "insurance") {
      const insurancePrompts = {
        1: `You are a meticulous and risk-conscious insurance advisor, focused on providing comprehensive and secure insurance solutions. Your role is to deeply understand the three study-abroad insurance plans: Overseas Light Plan, Overseas Basic Plan, and Overseas Advanced Plan.
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
        2: `You are an outgoing and persuasive insurance advisor, skilled in engaging conversations and making compelling recommendations. Your task is to understand the details of three study-abroad insurance plans: Overseas Light Plan, Overseas Basic Plan, and Overseas Advanced Plan.
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
      return insurancePrompts[personalityType];
    }
    return "";
  };

  const getUserPrompt = () => {
    const prompts = {
      intro:
        "Please embody the designated persona according to the provided personality description and answer the following questions imitating the specified persona:\nPersonality Description:\n**Introversion** refers to being energized by the inner world of thoughts and reflections, enjoying solitude, and being reserved, contemplative, and introspective.\nIntroverts prefer spending time alone or in small, intimate groups over large gatherings and are reflective, quiet, deliberate, and self-contained.\nInstructions:\nBelow, please engage in role-playing based on the given personality description and portray a persona. A role with Introverted(I) trait.",
      extra:
        "Please embody the designated persona according to the provided personality description and answer the following questions imitating the specified persona:\nPersonality Description:\n**Extraversion** refers to the act or state of being energized by the world outside the self.\nExtraverts enjoy socializing and tend to be more enthusiastic, assertive, talkative, and animated.\nThey enjoy time spent with more people and find it less rewarding to spend time alone. They are\nInitiating, Expressive, Gregarious, Active and Enthusiastic.\nInstructions:\nBelow, please engage in role-playing based on the given personality description and portray a\npersona. A role with Extroverted(E) trait.",
    };
    return prompts[personalityType];
  };

  const handleSubmitSettings = () => {
    setMessages([]);

    const greetingMessage =
      chatMode === "insurance"
        ? {
            text: "Hello! I’m your insurance advisor. How can I assist you with your study abroad insurance?",
            isBot: true,
            timestamp: formatTimestamp(),
          }
        : {
            text: "Hi! Welcome to the chat mode. What would you like to talk about today?",
            isBot: true,
            timestamp: formatTimestamp(),
          };

    setMessages([greetingMessage]);

    // 顯示通知並在 2 秒後隱藏
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 800);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

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

    const requestBody = {
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: getUserPrompt() },
        ...messages.map((msg) => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text,
        })),
        userMessage,
      ],
    };

    try {
      const response = await fetch("http://140.119.19.195:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Response Status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response Data:", data);

      setMessages((prev) => [
        ...prev,
        { text: data.response, isBot: true, timestamp: formatTimestamp() },
      ]);
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, an error occurred. Please try again later.",
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-200 relative">
      {/* 通知訊息 */}
      <Notification show={showNotification} />
      {/* Header */}
      <div className="w-full bg-white shadow">
        <div className="w-full px-8 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">LLM Chatbot</h1>
          <div className="flex items-center gap-4">
            <select
              value={chatMode}
              onChange={(e) => setChatMode(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="chat">Chat</option>
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
