import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { createPost, subscribeToPosts, likePost, addComment } from '@/lib/db/queries';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SocialFeed = () => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'progress' | 'workout' | 'diet' | 'general'>('general');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToPosts((updatedPosts) => {
      setPosts(updatedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;

    try {
      await createPost(user.id, newPost, selectedType);
      setNewPost('');
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert('Erro ao criar post. Tente novamente.');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      await likePost(postId, user.id);
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      alert('Erro ao curtir post. Tente novamente.');
    }
  };

  const handleComment = async (postId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      await addComment(postId, user.id, content);
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário. Tente novamente.');
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'progress': return 'bg-green-100 text-green-800';
      case 'workout': return 'bg-purple-100 text-purple-800';
      case 'diet': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'progress': return 'Progresso';
      case 'workout': return 'Treino';
      case 'diet': return 'Dieta';
      default: return 'Geral';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

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
              <AvatarImage src={user?.avatar} />
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === 'progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('progress')}
              >
                Progresso
              </Button>
              <Button
                variant={selectedType === 'workout' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('workout')}
              >
                Treino
              </Button>
              <Button
                variant={selectedType === 'diet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('diet')}
              >
                Dieta
              </Button>
              <Button
                variant={selectedType === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('general')}
              >
                Geral
              </Button>
            </div>
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
                    <AvatarImage src={post.authorAvatar} />
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{post.authorName}</p>
                      <Badge variant="secondary" className="text-xs">
                        {post.authorRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Badge className={getPostTypeColor(post.type)}>
                  {getPostTypeLabel(post.type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 mb-4">{post.content}</p>
              
              {post.images && post.images.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {post.images.map((image: string, index: number) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`Post content ${index + 1}`} 
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-6 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-gray-500 hover:text-red-500 ${post.likes.includes(user?.id) ? 'text-red-500' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  ❤️ {post.likes.length}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                  💬 {post.comments.length}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
                  📤 Compartilhar
                </Button>
              </div>

              {/* Comentários */}
              {post.comments.length > 0 && (
                <div className="mt-4 space-y-4">
                  {post.comments.map((comment: any) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm">{comment.authorName}</p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;
