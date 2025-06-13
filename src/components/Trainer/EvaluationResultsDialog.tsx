import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface EvaluationResultsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: {
    id: string;
    type: string;
    studentName: string;
    studentId: string;
  };
}

export const EvaluationResultsDialog = ({
  isOpen,
  onOpenChange,
  evaluation
}: EvaluationResultsDialogProps) => {
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState({
    weight: '',
    height: '',
    bmi: '',
    bodyFat: '',
    muscleMass: '',
    waist: '',
    chest: '',
    arm: '',
    thigh: '',
    notes: '',
    goals: '',
    recommendations: ''
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const evaluationRef = doc(db, 'evaluations', evaluation.id);
      await updateDoc(evaluationRef, {
        status: 'completed',
        results: {
          ...results,
          completedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      toast.success('Resultados registrados com sucesso!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao registrar resultados:', error);
      toast.error('Erro ao registrar resultados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeFields = () => {
    switch (evaluation.type) {
      case 'fisica':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={results.weight}
                  onChange={(e) => setResults(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={results.height}
                  onChange={(e) => setResults(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bmi">IMC</Label>
                <Input
                  id="bmi"
                  type="number"
                  value={results.bmi}
                  onChange={(e) => setResults(prev => ({ ...prev, bmi: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bodyFat">% Gordura</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  value={results.bodyFat}
                  onChange={(e) => setResults(prev => ({ ...prev, bodyFat: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="waist">Cintura (cm)</Label>
                <Input
                  id="waist"
                  type="number"
                  value={results.waist}
                  onChange={(e) => setResults(prev => ({ ...prev, waist: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="chest">Peito (cm)</Label>
                <Input
                  id="chest"
                  type="number"
                  value={results.chest}
                  onChange={(e) => setResults(prev => ({ ...prev, chest: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="arm">Braço (cm)</Label>
                <Input
                  id="arm"
                  type="number"
                  value={results.arm}
                  onChange={(e) => setResults(prev => ({ ...prev, arm: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="thigh">Coxa (cm)</Label>
                <Input
                  id="thigh"
                  type="number"
                  value={results.thigh}
                  onChange={(e) => setResults(prev => ({ ...prev, thigh: e.target.value }))}
                />
              </div>
            </div>
          </>
        );
      case 'nutricional':
        return (
          <>
            <div>
              <Label htmlFor="goals">Objetivos Nutricionais</Label>
              <Textarea
                id="goals"
                value={results.goals}
                onChange={(e) => setResults(prev => ({ ...prev, goals: e.target.value }))}
                placeholder="Descreva os objetivos nutricionais do aluno..."
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="recommendations">Recomendações</Label>
              <Textarea
                id="recommendations"
                value={results.recommendations}
                onChange={(e) => setResults(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Forneça recomendações nutricionais..."
              />
            </div>
          </>
        );
      case 'performance':
        return (
          <>
            <div>
              <Label htmlFor="goals">Metas de Performance</Label>
              <Textarea
                id="goals"
                value={results.goals}
                onChange={(e) => setResults(prev => ({ ...prev, goals: e.target.value }))}
                placeholder="Descreva as metas de performance do aluno..."
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="recommendations">Recomendações</Label>
              <Textarea
                id="recommendations"
                value={results.recommendations}
                onChange={(e) => setResults(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Forneça recomendações de treino..."
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Registrar Resultados</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <h3 className="font-medium mb-1">
              {evaluation.type === 'fisica' ? 'Avaliação Física' :
               evaluation.type === 'nutricional' ? 'Avaliação Nutricional' :
               'Avaliação de Performance'}
            </h3>
            <p className="text-sm text-gray-500">Aluno: {evaluation.studentName}</p>
          </div>
          
          <div className="space-y-4">
            {getTypeFields()}
            
            <div className="mt-4">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={results.notes}
                onChange={(e) => setResults(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações relevantes..."
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar Resultados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 