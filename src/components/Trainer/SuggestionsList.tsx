
import React from 'react';
import { useSuggestion } from '@/contexts/SuggestionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Salad, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuggestionsListProps {
  type: 'workout' | 'diet';
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({ type }) => {
  const { suggestions, updateSuggestionStatus } = useSuggestion();

  const filteredSuggestions = suggestions.filter(s => s.type === type);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceito';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {type === 'workout' ? (
            <>
              <Dumbbell className="h-5 w-5 text-purple-500" />
              Sugestões de Treino
            </>
          ) : (
            <>
              <Salad className="h-5 w-5 text-green-500" />
              Sugestões de Dieta
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredSuggestions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma sugestão enviada ainda
            </p>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{suggestion.studentId}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(suggestion.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(suggestion.status)}>
                    {getStatusText(suggestion.status)}
                  </Badge>
                </div>
                <p className="text-sm whitespace-pre-line">{suggestion.content}</p>
                {suggestion.status === 'pending' && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateSuggestionStatus(suggestion.id, 'accepted')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestionsList;
