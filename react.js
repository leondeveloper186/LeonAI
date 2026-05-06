```react
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Search, Code, Image as ImageIcon, FileJson, Link as LinkIcon, 
  ChevronDown, ChevronRight, User, Sparkles, Send, Paperclip, X
} from 'lucide-react';

const apiKey = "";

// Exponential backoff fetch
const fetchWithRetry = async (url, options, maxRetries = 5) => {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
      }
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// Markdown & formatting renderer
const renderFormattedText = (text) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <div key={index} className="my-4 bg-[#27272A] rounded-lg overflow-hidden border border-[#3F3F46]">
          {lang && (
            <div className="text-xs text-[#A1A1AA] px-4 py-2 bg-[#303036] border-b border-[#3F3F46] uppercase tracking-wider font-semibold">
              {lang}
            </div>
          )}
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm text-[#E4E4E7] font-mono">{code}</code>
          </pre>
        </div>
      );
    }

    let formattedText = part
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[#F4F4F5] font-semibold">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-[#27272A] text-[#E5A58A] px-1.5 py-0.5 rounded-md text-sm border border-[#3F3F46]">$1</code>');

    return <span key={index} dangerouslySetInnerHTML={{ __html: formattedText.replace(/\n/g, '<br/>') }} className="leading-relaxed text-[#D4D4D8]" />;
  });
};

// Toggle Switch Component
const Toggle = ({ checked, onChange, label, icon: Icon }) => (
  <div 
    className="flex items-center justify-between py-2.5 px-3 hover:bg-[#303036] rounded-lg cursor-pointer transition-colors" 
    onClick={() => onChange(!checked)}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={`${checked ? 'text-[#E5A58A]' : 'text-[#A1A1AA]'}`} />
      <span className="text-sm font-medium text-[#E4E4E7]">{label}</span>
    </div>
    <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${checked ? 'bg-[#D4896A]' : 'bg-[#52525B]'}`}>
      <div className={`bg-[#F4F4F5] w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-3.5' : 'translate-x-0'}`} />
    </div>
  </div>
);

