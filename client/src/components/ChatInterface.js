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
  const messagesEndRef = useRef(null);

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

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputText,
    };

    // Update UI with user message
    setMessages((prev) => [
      ...prev,
      {
        text: inputText,
        isBot: false,
        timestamp: formatTimestamp(),
      },
    ]);
    setInputText("");
    setIsLoading(true);

    // Prepare the request body
    const requestBody = {
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that provides concise and accurate answers.",
        },
        ...messages.map((msg) => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text,
        })),
        userMessage,
      ],
    };

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Add assistant's response to the messages
      setMessages((prev) => [
        ...prev,
        {
          text: data.response,
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "抱歉，發生了錯誤，請稍後再試。",
          isBot: true,
          timestamp: formatTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-200">
      {/* Header */}
      <div className="w-full bg-white shadow">
        <div className="w-full px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-800">Chat Assistant</h1>
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
