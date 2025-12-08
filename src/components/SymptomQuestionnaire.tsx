import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: { value: string; label: string; score: number }[];
  category: string;
}

const questions: Question[] = [
  {
    id: 'q1',
    text: 'Have you noticed a curved or bent appearance of your penis during erection?',
    category: 'Curvature',
    options: [
      { value: 'none', label: 'No curvature', score: 0 },
      { value: 'mild', label: 'Slight curve (less than 30°)', score: 1 },
      { value: 'moderate', label: 'Moderate curve (30-60°)', score: 2 },
      { value: 'severe', label: 'Significant curve (more than 60°)', score: 3 },
    ],
  },
  {
    id: 'q2',
    text: 'Do you feel a hardened area or plaque under the skin of your penis?',
    category: 'Plaque',
    options: [
      { value: 'none', label: 'No hardened areas', score: 0 },
      { value: 'small', label: 'Small, barely noticeable', score: 1 },
      { value: 'moderate', label: 'Noticeable hardened area', score: 2 },
      { value: 'large', label: 'Large or multiple areas', score: 3 },
    ],
  },
  {
    id: 'q3',
    text: 'Do you experience pain during erection?',
    category: 'Pain',
    options: [
      { value: 'none', label: 'No pain', score: 0 },
      { value: 'mild', label: 'Mild discomfort', score: 1 },
      { value: 'moderate', label: 'Moderate pain', score: 2 },
      { value: 'severe', label: 'Severe pain', score: 3 },
    ],
  },
  {
    id: 'q4',
    text: 'Has the curvature changed over time?',
    category: 'Progression',
    options: [
      { value: 'stable', label: 'No change / Not applicable', score: 0 },
      { value: 'improving', label: 'Getting better', score: 0 },
      { value: 'slow', label: 'Slowly getting worse', score: 2 },
      { value: 'rapid', label: 'Rapidly getting worse', score: 3 },
    ],
  },
  {
    id: 'q5',
    text: 'Have you noticed any shortening of your penis?',
    category: 'Size Changes',
    options: [
      { value: 'none', label: 'No shortening noticed', score: 0 },
      { value: 'slight', label: 'Slight shortening', score: 1 },
      { value: 'moderate', label: 'Noticeable shortening', score: 2 },
      { value: 'significant', label: 'Significant shortening', score: 3 },
    ],
  },
  {
    id: 'q6',
    text: 'Do you experience erectile dysfunction?',
    category: 'Erectile Function',
    options: [
      { value: 'none', label: 'No difficulty', score: 0 },
      { value: 'occasional', label: 'Occasional difficulty', score: 1 },
      { value: 'frequent', label: 'Frequent difficulty', score: 2 },
      { value: 'severe', label: 'Unable to achieve/maintain', score: 3 },
    ],
  },
  {
    id: 'q7',
    text: 'Does the condition affect your intimate relationships?',
    category: 'Quality of Life',
    options: [
      { value: 'none', label: 'No impact', score: 0 },
      { value: 'mild', label: 'Minor impact', score: 1 },
      { value: 'moderate', label: 'Moderate impact', score: 2 },
      { value: 'severe', label: 'Significant impact', score: 3 },
    ],
  },
  {
    id: 'q8',
    text: 'How long have you been experiencing these symptoms?',
    category: 'Duration',
    options: [
      { value: 'recent', label: 'Less than 3 months', score: 1 },
      { value: 'months', label: '3-12 months', score: 2 },
      { value: 'year', label: '1-2 years', score: 2 },
      { value: 'years', label: 'More than 2 years', score: 1 },
    ],
  },
];

export const SymptomQuestionnaire = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: value }));
  };

  const calculateScore = () => {
    return questions.reduce((total, q) => {
      const answer = answers[q.id];
      const option = q.options.find(o => o.value === answer);
      return total + (option?.score || 0);
    }, 0);
  };

  const getResultCategory = (score: number) => {
    if (score <= 5) return { level: 'low', label: 'Low Risk', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (score <= 12) return { level: 'moderate', label: 'Moderate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { level: 'high', label: 'Consult Doctor', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const score = calculateScore();
  const result = getResultCategory(score);

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl gradient-text">Assessment Results</CardTitle>
            <CardDescription>Based on your responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold gradient-text mb-2">{score}</div>
              <p className="text-muted-foreground">out of 24 points</p>
              <Badge className={`mt-4 text-lg px-4 py-2 ${result.color}`}>
                {result.label}
              </Badge>
            </div>

            <div className="space-y-4 pt-4">
              {result.level === 'low' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-400">Low Risk Indicators</p>
                    <p className="text-sm text-muted-foreground">
                      Your symptoms appear mild. Continue monitoring and maintain regular health check-ups.
                    </p>
                  </div>
                </div>
              )}

              {result.level === 'moderate' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-400">Moderate Symptoms</p>
                    <p className="text-sm text-muted-foreground">
                      Consider scheduling an appointment with a urologist to discuss your symptoms and explore treatment options.
                    </p>
                  </div>
                </div>
              )}

              {result.level === 'high' && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-400">Consultation Recommended</p>
                    <p className="text-sm text-muted-foreground">
                      Your symptoms suggest you should consult a urologist soon. Early treatment can help prevent progression.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Disclaimer:</strong> This questionnaire is for informational purposes only 
                  and does not constitute medical advice. Always consult a qualified healthcare professional for proper diagnosis and treatment.
                </p>
              </div>
            </div>

            <Button 
              onClick={() => { setShowResults(false); setCurrentQuestion(0); setAnswers({}); }}
              className="w-full gradient-primary"
            >
              Take Assessment Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg gradient-primary">
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {currentQ.category}
            </Badge>
          </div>
          <CardTitle className="text-xl">Peyronie's Disease Self-Assessment</CardTitle>
          <CardDescription>Question {currentQuestion + 1} of {questions.length}</CardDescription>
          <Progress value={progress} className="mt-4 h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-medium">{currentQ.text}</p>

          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQ.options.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                  answers[currentQ.id] === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 hover:border-primary/50 bg-muted/20'
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="cursor-pointer flex-1">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={() => setShowResults(true)}
                disabled={!answers[currentQ.id]}
                className="gradient-primary"
              >
                View Results
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!answers[currentQ.id]}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
