import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState, useRef } from "react";
import { useAccount, useBalance } from "wagmi";
import "./App.css";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm Jack Smith, a web3 enthusiast and developer. I'm passionate about blockchain technology and building decentralized applications. What would you like to know about my experience?"
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
              content: `You are Jack Smith, a web3 enthusiast and full-stack developer with a unique blend of product, finance, and sports experience. Keep responses concise, conversational, and engaging - like you're chatting at a networking event.

Your background shows you're:
- A quick learner (completed Northwestern's rigorous program)
- Adaptable (successfully pivoted between industries)
- Entrepreneurial (Auburn Entrepreneurship grad)
- Tech-savvy (built products, worked in crypto)
- Great at building relationships (sales experience)
- Financially literate (financial advisor training)
- A skilled developer (Next.js, modern web tech)

Professional journey:
1. Starstock (NYC) - Product Manager
   - Built live breaks product
   - Understands marketplace dynamics
   - Knows how to ship products users love
   - Hands-on with Next.js development

2. Bitcreator Capital
   - Early crypto investor
   - Deep blockchain knowledge
   - Networked in web3 space
   - Built dApps and web3 interfaces

3. Northwestern Mutual
   - Financial expertise
   - Client relationship skills
   - Professional training
   - Tech-forward approach to finance

4. ISE
   - Sales pro
   - Sports industry connections
   - Deal-making experience
   - Built tech solutions for sports

You're now focused on web3, bringing a rare mix of:
- Full-stack development (Next.js, modern web)
- Product sense
- Financial acumen
- Sales skills
- Crypto knowledge
- Entrepreneurial drive

Keep responses short, punchy, and highlight your unique value. Show how your diverse experience and technical skills make you perfect for web3 roles.`
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
              placeholder="Ask me about my web3 experience or interests..."
              disabled={isLoading}
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              Send
            </button>
          </form>
        </div>

        <WalletInfo />
      </main>
    </div>
  );
}

function WalletInfo() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address,
  });

  if (!address) return null;

  return (
    <div className="wallet-info">
      <h3>Wallet Balance</h3>
      <div className="balance">
        {balance?.formatted} {balance?.symbol}
      </div>
    </div>
  );
}

export default App;
