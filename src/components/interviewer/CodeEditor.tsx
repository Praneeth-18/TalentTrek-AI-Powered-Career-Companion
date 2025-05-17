import React, { useState, useRef, useEffect } from 'react';
import { Code, Check, Loader } from 'lucide-react';

interface CodeEditorProps {
  onCheckCode: (code: string) => Promise<any>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ onCheckCode }) => {
  const [code, setCode] = useState('// Write your code here\n\nfunction example() {\n  console.log("Hello, world!");\n  return true;\n}\n');
  const [language, setLanguage] = useState('javascript');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between line numbers and code area
  useEffect(() => {
    const syncScroll = (e: Event) => {
      const textArea = textAreaRef.current;
      const lineNumbers = lineNumbersRef.current;
      
      if (lineNumbers && textArea && e.target === textArea) {
        lineNumbers.scrollTop = textArea.scrollTop;
      }
    };

    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.addEventListener('scroll', syncScroll);
      
      // Store reference to the function and element to properly remove it
      const currentTextArea = textArea;
      const currentSyncScroll = syncScroll;
      
      return () => {
        currentTextArea.removeEventListener('scroll', currentSyncScroll);
      };
    }
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    // Clear previous evaluation results
    setEvalResult(null);
  };

  const handleCheckCode = async () => {
    setIsEvaluating(true);
    setEvalResult(null);
    
    console.log('Checking code...', code.substring(0, 100));
  
    try {
      // Just pass the code string, not any DOM elements or event objects
      const result = await onCheckCode(code);
      console.log('Code check result:', result);
      
      if (result) {
        setEvalResult({
          status: 'success',
          message: 'Code submitted successfully. See feedback in the chat.'
        });
      } else {
        throw new Error('No result returned from code evaluation');
      }
    } catch (error) {
      console.error('Error evaluating code:', error);
      setEvalResult({
        status: 'error',
        message: 'An error occurred during code evaluation. Please try again.'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Generate line numbers based on the code content
  const lineNumbers = code.split('\n').map((_, i) => (
    <div key={i} className="px-2">{i + 1}</div>
  ));

  return (
    <div className="flex flex-col h-full rounded-xl bg-[#1e1e2e] bg-opacity-90 backdrop-blur-md backdrop-filter border border-white/10 shadow-lg overflow-hidden">
      {/* Header with fixed position */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1e1e2e]">
        <div className="flex space-x-2">
          <button 
            className="flex items-center px-3 py-1 rounded bg-white/10 text-white"
          >
            <Code size={16} className="mr-2" />
            <span>Editor</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
          <button 
            className={`flex items-center ${
              isEvaluating 
                ? 'bg-yellow-500 bg-opacity-20' 
                : evalResult?.status === 'success'
                  ? 'bg-green-500 bg-opacity-20 hover:bg-opacity-30'
                  : evalResult?.status === 'error'
                    ? 'bg-red-500 bg-opacity-20 hover:bg-opacity-30'
                    : 'bg-blue-500 bg-opacity-20 hover:bg-opacity-30'
            } text-white px-3 py-1 rounded transition-colors`}
            onClick={handleCheckCode}
            disabled={isEvaluating}
          >
            {isEvaluating ? (
              <>
                <Loader size={16} className="mr-2 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                <span>Check Code</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Result banner */}
      {evalResult && (
        <div className={`p-2 ${
          evalResult.status === 'success' 
            ? 'bg-green-500 bg-opacity-20 text-green-100' 
            : 'bg-red-500 bg-opacity-20 text-red-100'
        }`}>
          {evalResult.message}
        </div>
      )}
      
      {/* Code editor area with synchronized scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Line numbers with scrolling */}
          <div 
            ref={lineNumbersRef}
            className="text-right pr-2 pt-2 bg-[#1e1e2e] text-gray-500 select-none overflow-y-hidden"
            style={{ width: '40px', minHeight: '100%' }}
          >
            {lineNumbers}
          </div>
          
          {/* Code editor with scrolling */}
          <textarea
            ref={textAreaRef}
            value={code}
            onChange={handleCodeChange}
            className="flex-1 bg-transparent text-white p-2 resize-none focus:outline-none font-mono overflow-auto"
            spellCheck="false"
            style={{ lineHeight: '1.5', minHeight: '100%' }}
            disabled={isEvaluating}
          />
        </div>
      </div>
    </div>
  );
};