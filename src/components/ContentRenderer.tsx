import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const PYTHON_KEYWORDS = new Set(['import', 'from', 'def', 'return', 'lambda', 'if', 'else', 'elif', 'for', 'while', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None', 'try', 'except', 'finally', 'with', 'as', 'class', 'yield', 'global', 'nonlocal', 'break', 'continue', 'pass']);
const COMMON_LIBS = new Set(['np', 'pd', 'plt', 'sns', 'df', 'sklearn', 'matplotlib', 'seaborn', 'numpy', 'pandas', 'scipy']);
const BUILTINS = new Set(['print', 'len', 'type', 'range', 'list', 'dict', 'set', 'str', 'int', 'float', 'bool', 'sum', 'max', 'min', 'abs', 'round', 'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'open', 'isinstance', 'issubclass', 'hasattr', 'getattr', 'setattr', 'delattr']);

function looksLikeCode(str: string): boolean {
  if (str.length > 120) return false;
  
  const tokens = str.split(/[\s.()\[\]{}=+\-*/,:]+/).filter(Boolean);
  
  for (const token of tokens) {
    if (PYTHON_KEYWORDS.has(token) || COMMON_LIBS.has(token)) return true;
  }
  
  if (/\w+\.\w+/.test(str)) return true;
  if (/\w+\s*\(/.test(str)) return true;
  if (/\w+\s*\[/.test(str)) return true;
  if (/==|!=|>=|<=|\+|-|\*|\/|=|<|>/.test(str)) return true;
  if (/[a-z]+_[a-z]+/.test(str)) return true;
  
  const specialChars = str.replace(/[a-zA-Z0-9\s]/g, '');
  if (specialChars.length >= 2) return true;
  
  return false;
}

type FencedBlock = { type: 'block'; lang: string; value: string };
type TextBlock = { type: 'text'; value: string };
type ParsedContent = FencedBlock | TextBlock;

function parseFenced(text: string): ParsedContent[] {
  const result: ParsedContent[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: text.substring(lastIndex, match.index) });
    }
    result.push({ type: 'block', lang: match[1] || '', value: match[2] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.substring(lastIndex) });
  }
  
  return result;
}

type InlineCodeBlock = { type: 'code'; value: string };
type InlineTextBlock = { type: 'text'; value: string };
type ParsedInline = InlineCodeBlock | InlineTextBlock;

function parseInline(text: string): ParsedInline[] {
  const result: ParsedInline[] = [];
  const regex = /`([^`]+)`|'([^'\n]{1,120})'|([a-zA-Z_][a-zA-Z0-9_]*(?:\[[^\]]+\])?\s*=\s*[a-zA-Z0-9_\[\]()+\-*\/:',]+(?:\.[a-zA-Z0-9_\[\]()+\-*\/:',]+)*)|([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*(?:\([^)]*\))?)|([a-zA-Z_][a-zA-Z0-9_]*\[[^\]]+\])|(\[[a-zA-Z0-9., _\-"'\[\]]+\])|(\b[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\))/g;
  let lastIndex = 0;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', value: text.substring(lastIndex, match.index) });
    }
    
    if (match[1]) {
      result.push({ type: 'code', value: match[1] });
    } else if (match[2]) {
      if (looksLikeCode(match[2])) {
        result.push({ type: 'code', value: match[2] });
      } else {
        result.push({ type: 'text', value: `'${match[2]}'` });
      }
    } else if (match[3]) {
      result.push({ type: 'code', value: match[3] });
    } else if (match[4]) {
      result.push({ type: 'code', value: match[4] });
    } else if (match[5]) {
      result.push({ type: 'code', value: match[5] });
    } else if (match[6]) {
      result.push({ type: 'code', value: match[6] });
    } else if (match[7]) {
      result.push({ type: 'code', value: match[7] });
    }
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.substring(lastIndex) });
  }
  
  return result;
}

const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code 
    className="font-bold font-mono px-1 sm:px-1.5 py-0.5 mx-0.5 rounded shadow-[2px_2px_0px_#121212] text-sm sm:text-base inline-block my-0.5 lg:my-0"
    style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      backgroundColor: '#BFDBFE',
      border: '2px solid #121212',
      color: '#000000',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}
  >
    {children}
  </code>
);

function syntaxHighlight(code: string) {
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  html = html.replace(/(#.*)/g, '<span style="color: #8b949e; font-style: italic;">$1</span>');
  
  html = html.replace(/("[^"]*")/g, '<span style="color: #7ee787;">$1</span>');
  html = html.replace(/('[^']*')/g, '<span style="color: #7ee787;">$1</span>');
  
  html = html.replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color: #f2cc60;">$1</span>');
  
  const kwRegex = new RegExp(`\\b(${Array.from(PYTHON_KEYWORDS).join('|')})\\b`, 'g');
  html = html.replace(kwRegex, '<span style="color: #ff7b72;">$1</span>');
  
  const builtRegex = new RegExp(`\\b(${Array.from(BUILTINS).join('|')})\\b`, 'g');
  html = html.replace(builtRegex, '<span style="color: #79c0ff;">$1</span>');

  return html;
}

const CodeBlock: React.FC<{ lang: string; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const lines = code.trimEnd().split('\n');
  
  return (
    <div className="rounded-lg overflow-hidden my-2 sm:my-4 border border-[#30363d] shadow-[4px_4px_0px_#121212] font-mono text-[13px] sm:text-sm leading-relaxed w-full max-w-full" style={{ backgroundColor: '#0d1117' }}>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2" style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <span className="text-[#8b949e] text-[10px] sm:text-xs font-semibold uppercase tracking-wider ml-1 sm:ml-2">{lang || 'text'}</span>
        </div>
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(); }}
          className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1"
        >
          {copied ? <Check size={14} className="text-[#3fb950]" /> : <Copy size={14} />}
          <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Sao chép'}</span>
        </button>
      </div>
      
      <div className="p-2 sm:p-4 overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="flex min-w-max">
          <div className="flex flex-col text-right pr-2 sm:pr-4 select-none mr-2 sm:mr-4 border-r border-[#30363d]" style={{ color: '#374151' }}>
            {lines.map((_, i) => (
              <span key={i} className="px-1 sm:px-2">{i + 1}</span>
            ))}
          </div>
          <div className="flex flex-col text-[#c9d1d9] whitespace-pre">
            {lines.map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) || ' ' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContentRenderer: React.FC<{ content?: string; className?: string }> = ({ content, className = '' }) => {
  if (!content) return null;
  
  let processedContent = content;
  
  // Custom heuristic to auto-format un-fenced python code from question banks
  if (processedContent.includes('\n') && !processedContent.includes('```')) {
    const firstNewline = processedContent.indexOf('\n');
    const firstLine = processedContent.substring(0, firstNewline).trim();
    const rest = processedContent.substring(firstNewline + 1);
    
    const isPrompt = /(:|\?)$/.test(firstLine) || /(đoạn mã|đoạn code|câu lệnh)/i.test(firstLine);
    const hasPythonTokens = /(\bimport\b|\bdef\b|\bprint\s*\(|\bpd\.|np\.|plt\.|df\.|sns\.|\[.*for.*in.*\]|[a-zA-Z_][a-zA-Z0-9_]*\s*=(?!=))/.test(rest);
    
    if (isPrompt && hasPythonTokens) {
       processedContent = `${firstLine}\n\`\`\`python\n${rest}\n\`\`\``;
    }
  }

  const blocks = parseFenced(processedContent);
  
  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'block') {
          return <CodeBlock key={idx} lang={block.lang} code={block.value} />;
        }
        
        const inlines = parseInline(block.value);
        return (
          <span key={idx}>
            {inlines.map((inline, iIdx) => {
              if (inline.type === 'code') {
                return <InlineCode key={iIdx}>{inline.value}</InlineCode>;
              }
              // Normal text might have newlines, but whitespace-pre-wrap handles it
              return <span key={iIdx}>{inline.value}</span>;
            })}
          </span>
        );
      })}
    </div>
  );
};
