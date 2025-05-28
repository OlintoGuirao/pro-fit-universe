
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

const SocialFeed = () => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');

  const posts = [
    {
      id: '1',
      authorName: 'João Silva',
      authorRole: 'Aluno',
      content: 'Terminei meu treino de pernas hoje! 🦵💪 Consegui aumentar 5kg no leg press!',
      likes: 12,
      comments: 3,
      time: '2h atrás',
      type: 'progress',
      image: null
    },
    {
      id: '2',
      authorName: 'Maria Personal',
      authorRole: 'Personal Trainer',
      content: 'Dica do dia: Sempre se aqueça antes do treino! 5-10 minutos de aquecimento podem prevenir lesões e melhorar seu desempenho.',
      likes: 28,
      comments: 8,
      time: '4h atrás',
      type: 'tip'
    },
    {
      id: '3',
      authorName: 'Ana Costa',
      authorRole: 'Aluna',
      content: 'Primeira semana de dieta concluída! Perdi 1kg e estou me sentindo muito mais disposta. Obrigada @maria.personal pelas dicas! 🙏',
      likes: 15,
      comments: 5,
      time: '6h atrás',
      type: 'progress'
    }
  ];

  const handlePost = () => {
    if (newPost.trim()) {
      // Lógica para enviar post
      console.log('Novo post:', newPost);
      setNewPost('');
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'progress': return 'bg-green-100 text-green-800';
      case 'tip': return 'bg-blue-100 text-blue-800';
      case 'workout': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'progress': return 'Progresso';
      case 'tip': return 'Dica';
      case 'workout': return 'Treino';
      default: return 'Geral';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rede Social</h1>
        <p className="text-gray-600 mt-2">Compartilhe seu progresso e se inspire com a comunidade</p>
      </div>

      {/* Nova Postagem */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-500">O que você quer compartilhar hoje?</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Compartilhe seu progresso, uma dica ou como foi seu treino..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">📸 Foto</Button>
                <Button variant="outline" size="sm">🎥 Vídeo</Button>
              </div>
              <Button 
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Publicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed de Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{post.authorName}</p>
                      <Badge variant="secondary" className="text-xs">
                        {post.authorRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{post.time}</p>
                  </div>
                </div>
                <Badge className={getPostTypeColor(post.type)}>
                  {getPostTypeLabel(post.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 mb-4">{post.content}</p>
              
              {post.image && (
                <div className="mb-4">
                  <img 
                    src={post.image} 
                    alt="Post content" 
                    className="rounded-lg max-w-full h-auto"
                  />
                </div>
              )}

              <div className="flex items-center space-x-6 pt-4 border-t">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                  ❤️ {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                  💬 {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
                  📤 Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;
