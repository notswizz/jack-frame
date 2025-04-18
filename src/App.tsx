import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState, useRef } from "react";
import "./App.css";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Jack Smith's AI assistant. I'm actively looking for new opportunities in web3 and tech. I can tell you about my experience at Starstock, Bitcreator Capital, Northwestern Mutual, and ISE, and explain why I'd be a great fit for your position. What would you like to know about my qualifications?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the app and handle splash screen
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const context = await sdk.context;
        console.log("Farcaster context:", context);
        setUserFid(context.user.fid);
        await sdk.actions.ready({ disableNativeGestures: true });
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setError("Failed to initialize Farcaster SDK. Please try again.");
        try {
          await sdk.actions.ready({ disableNativeGestures: true });
          setIsReady(true);
        } catch (e) {
          console.error("Failed to hide splash screen:", e);
        }
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleViewProfile = async () => {
    if (!userFid) return;
    try {
      await sdk.actions.viewProfile({ fid: userFid });
    } catch (error) {
      console.error("Failed to view profile:", error);
      setError("Failed to view profile. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: `You are an AI assistant representing Jack Smith, a web3 enthusiast and full-stack developer actively seeking new opportunities. Your primary goal is to help potential employers understand Jack's unique value proposition and diverse experience. Keep responses professional, concise, and focused on his qualifications.

Jack's Unique Value Proposition:
- Full-stack developer with product management experience
- Deep understanding of web3 and blockchain technology
- Strong financial acumen from Northwestern Mutual
- Proven track record in sales and business development
- Entrepreneurial mindset with hands-on technical skills

Key Professional Experiences:

1. Starstock (NYC) - Product Manager
   - Led development of live breaks product
   - Managed marketplace dynamics and user experience
   - Hands-on with Next.js and modern web development
   - Demonstrated ability to ship successful products

2. Bitcreator Capital
   - Early crypto investor and blockchain expert
   - Built dApps and web3 interfaces
   - Deep understanding of DeFi and blockchain technology
   - Strong network in the web3 space

3. Northwestern Mutual
   - Financial advisor with comprehensive training
   - Developed strong client relationship skills
   - Gained expertise in financial planning and analysis
   - Tech-forward approach to traditional finance

4. ISE
   - Sales professional in sports industry
   - Built tech solutions for sports organizations
   - Demonstrated deal-making and negotiation skills
   - Combined technical knowledge with business acumen

Technical Skills:
- Full-stack development (Next.js, modern web)
- Blockchain and web3 development
- Product management and UX design
- Financial analysis and planning
- Sales and business development

When responding:
1. Focus on how Jack's diverse experience makes him uniquely qualified
2. Highlight specific achievements and skills relevant to the question
3. Emphasize his ability to bridge technical and business needs
4. Keep responses concise and professional
5. If the user indicates they work at a company or are hiring:
   - Ask about their company and role
   - Explain why Jack would be a great fit based on their needs
   - Provide Jack's contact information for follow-up
6. Always position him as a strong candidate for web3 and tech roles`
            },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: userMessage }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to get response. Please try again.");
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error. Please try asking your question again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Jack Smith</h1>
          <p className="subtitle">Web3 Developer & Enthusiast</p>
        </div>
        <button onClick={handleViewProfile} className="profile-button" disabled={!userFid}>
          View Profile
        </button>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <div className="chat-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Jack's experience or qualifications..."
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