// Expandable Tool Block Component
const ToolAccordion = ({ tool }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  let icon, title, content;
  
  switch(tool.type) {
    case 'search':
      icon = <Search size={16} />;
      title = "Google Search Results";
      content = (
        <ul className="list-disc pl-5 space-y-1 mt-2">
          {tool.data.map((item, i) => (
            <li key={i} className="text-sm text-[#A1A1AA]">
              <a href={item.uri} target="_blank" rel="noopener noreferrer" className="text-[#E5A58A] hover:underline font-medium">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      );
      break;
    case 'image':
      icon = <ImageIcon size={16} />;
      title = "Image Generated";
      content = (
        <div className="mt-3">
          <img src={tool.url} alt="Generated content" className="max-w-full rounded-xl border border-[#3F3F46] shadow-sm" />
        </div>
      );
      break;
    case 'code':
      icon = <Code size={16} />;
      title = "Code Executed";
      content = (
        <div className="mt-2 space-y-2">
          <div className="bg-[#111113] rounded-md p-3 border border-[#27272A]">
            <div className="text-xs text-[#71717A] mb-1">Executable Code:</div>
            <pre className="text-xs text-[#A1A1AA] font-mono overflow-x-auto">{tool.code}</pre>
          </div>
          <div className="bg-[#27272A] border border-[#3F3F46] rounded-md p-3">
            <div className="text-xs text-[#A1A1AA] mb-1">Output:</div>
            <pre className="text-xs text-[#E4E4E7] font-mono overflow-x-auto">{tool.output}</pre>
          </div>
        </div>
      );
      break;
    case 'structured':
      icon = <FileJson size={16} />;
      title = "Structured Output Formatted";
      content = (
        <div className="mt-2 bg-[#27272A] border border-[#3F3F46] rounded-md p-3">
          <pre className="text-xs text-[#E4E4E7] font-mono overflow-x-auto">{tool.data}</pre>
        </div>
      );
      break;
    default:
      return null;
  }

  return (
    <div className="my-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[#27272A] py-1.5 px-3 rounded-full transition-colors w-fit border border-transparent hover:border-[#3F3F46]"
      >
        {icon}
        <span className="font-medium">{title}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && (
        <div className="pl-4 border-l-2 border-[#3F3F46] ml-3 mt-1 py-1">
          {content}
        </div>
      )}
    </div>
  );
};


export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const [options, setOptions] = useState({
    structOut: false,
    codeExec: false,
    googleSearch: false,
    urlContext: false,
    genImage: false
  });

  const messagesEndRef = useRef(null);
  const optionsMenuRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() && !options.genImage) return;

    const newUserMessage = { role: 'user', text: inputText, id: Date.now() };
    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      let combinedTools = [];
      let finalResponseText = "";

      if (options.genImage && inputText.trim()) {
        try {
          const imgUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
          const imgRes = await fetchWithRetry(imgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: { prompt: inputText },
              parameters: { sampleCount: 1 }
            })
          });
          
          if (imgRes.predictions && imgRes.predictions[0]) {
            const base64 = `data:image/png;base64,${imgRes.predictions[0].bytesBase64Encoded}`;
            combinedTools.push({ type: 'image', url: base64 });
          }
        } catch (imgErr) {
          finalResponseText += "*(Note: Had some trouble making that image. " + imgErr.message + ")*\n\n";
        }
      }

      let contextMsg = inputText;
      if (options.urlContext) {
         contextMsg = `[System: The user wants you to look at any URLs in their message. Try to visit them if possible.]\n\n${inputText}`;
      }

      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));
      history.push({ role: 'user', parts: [{ text: contextMsg }] });

      const payload = {
        contents: history,
        systemInstruction: { 
          parts: [{ text: "You are LeonAI. Talk like a normal person—friendly, helpful, and clear. Avoid using overly complicated words unless necessary. Just be a regular, smart AI helper." }] 
        }
      };

      if (options.googleSearch) payload.tools = [{ google_search: {} }];
      if (options.codeExec) {
        payload.tools = payload.tools || [];
        payload.tools.push({ codeExecution: {} });
      }
      if (options.structOut) payload.generationConfig = { responseMimeType: "application/json" };

      const textUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const textRes = await fetchWithRetry(textUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (textRes.candidates && textRes.candidates[0]) {
        const candidate = textRes.candidates[0];
        const parts = candidate.content?.parts || [];
        const textPart = parts.find(p => p.text);
        if (textPart) finalResponseText += textPart.text;

        if (options.structOut && textPart) {
           try {
             JSON.parse(textPart.text);
             combinedTools.push({ type: 'structured', data: textPart.text });
             finalResponseText = "Here is the structured data you asked for:";
           } catch(e) {}
        }

        const execCodePart = parts.find(p => p.executableCode);
        const execResultPart = parts.find(p => p.codeExecutionResult);
        if (execCodePart || execResultPart) {
           combinedTools.push({ 
             type: 'code', 
             code: execCodePart?.executableCode?.code || 'No code',
             output: execResultPart?.codeExecutionResult?.output || 'No output'
           });
        }

        const attributions = candidate.groundingMetadata?.groundingAttributions;
        if (attributions?.length > 0) {
          const links = attributions.map(a => ({ uri: a.web?.uri, title: a.web?.title })).filter(a => a.uri && a.title);
          if (links.length > 0) combinedTools.push({ type: 'search', data: links });
        }
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: finalResponseText || "I'm not sure how to answer that.", 
        tools: combinedTools, 
        id: Date.now() 
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Sorry, I hit a snag: ${error.message}`, 
        tools: [],
        id: Date.now() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#18181B] font-sans text-[#E4E4E7] selection:bg-[#D4896A] selection:text-white">
      <header className="flex-none flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#18181B] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#27272A] flex items-center justify-center border border-[#3F3F46]">
            <Sparkles size={16} className="text-[#F4F4F5]" />
          </div>
          <h1 className="font-serif text-xl font-medium text-[#F4F4F5]">LeonAI</h1>
        </div>
        <div className="relative" ref={optionsMenuRef}>
          <button onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3F3F46] text-sm font-medium hover:bg-[#27272A] transition-colors text-[#D4D4D8]">
            <Settings size={16} className="text-[#A1A1AA]" />
            Options
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-72 bg-[#1E1E24] rounded-xl shadow-2xl border border-[#3F3F46] p-2 z-50">
              <Toggle checked={options.structOut} onChange={(v) => setOptions({...options, structOut: v})} label="Structured outputs" icon={FileJson} />
              <Toggle checked={options.codeExec} onChange={(v) => setOptions({...options, codeExec: v})} label="Code execution" icon={Code} />
              <Toggle checked={options.googleSearch} onChange={(v) => setOptions({...options, googleSearch: v})} label="Grounding with Google" icon={Search} />
              <Toggle checked={options.urlContext} onChange={(v) => setOptions({...options, urlContext: v})} label="URL context" icon={LinkIcon} />
              <Toggle checked={options.genImage} onChange={(v) => setOptions({...options, genImage: v})} label="Generate Image" icon={ImageIcon} />
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
          {messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center mt-32 text-center space-y-4 opacity-80">
                <div className="w-16 h-16 rounded-2xl bg-[#27272A] flex items-center justify-center mb-4 border border-[#3F3F46]">
                   <Sparkles size={32} className="text-[#D4896A]" />
                </div>
                <h2 className="font-serif text-3xl text-[#F4F4F5]">Hi Leon, how can I help?</h2>
             </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-4 group">
                <div className="flex-none mt-1">
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-[#27272A] border border-[#3F3F46] flex items-center justify-center"><User size={16} className="text-[#A1A1AA]" /></div>
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-[#18181B] border border-[#3F3F46] flex items-center justify-center shadow-sm"><Sparkles size={16} className="text-[#D4896A]" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[#F4F4F5] mb-1">{msg.role === 'user' ? 'Leon' : 'LeonAI'}</div>
                  {msg.tools?.map((tool, idx) => <ToolAccordion key={idx} tool={tool} />)}
                  <div className="text-[15px] leading-relaxed text-[#D4D4D8] break-words">{renderFormattedText(msg.text)}</div>
                </div>
              </div>
            ))
          )}
          {isLoading && <div className="flex gap-4 animate-pulse"><div className="w-8 h-8 rounded-md bg-[#27272A] border border-[#3F3F46]" /><div className="flex-1 h-20 bg-[#27272A] rounded-xl" /></div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-none w-full bg-[#18181B] pt-4 pb-6">
        <div className="max-w-3xl mx-auto px-4 relative">
          <div className="bg-[#27272A] border border-[#3F3F46] rounded-2xl flex flex-col p-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type here..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none px-3 py-2 text-[15px] placeholder-[#71717A] text-[#E4E4E7] min-h-[52px]"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-1 px-1">
              <button className="p-2 text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#3F3F46] rounded-lg"><Paperclip size={18} /></button>
              <button 
                onClick={handleSend}
                disabled={(!inputText.trim() && !options.genImage) || isLoading}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  (inputText.trim() || options.genImage) && !isLoading ? 'bg-[#D4896A] text-white' : 'bg-[#3F3F46] text-[#71717A]'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

```
