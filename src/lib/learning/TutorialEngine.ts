// Interactive Tutorial Engine with Quizzes
import { v4 as uuidv4 } from 'uuid';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  media?: { type: 'image' | 'video'; url: string };
  action?: { type: 'highlight' | 'click' | 'input'; target: string };
  quiz?: QuizQuestion;
  duration?: number; // estimated seconds
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'getting_started' | 'scanning' | 'measurement' | 'analysis' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: TutorialStep[];
  estimatedTime: number; // minutes
  prerequisites?: string[];
  tags: string[];
}

export interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completedSteps: string[];
  quizScores: { questionId: string; correct: boolean }[];
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface TutorialStats {
  totalTutorials: number;
  completedTutorials: number;
  inProgressTutorials: number;
  totalQuizScore: number;
  averageScore: number;
  totalTimeSpent: number; // minutes
  streakDays: number;
}

const PROGRESS_KEY = 'tutorial_progress';

// Built-in tutorials
const BUILT_IN_TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of the scanner application',
    category: 'getting_started',
    difficulty: 'beginner',
    estimatedTime: 5,
    tags: ['basics', 'introduction'],
    steps: [
      {
        id: 'gs-1',
        title: 'Welcome to the Scanner',
        content: 'This tutorial will guide you through the basic features of the application. The scanner uses advanced AI to analyze images and provide accurate measurements.',
      },
      {
        id: 'gs-2',
        title: 'Understanding the Interface',
        content: 'The main interface consists of three areas: the camera view, the control panel, and the results display. Let\'s explore each one.',
        action: { type: 'highlight', target: '#main-interface' }
      },
      {
        id: 'gs-3',
        title: 'Quick Quiz',
        content: 'Let\'s test your understanding so far.',
        quiz: {
          id: 'q-gs-1',
          question: 'What are the three main areas of the interface?',
          options: ['Camera, Settings, Help', 'Camera, Controls, Results', 'Menu, Camera, Export'],
          correctIndex: 1,
          explanation: 'The interface has the camera view for capturing, control panel for settings, and results display for analysis.'
        }
      },
      {
        id: 'gs-4',
        title: 'Your First Scan',
        content: 'To perform your first scan, position your device steadily and tap the capture button. The AR overlay will guide you for optimal positioning.',
        action: { type: 'highlight', target: '#capture-button' }
      }
    ]
  },
  {
    id: 'ar-measurement',
    title: 'AR Measurement Guide',
    description: 'Master the AR measurement overlay system',
    category: 'measurement',
    difficulty: 'intermediate',
    estimatedTime: 8,
    tags: ['ar', 'measurement', 'accuracy'],
    steps: [
      {
        id: 'ar-1',
        title: 'Introduction to AR Overlay',
        content: 'The AR measurement overlay provides real-time guidance for accurate scanning. It uses computer vision to detect reference points and calculate measurements.',
      },
      {
        id: 'ar-2',
        title: 'Understanding Quality Indicators',
        content: 'The quality indicator shows your current scan quality based on lighting, stability, angle, distance, and focus. Aim for a score above 80% for best results.',
        quiz: {
          id: 'q-ar-1',
          question: 'What minimum quality score should you aim for?',
          options: ['50%', '70%', '80%', '90%'],
          correctIndex: 2,
          explanation: 'A quality score above 80% ensures optimal measurement accuracy.'
        }
      },
      {
        id: 'ar-3',
        title: 'Following Position Prompts',
        content: 'The positioning prompts will guide you with arrows and instructions. Follow them to achieve the optimal camera position.',
      },
      {
        id: 'ar-4',
        title: 'Detecting Reference Points',
        content: 'Reference points appear as circles on the overlay. Green points indicate high confidence, while yellow or red points may need adjustment.',
        quiz: {
          id: 'q-ar-2',
          question: 'What do green reference points indicate?',
          options: ['Low confidence', 'Medium confidence', 'High confidence', 'Error'],
          correctIndex: 2,
          explanation: 'Green reference points indicate high detection confidence.'
        }
      }
    ]
  },
  {
    id: 'advanced-analysis',
    title: 'Advanced Analysis Features',
    description: 'Deep dive into health prediction and trend analysis',
    category: 'analysis',
    difficulty: 'advanced',
    estimatedTime: 12,
    prerequisites: ['getting-started', 'ar-measurement'],
    tags: ['analysis', 'prediction', 'trends'],
    steps: [
      {
        id: 'aa-1',
        title: 'Health Prediction Engine',
        content: 'The health prediction engine uses machine learning to analyze your measurement history and identify trends.',
      },
      {
        id: 'aa-2',
        title: 'Understanding Trends',
        content: 'Trends are calculated using moving averages and regression analysis. An upward trend indicates increasing values, while a downward trend shows decreasing values.',
        quiz: {
          id: 'q-aa-1',
          question: 'What analysis method is used for trend calculation?',
          options: ['Simple average', 'Moving averages and regression', 'Random sampling', 'Static comparison'],
          correctIndex: 1,
          explanation: 'Moving averages and regression analysis provide accurate trend detection.'
        }
      },
      {
        id: 'aa-3',
        title: 'Risk Assessment',
        content: 'The risk assessment system evaluates your measurements against normal ranges and generates recommendations.',
      }
    ]
  }
];

