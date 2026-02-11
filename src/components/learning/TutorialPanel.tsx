// Interactive Tutorial Panel Component
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Play,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  Award,
  RefreshCw,
  Clock,
  Star,
} from "lucide-react";
import {
  getTutorialEngine,
  Tutorial,
  TutorialProgress,
  TutorialStats,
  QuizQuestion,
} from "@/lib/learning/TutorialEngine";
import { cn } from "@/lib/utils";

interface TutorialPanelProps {
  className?: string;
}

export const TutorialPanel: React.FC<TutorialPanelProps> = ({ className }) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [stats, setStats] = useState<TutorialStats | null>(null);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [activeProgress, setActiveProgress] = useState<TutorialProgress | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{ correct: boolean; explanation: string } | null>(
    null,
  );
  const engine = getTutorialEngine();

  useEffect(() => {
    refresh();
    return engine.subscribe(refresh);
  }, []);

  const refresh = () => {
    setTutorials(engine.getTutorials());
    setStats(engine.getStats());
  };

  const startTutorial = (tutorial: Tutorial) => {
    const progress = engine.startTutorial(tutorial.id);
    setActiveTutorial(tutorial);
    setActiveProgress(progress);
    setQuizAnswer(null);
    setQuizResult(null);
  };

  const nextStep = () => {
    if (!activeTutorial || !activeProgress) return;
    const currentStep = activeTutorial.steps[activeProgress.currentStep];
    engine.completeStep(activeTutorial.id, currentStep.id);
    setActiveProgress(engine.getProgress(activeTutorial.id) || null);
    setQuizAnswer(null);
    setQuizResult(null);
  };

  const prevStep = () => {
    if (!activeTutorial || !activeProgress || activeProgress.currentStep === 0) return;
    activeProgress.currentStep--;
    setActiveProgress({ ...activeProgress });
    setQuizAnswer(null);
    setQuizResult(null);
  };

  const submitQuiz = (quiz: QuizQuestion) => {
    if (quizAnswer === null || !activeTutorial) return;
    const result = engine.submitQuizAnswer(activeTutorial.id, quiz.id, quizAnswer);
    setQuizResult(result);
  };

  const closeTutorial = () => {
    setActiveTutorial(null);
    setActiveProgress(null);
    setQuizAnswer(null);
    setQuizResult(null);
    refresh();
  };

  const getDifficultyColor = (d: string) => {
    if (d === "beginner") return "text-green-400 bg-green-500/20";
    if (d === "intermediate") return "text-yellow-400 bg-yellow-500/20";
    return "text-red-400 bg-red-500/20";
  };

  // Active Tutorial View
  if (activeTutorial && activeProgress) {
    const currentStep = activeTutorial.steps[activeProgress.currentStep];
    const isCompleted = !!activeProgress.completedAt;
    const progress = (activeProgress.completedSteps.length / activeTutorial.steps.length) * 100;

    return (
      <div className={cn("p-4 space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={closeTutorial}
            className="text-gray-400 hover:text-white flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-sm text-gray-400">
            {activeProgress.currentStep + 1} / {activeTutorial.steps.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 min-h-[300px]"
          >
            <h3 className="text-xl font-bold text-white mb-4">{currentStep.title}</h3>
            <p className="text-gray-300 leading-relaxed mb-6">{currentStep.content}</p>

            {/* Quiz Section */}
            {currentStep.quiz && (
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-white mb-3">{currentStep.quiz.question}</h4>
                <div className="space-y-2">
                  {currentStep.quiz.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => !quizResult && setQuizAnswer(idx)}
                      disabled={!!quizResult}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg border transition-all",
                        quizAnswer === idx
                          ? quizResult
                            ? quizResult.correct
                              ? "bg-green-500/30 border-green-500"
                              : "bg-red-500/30 border-red-500"
                            : "bg-blue-500/30 border-blue-500"
                          : "bg-gray-800 border-gray-600 hover:border-gray-500",
                        quizResult &&
                          idx === currentStep.quiz!.correctIndex &&
                          "bg-green-500/30 border-green-500",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {!quizResult && quizAnswer !== null && (
                  <button
                    onClick={() => submitQuiz(currentStep.quiz!)}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium"
                  >
                    Submit Answer
                  </button>
                )}
                {quizResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "mt-4 p-3 rounded-lg",
                      quizResult.correct
                        ? "bg-green-500/20 border border-green-500/50"
                        : "bg-red-500/20 border border-red-500/50",
                    )}
                  >
                    <p className={quizResult.correct ? "text-green-400" : "text-red-400"}>
                      {quizResult.correct ? "✓ Correct!" : "✗ Incorrect"}
                    </p>
                    <p className="text-gray-300 text-sm mt-1">{quizResult.explanation}</p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            onClick={prevStep}
            disabled={activeProgress.currentStep === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={isCompleted ? closeTutorial : nextStep}
            disabled={currentStep.quiz && !quizResult}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCompleted
              ? "Finish"
              : activeProgress.currentStep === activeTutorial.steps.length - 1
                ? "Complete"
                : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Tutorial List View
  return (
    <div className={cn("p-4 space-y-6", className)}>
      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">
              {stats.completedTutorials}/{stats.totalTutorials}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{stats.averageScore}%</div>
            <div className="text-xs text-gray-400">Quiz Score</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
            <div className="text-2xl font-bold text-purple-400">{stats.totalTimeSpent}m</div>
            <div className="text-xs text-gray-400">Time Spent</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
            <div className="text-2xl font-bold text-amber-400">{stats.streakDays}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Interactive Tutorials</h3>
      </div>

      {/* Tutorial List */}
      <div className="space-y-3">
        {tutorials.map(tutorial => {
          const progress = engine.getProgress(tutorial.id);
          const isCompleted = engine.isCompleted(tutorial.id);
          const progressPercent = progress
            ? (progress.completedSteps.length / tutorial.steps.length) * 100
            : 0;

          return (
            <motion.div
              key={tutorial.id}
              whileHover={{ scale: 1.01 }}
              className={cn(
                "bg-gray-800/50 rounded-xl p-4 border transition-all cursor-pointer",
                isCompleted ? "border-green-500/50" : "border-gray-700 hover:border-blue-500/50",
              )}
              onClick={() => startTutorial(tutorial)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : progress ? (
                      <Circle className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Play className="w-5 h-5 text-gray-400" />
                    )}
                    <h4 className="font-semibold text-white">{tutorial.title}</h4>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{tutorial.description}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={cn("px-2 py-0.5 rounded", getDifficultyColor(tutorial.difficulty))}
                    >
                      {tutorial.difficulty}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {tutorial.estimatedTime} min
                    </span>
                    <span className="text-gray-500">{tutorial.steps.length} steps</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              {progress && !isCompleted && (
                <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialPanel;
