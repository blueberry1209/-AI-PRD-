/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  Layout, 
  Gamepad2, 
  Bot, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  Check, 
  Loader2,
  ArrowRight,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type TemplateType = 'WEB' | 'GAME' | 'AI';

interface Template {
  id: TemplateType;
  title: string;
  description: string;
  examples: string;
  icon: React.ReactNode;
  color: string;
}

// --- Constants ---

const TEMPLATES: Template[] = [
  {
    id: 'WEB',
    title: '웹페이지 / 소개형',
    description: '정보를 깔끔하게 보여주고 싶을 때 선택하세요.',
    examples: '포트폴리오, 랜딩 페이지, 회사 소개 등',
    icon: <Layout className="w-6 h-6" />,
    color: 'bg-blue-50 text-muted-blue border-blue-100'
  },
  {
    id: 'GAME',
    title: '게임 / 인터랙티브',
    description: '사용자가 직접 조작하고 즐기는 앱에 딱 맞아요.',
    examples: '퀴즈, 테트리스, 미니게임, 시뮬레이션 등',
    icon: <Gamepad2 className="w-6 h-6" />,
    color: 'bg-purple-50 text-purple-600 border-purple-100'
  },
  {
    id: 'AI',
    title: 'AI 활용 서비스',
    description: 'AI의 똑똑한 기능을 핵심으로 쓰고 싶을 때 좋아요.',
    examples: '챗봇, 이미지 생성, 데이터 분석 도구 등',
    icon: <Bot className="w-6 h-6" />,
    color: 'bg-sage/10 text-sage border-sage/20'
  }
];