export class TutorialEngine {
  private tutorials: Map<string, Tutorial> = new Map();
  private progress: Map<string, TutorialProgress> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    BUILT_IN_TUTORIALS.forEach(t => this.tutorials.set(t.id, t));
    this.loadProgress();
  }

  private loadProgress(): void {
    try {
      const data = localStorage.getItem(PROGRESS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((p: TutorialProgress) => this.progress.set(p.tutorialId, p));
      }
    } catch (e) {
      console.error('Failed to load tutorial progress:', e);
    }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(Array.from(this.progress.values())));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save tutorial progress:', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb());
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  getTutorial(id: string): Tutorial | undefined {
    return this.tutorials.get(id);
  }

  getTutorialsByCategory(category: Tutorial['category']): Tutorial[] {
    return this.getTutorials().filter(t => t.category === category);
  }

  getProgress(tutorialId: string): TutorialProgress | undefined {
    return this.progress.get(tutorialId);
  }

  startTutorial(tutorialId: string): TutorialProgress {
    const existing = this.progress.get(tutorialId);
    if (existing && !existing.completedAt) {
      existing.lastAccessedAt = new Date().toISOString();
      this.saveProgress();
      return existing;
    }

    const progress: TutorialProgress = {
      tutorialId,
      currentStep: 0,
      completedSteps: [],
      quizScores: [],
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };
    this.progress.set(tutorialId, progress);
    this.saveProgress();
    return progress;
  }

  completeStep(tutorialId: string, stepId: string): TutorialProgress | null {
    const progress = this.progress.get(tutorialId);
    const tutorial = this.tutorials.get(tutorialId);
    if (!progress || !tutorial) return null;

    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
    }
    progress.currentStep = Math.min(progress.currentStep + 1, tutorial.steps.length - 1);
    progress.lastAccessedAt = new Date().toISOString();

    if (progress.completedSteps.length >= tutorial.steps.length) {
      progress.completedAt = new Date().toISOString();
    }

    this.saveProgress();
    return progress;
  }

  submitQuizAnswer(tutorialId: string, questionId: string, answerIndex: number): { correct: boolean; explanation: string } {
    const progress = this.progress.get(tutorialId);
    const tutorial = this.tutorials.get(tutorialId);
    if (!progress || !tutorial) return { correct: false, explanation: 'Invalid tutorial' };

    const step = tutorial.steps.find(s => s.quiz?.id === questionId);
    if (!step?.quiz) return { correct: false, explanation: 'Question not found' };

    const correct = answerIndex === step.quiz.correctIndex;
    progress.quizScores.push({ questionId, correct });
    this.saveProgress();

    return { correct, explanation: step.quiz.explanation };
  }

  getStats(): TutorialStats {
    const allProgress = Array.from(this.progress.values());
    const completed = allProgress.filter(p => p.completedAt);
    const inProgress = allProgress.filter(p => !p.completedAt);
    const allQuizScores = allProgress.flatMap(p => p.quizScores);
    const correctAnswers = allQuizScores.filter(s => s.correct).length;

    return {
      totalTutorials: this.tutorials.size,
      completedTutorials: completed.length,
      inProgressTutorials: inProgress.length,
      totalQuizScore: correctAnswers,
      averageScore: allQuizScores.length > 0 ? Math.round((correctAnswers / allQuizScores.length) * 100) : 0,
      totalTimeSpent: completed.reduce((sum, p) => {
        const tutorial = this.tutorials.get(p.tutorialId);
        return sum + (tutorial?.estimatedTime || 0);
      }, 0),
      streakDays: this.calculateStreak()
    };
  }

  private calculateStreak(): number {
    const allProgress = Array.from(this.progress.values());
    const dates = allProgress.map(p => p.lastAccessedAt.split('T')[0]);
    const uniqueDates = [...new Set(dates)].sort().reverse();
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }

  isCompleted(tutorialId: string): boolean {
    return !!this.progress.get(tutorialId)?.completedAt;
  }

  resetProgress(tutorialId: string): void {
    this.progress.delete(tutorialId);
    this.saveProgress();
  }

  resetAllProgress(): void {
    this.progress.clear();
    this.saveProgress();
  }
}

let instance: TutorialEngine | null = null;
export function getTutorialEngine(): TutorialEngine {
  if (!instance) instance = new TutorialEngine();
  return instance;
}
