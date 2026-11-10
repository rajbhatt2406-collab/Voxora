import React from 'react';
import { CheckSquare, Sparkles, Award } from 'lucide-react';
import { Quiz, QuizSubmitResult } from '@/types';

interface LectureQuizTabProps {
  quiz: Quiz | undefined;
  quizResult: QuizSubmitResult | null;
  selectedAnswers: Record<string, string>;
  generating: boolean;
  onSelectAnswer: (qid: string, opt: string) => void;
  onSubmitQuiz: (quizId: string) => void;
  onGenerateQuiz: () => void;
}

export default function LectureQuizTab({
  quiz,
  quizResult,
  selectedAnswers,
  generating,
  onSelectAnswer,
  onSubmitQuiz,
  onGenerateQuiz,
}: LectureQuizTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {quiz?.title || 'Lecture Knowledge Check'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Test your comprehension with 4-choice questions and instant review</p>
        </div>
        <button
          onClick={onGenerateQuiz}
          disabled={generating}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
        >
          {quiz ? 'New Quiz' : 'Generate Quiz'}
        </button>
      </div>

      {quiz ? (
        <div className="space-y-8">
          {quizResult && (
            <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-2xl font-extrabold text-indigo-900">
                Your Score: {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
              </h4>
              <p className="text-xs text-indigo-700 mt-1">Review the answer breakdown and explanations below</p>
            </div>
          )}

          <div className="space-y-6">
            {quiz.questions.map((q, qIdx) => {
              const qid = String(q.id || `q${qIdx}`);
              const reviewItem = quizResult?.review.find((r) => r.id === qid);
              return (
                <div key={qid} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    <span className="text-indigo-600 mr-2">{qIdx + 1}.</span>
                    {q.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[qid] === opt;
                      let btnStyle = 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700';

                      if (quizResult && reviewItem) {
                        if (opt === reviewItem.correct_answer) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-xs';
                        } else if (isSelected && !reviewItem.is_correct) {
                          btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 line-through';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold shadow-xs';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            if (!quizResult) {
                              onSelectAnswer(qid, opt);
                            }
                          }}
                          className={`p-3.5 text-left rounded-xl border text-xs sm:text-sm transition-all flex items-center cursor-pointer ${btnStyle}`}
                        >
                          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {quizResult && reviewItem && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100 leading-relaxed">
                      <span className="font-bold text-slate-800">Explanation: </span>
                      {reviewItem.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!quizResult && (
            <button
              onClick={() => onSubmitQuiz(quiz.id)}
              disabled={Object.keys(selectedAnswers).length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all hover:shadow-lg"
            >
              Submit Quiz Answers
            </button>
          )}
        </div>
      ) : (
        <div className="p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">No quiz ready yet for this lecture.</p>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            Generate an interactive 5-question multiple choice test grounded in this lecture.
          </p>
          <button
            onClick={onGenerateQuiz}
            disabled={generating}
            className="inline-flex items-center px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate 5-Question Quiz
          </button>
        </div>
      )}
    </div>
  );
}