const SYSTEM_INSTRUCTIONS: Record<TemplateType, string> = {
  WEB: `당신은 친절하고 전문적인 제품 관리자(PM)입니다. 사용자의 아이디어를 바탕으로 '웹페이지/소개형' 프로젝트를 위한 읽기 편하고 상세한 제품 요구 사항 문서(PRD)를 작성해 주세요.
바이브코딩 도구(Cursor, v0 등)가 바로 이해할 수 있도록 구체적이면서도, 사람이 읽었을 때 편안하고 명확한 문체를 사용하세요.

문서는 반드시 한국어로 작성하며, 다음 구조를 따릅니다:

1. ✨ 서비스 이름: (아이디어를 잘 나타내는 멋진 이름)
2. 📝 한 줄 요약: (누가, 무엇을 위해 사용하는 서비스인지 쉽고 명확하게)
3. 🎨 디자인 컨셉: (전체적인 분위기, 추천 컬러, 사용자에게 주고 싶은 느낌)
4. 📱 화면 구성 (구체적으로):
   - 첫 화면 (히어로): 방문자가 처음 보게 될 핵심 문구와 구성
   - 소개 영역: 서비스의 가치를 전달하는 방법
   - 메인 콘텐츠: 리스트나 카드 등 정보를 보여주는 방식
   - 하단/연락처: 마무리 구성
5. 💡 특별한 포인트: (사용자 경험을 높여줄 작은 디테일이나 애니메이션 제안)

작성 규칙:
- 딱딱한 전문 용어보다는 누구나 이해할 수 있는 쉬운 단어를 사용하세요.
- 마크다운을 활용해 시각적으로 읽기 좋게(불렛 포인트, 굵은 글씨 등) 구성하세요.`,

  GAME: `당신은 창의적인 게임 디자이너입니다. 사용자의 아이디어를 바탕으로 '게임/인터랙티브' 프로젝트를 위한 재미있고 명확한 제품 요구 사항 문서(PRD)를 작성해 주세요.
바이브코딩 도구가 즉시 코드로 옮길 수 있도록 규칙은 상세하게, 설명은 친절하게 작성하세요.

문서는 반드시 한국어로 작성하며, 다음 구조를 따릅니다:

1. 🎮 게임 이름: (재치 있고 기억에 남는 이름)
2. 🕹️ 게임 컨셉: (어떤 재미를 주는 게임인지 한눈에 알 수 있게)
3. 🎨 비주얼 스타일: (게임의 분위기, 캐릭터/배경 느낌, 색감 제안)
4. 📜 핵심 규칙 (쉽게 설명):
   - 목표: 어떻게 하면 이기나요?
   - 방법: 어떤 버튼을 누르고 어떻게 움직이나요?
   - 점수: 언제 점수가 오르고 내리나요?
5. 🖥️ 화면 구성:
   - 대기 화면: 시작 전 설레는 첫 화면
   - 플레이 화면: 게임이 진행되는 중심 화면과 UI 요소
   - 결과 화면: 점수 확인과 다시 도전하고 싶은 마음이 들게 하는 구성
6. ✨ 생동감 넘치는 효과: (소리나 움직임 등 게임의 맛을 살려줄 아이디어)

작성 규칙:
- 읽는 사람이 게임의 재미를 상상할 수 있도록 생생하게 묘사하세요.
- 마크다운을 활용해 구조를 한눈에 파악할 수 있게 하세요.`,

  AI: `당신은 미래를 내다보는 AI 제품 PM입니다. 사용자의 아이디어를 바탕으로 'AI 활용 서비스'를 위한 똑똑하고 친절한 제품 요구 사항 문서(PRD)를 작성해 주세요.
AI의 역할이 명확히 드러나면서도 사용자가 이용하기 편안한 서비스가 되도록 기획하세요.

문서는 반드시 한국어로 작성하며, 다음 구조를 따릅니다:

1. 🤖 서비스 이름: (미래지향적이면서 친근한 이름)
2. 💡 서비스 핵심: (AI가 어떤 마법을 부려주는지 쉽고 명확하게)
3. 🎨 UI/UX 스타일: (사용자가 편안함을 느낄 수 있는 디자인 제안)
4. 🧠 AI의 역할:
   - AI가 해주는 일: 구체적으로 어떤 고민을 해결해주나요?
   - 결과물의 모습: 사용자에게 어떤 형태로 답변이나 결과가 전달되나요?
   - AI의 성격: 친절한 친구 같은지, 냉철한 전문가 같은지 정의
5. 📱 화면 구성:
   - 입력 화면: 사용자가 아이디어나 데이터를 넣는 곳
   - 결과 화면: AI의 마법이 펼쳐지는 곳
   - 추가 기능: 다시 하기, 저장하기 등 편리한 기능
6. ✨ 센스 있는 연출: (기다리는 시간도 즐겁게 만드는 로딩 효과 등)

작성 규칙:
- AI 기술이 어렵게 느껴지지 않도록 따뜻하고 쉬운 문장을 사용하세요.
- 마크다운을 적절히 섞어 가독성을 극대화하세요.`
};

// --- App Component ---

