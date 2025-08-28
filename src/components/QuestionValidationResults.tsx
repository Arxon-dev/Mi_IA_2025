import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Info, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ValidationIssue {
  type: 'format' | 'content' | 'distractor' | 'difficulty' | 'quality';
  description: string;
  severity: 'warning' | 'error';
}

interface ValidationResultsProps {
  validCount: number;
  totalCount: number;
  score: number;
  commonIssues: { [key: string]: number };
  recommendations: string[];
  distractorLengthWarnings?: { index: number; question: string }[];
  issuesByType?: { [description: string]: { index: number; question: string }[] };
  doubleValidation?: boolean;
  structuralValidation?: {
    validCount: number;
    score: number;
    issues: { [key: string]: number };
  };
  aiValidation?: {
    validCount: number;
    totalCount: number;
    feedbacks: string[];
    invalidQuestions: string[];
  };
}

const QuestionValidationResults: React.FC<ValidationResultsProps> = ({
  validCount,
  totalCount,
  score,
  commonIssues,
  recommendations,
  distractorLengthWarnings = [],
  issuesByType = {},
  doubleValidation = false,
  structuralValidation,
  aiValidation
}) => {
  const [showStructuralDetails, setShowStructuralDetails] = useState(false);
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [showConsensusList, setShowConsensusList] = useState(false);
  
  const percentValid = Math.round((validCount / totalCount) * 100);
  
  if (doubleValidation && structuralValidation && aiValidation) {
    const structuralPercent = Math.round((structuralValidation.validCount / totalCount) * 100);
    const aiPercent = Math.round((aiValidation.validCount / totalCount) * 100);
    const consensusPercent = Math.round((validCount / totalCount) * 100);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Resultados de Validación Doble</span>
            </CardTitle>
            <CardDescription>
              Análisis completo con validación estructural e inteligencia artificial
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Consensus Results */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Consenso Final</span>
              <Badge variant="secondary">Ambos Métodos</Badge>
            </CardTitle>
            <CardDescription>
              Preguntas aprobadas por validación estructural e IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{validCount}</p>
                  <p className="text-sm text-muted-foreground">de {totalCount} preguntas</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{consensusPercent}%</p>
                  <p className="text-sm text-muted-foreground">Aprobación</p>
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all duration-500",
                    consensusPercent >= 90 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    consensusPercent >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-red-600'
                  )}
                  style={{ width: `${consensusPercent}%` }}
                />
              </div>
              
              {validCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConsensusList(!showConsensusList)}
                  className="w-full"
                >
                  {showConsensusList ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Ocultar detalles
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Ver preguntas aprobadas
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Method Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Structural Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span>Validación Estructural</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Válidas:</span>
                  <span className="font-semibold">{structuralValidation.validCount}/{totalCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Porcentaje:</span>
                  <Badge variant={structuralPercent >= 80 ? 'default' : 'secondary'}>
                    {structuralPercent}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Puntuación:</span>
                  <span className="font-semibold">{structuralValidation.score?.toFixed(1) || 'N/A'}/100</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${structuralPercent}%` }}
                  />
                </div>
                
                {Object.keys(structuralValidation.issues).length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStructuralDetails(!showStructuralDetails)}
                    className="w-full"
                  >
                    {showStructuralDetails ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-2" />
                        Ocultar problemas
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-2" />
                        Ver {Object.keys(structuralValidation.issues).length} problemas
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span>Validación con IA</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Válidas:</span>
                  <span className="font-semibold">{aiValidation.validCount}/{totalCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Porcentaje:</span>
                  <Badge variant={aiPercent >= 80 ? 'default' : 'secondary'}>
                    {aiPercent}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inválidas:</span>
                  <span className="font-semibold text-destructive">{aiValidation.invalidQuestions.length}</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                    style={{ width: `${aiPercent}%` }}
                  />
                </div>
                
                {aiValidation.feedbacks.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAiDetails(!showAiDetails)}
                    className="w-full"
                  >
                    {showAiDetails ? (
                      <>
                        <ChevronUp className="w-3 h-3 mr-2" />
                        Ocultar feedback
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 mr-2" />
                        Ver feedback de IA
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        {showStructuralDetails && Object.keys(structuralValidation.issues).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Problemas Estructurales Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(structuralValidation.issues).map(([issue, count]) => (
                  <div key={issue} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm">{issue.split(':')[1] || issue}</span>
                    </div>
                    <Badge variant="secondary">{count} pregunta{count !== 1 ? 's' : ''}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showAiDetails && aiValidation.feedbacks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback Detallado de IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiValidation.feedbacks.map((feedback, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                    <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">
                      Pregunta {index + 1}:
                    </p>
                    <pre className="whitespace-pre-wrap text-xs text-foreground">{feedback}</pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showConsensusList && validCount > 0 && (
          <Alert variant="info">
            <Info className="h-4 w-4" />
            <AlertTitle>Preguntas Aprobadas por Consenso ({validCount})</AlertTitle>
            <AlertDescription>
              Estas preguntas fueron validadas exitosamente por ambos métodos: validación estructural y análisis con IA.
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-amber-500" />
                <span>Recomendaciones de Mejora</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Single validation design
  return (
    <div className="space-y-6">
      {/* Main Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span>Resultados de Validación</span>
          </CardTitle>
          <CardDescription>
            Análisis de calidad y estructura de las preguntas generadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{validCount}</p>
                <p className="text-sm text-muted-foreground">Preguntas Válidas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                <p className="text-sm text-muted-foreground">Total Generadas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{Math.round(score)}</p>
                <p className="text-sm text-muted-foreground">Puntuación /100</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Validez General</span>
                <Badge variant={percentValid >= 90 ? 'default' : percentValid >= 70 ? 'secondary' : 'destructive'}>
                  {percentValid}%
                </Badge>
              </div>
              
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all duration-500",
                    percentValid >= 90 ? 'bg-green-600' :
                    percentValid >= 70 ? 'bg-yellow-500' :
                    'bg-red-600'
                  )}
                  style={{ width: `${percentValid}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Detection */}
      {Object.keys(commonIssues).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Problemas Detectados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(commonIssues).map(([issue, count]) => {
                const [type, description] = issue.split(':');
                const normalizedDescription = description?.trim().toLowerCase();
                const matchingKey = Object.keys(issuesByType).find(key => key.trim().toLowerCase() === normalizedDescription);
                return (
                  <div key={issue} className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        )} />
                        <span className="text-sm font-medium">{description}</span>
                      </div>
                      <Badge variant="secondary">
                        {count} {count === 1 ? 'pregunta' : 'preguntas'}
                      </Badge>
                    </div>
                    
                    {matchingKey && issuesByType[matchingKey] && (
                      <div className="ml-4 p-3 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-r-lg">
                        <div className="space-y-2">
                          {issuesByType[matchingKey].map(({ index, question }) => (
                            <div key={index} className="text-xs">
                              <p className="font-bold mb-1">Pregunta {index + 1}:</p>
                              <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded border">
                                {question}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {Object.values(issuesByType).flat().length > 3 && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Si no ves todas las preguntas problemáticas, haz scroll en los detalles de cada problema.
                  </AlertDescription>
                </Alert>
              )}
              
              {distractorLengthWarnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-yellow-700 dark:text-yellow-300">
                    Preguntas con problema de longitud de distractores:
                  </h4>
                  <div className="space-y-2">
                    {distractorLengthWarnings.map(({ index, question }) => (
                      <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="font-bold text-sm mb-1">Pregunta {index + 1}:</p>
                        <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded border">
                          {question}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-500" />
              <span>Recomendaciones de Mejora</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionValidationResults; 