export default function App() {
  const [idea, setIdea] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [generatedPrd, setGeneratedPrd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!idea || !selectedTemplate) return;

    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `다음 아이디어를 바탕으로 멋진 기획서를 만들어 주세요: ${idea}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTIONS[selectedTemplate],
          temperature: 0.7,
        },
      });

      if (response.text) {
        setGeneratedPrd(response.text);
      } else {
        throw new Error('내용을 만드는 데 실패했어요.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('기획서를 만드는 도중 문제가 생겼어요. 잠시 후 다시 시도해 볼까요?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPrd) {
      navigator.clipboard.writeText(generatedPrd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setGeneratedPrd(null);
    setIdea('');
    setSelectedTemplate(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-4 bg-sage/10 rounded-full mb-2"
          >
            <Sparkles className="w-8 h-8 text-sage" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-navy sm:text-5xl"
          >
            바이브코딩 AI 기획 비서
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            복잡한 생각은 그만! 아이디어만 적어주시면<br className="hidden sm:block" />
            AI가 바로 코딩 가능한 상세 기획서로 정리해 드려요.
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!generatedPrd ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white shadow-md rounded-2xl p-10 border border-slate-100 space-y-10"
            >
              {/* Step 1: Idea Input */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <label htmlFor="idea" className="text-lg font-bold text-navy">
                    어떤 앱을 만들고 싶으신가요?
                  </label>
                </div>

                {/* Always Visible Checklist */}
                <div className="bg-beige border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-sage uppercase tracking-wider">아이디어를 잘 적는 팁 ✨</h4>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-3 leading-relaxed">
                    <li className="flex items-start">
                      <span className="text-sage mr-3 font-bold">1.</span>
                      <span><span className="font-bold text-navy">무엇을 하나요?</span> (예: 남은 재료로 요리를 추천해주는 앱)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sage mr-3 font-bold">2.</span>
                      <span><span className="font-bold text-navy">누가 사용하나요?</span> (예: 자취생이나 요리 초보자)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sage mr-3 font-bold">3.</span>
                      <span><span className="font-bold text-navy">핵심 기능은?</span> (예: 재료 입력 시 레시피와 조리법 안내)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-sage mr-3 font-bold">4.</span>
                      <span><span className="font-bold text-navy">화면 구성은?</span> (예: 입력 화면과 결과 화면 2개)</span>
                    </li>
                  </ul>
                </div>

                <textarea
                  id="idea"
                  rows={5}
                  className="block w-full rounded-2xl border-slate-200 shadow-sm focus:border-muted-blue focus:ring-muted-blue sm:text-base p-6 bg-white transition-all leading-relaxed placeholder-slate-300"
                  placeholder="여기에 자유롭게 아이디어를 적어주세요. 자세할수록 더 멋진 기획서가 나옵니다!"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
              </div>

              {/* Step 2: Template Selection */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <label className="text-lg font-bold text-navy">
                    가장 잘 어울리는 스타일을 골라주세요
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`relative flex flex-col p-7 rounded-2xl border-2 text-left transition-all hover:shadow-md group ${
                        selectedTemplate === template.id
                          ? `${template.color} border-muted-blue ring-2 ring-offset-2 ring-muted-blue/20`
                          : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className={`p-3 rounded-xl transition-colors ${selectedTemplate === template.id ? 'bg-white/80' : 'bg-beige group-hover:bg-slate-100'}`}>
                          {template.icon}
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="bg-muted-blue text-white rounded-full p-1.5 shadow-sm">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-navy text-lg mb-2">{template.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-grow">
                        {template.description}
                      </p>
                      <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">
                        예: {template.examples}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !idea || !selectedTemplate}
                  className={`w-full flex items-center justify-center py-5 px-8 rounded-2xl text-xl font-bold text-white transition-all shadow-md ${
                    isLoading || !idea || !selectedTemplate
                      ? 'bg-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-navy hover:bg-muted-blue active:scale-[0.99] shadow-navy/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                      AI가 기획서를 정성껏 만들고 있어요...
                    </>
                  ) : (
                    <>
                      나만의 기획서 만들기
                      <ArrowRight className="w-6 h-6 ml-3" />
                    </>
                  )}
                </button>
                {error && (
                  <p className="mt-5 text-center text-sm text-red-500 font-medium">
                    {error}
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-8"
            >
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-100">
                {/* Result Header */}
                <div className="bg-beige px-10 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-navy">
                    <FileText className="w-6 h-6" />
                    <span className="text-lg font-bold tracking-tight">AI가 완성한 기획서입니다 ✨</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleCopy}
                      className="flex items-center px-5 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-navy hover:bg-beige transition-colors shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-sage" />
                          복사 완료!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          내용 복사하기
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex items-center px-5 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-navy hover:bg-beige transition-colors shadow-sm"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      다시 만들기
                    </button>
                  </div>
                </div>

                {/* Markdown Content */}
                <div className="p-12 max-h-[75vh] overflow-y-auto bg-white custom-scrollbar">
                  <div className="markdown-body">
                    <ReactMarkdown>{generatedPrd}</ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Bottom Tip */}
              <div className="text-center text-slate-400 text-sm font-medium italic">
                팁: 이 내용을 복사해서 Cursor나 v0에 붙여넣으면 바로 코딩을 시작할 수 있어요!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-slate-400 text-xs uppercase tracking-widest font-medium">
        Powered by Gemini AI & Crafted with Care
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
