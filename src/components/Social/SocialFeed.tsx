import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { createPost, subscribeToPosts, likePost, addComment } from '@/lib/db/queries';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Video, X, Camera } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const SocialFeed = () => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'progress' | 'workout' | 'diet' | 'general'>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Usuário não autenticado');
      return;
    }

    try {
      const unsubscribe = subscribeToPosts((updatedPosts) => {
        console.log('Posts recebidos:', updatedPosts);
        setPosts(updatedPosts);
        setLoading(false);
        setError(null);
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Erro ao configurar feed social:', error);
      setError('Erro ao carregar o feed social');
      setLoading(false);
    }
  }, [user, lastUpdate]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!isImage && !isVideo) {
        alert('Por favor, selecione apenas imagens ou vídeos.');
        return false;
      }
      
      if (file.size > maxSize) {
        alert('O arquivo é muito grande. O tamanho máximo é 10MB.');
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[]): Promise<{ images: string[], videos: string[] }> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const result = { images: [] as string[], videos: [] as string[] };

    for (const file of files) {
      try {
        console.log('Fazendo upload do arquivo:', file.name, file.type);
        const url = await uploadToCloudinary(file);
        console.log('Upload concluído:', url);
        
        if (file.type.startsWith('image/')) {
          result.images.push(url);
        } else if (file.type.startsWith('video/')) {
          result.videos.push(url);
        }
      } catch (error) {
        console.error('Erro no upload do arquivo:', file.name, error);
        throw new Error(`Falha no upload do arquivo ${file.name}`);
      }
    }

    return result;
  };

  const handleCreatePost = async () => {
    if (!user || (!newPost.trim() && selectedFiles.length === 0)) {
      console.log('Validação falhou:', { user, newPost, selectedFiles });
      return;
    }

    try {
      setUploading(true);
      let images: string[] = [];
      let videos: string[] = [];
      
      if (selectedFiles.length > 0) {
        try {
          console.log('Iniciando upload de arquivos:', selectedFiles);
          const uploadResult = await uploadFiles(selectedFiles);
          images = uploadResult.images;
          videos = uploadResult.videos;
          console.log('Upload concluído - Imagens:', images, 'Vídeos:', videos);
        } catch (error) {
          console.error('Erro detalhado no upload:', error);
          alert(`Erro ao fazer upload dos arquivos: ${error.message}`);
          return;
        }
      }

      console.log('Dados do post a ser criado:', {
        authorId: user.id,
        content: newPost,
        type: selectedType,
        images,
        videos
      });

      await createPost(user.id, newPost, selectedType, images, videos);
      console.log('Post criado com sucesso');

      setNewPost('');
      setSelectedFiles([]);
      
      setLastUpdate(Date.now());
      
      toast.success('Post publicado com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao criar post:', error);
      toast.error(`Erro ao criar post: ${error.message}`);
    } finally {
      setUploading(false);
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

  const PostContent = ({ post }: { post: any }) => {
    const hasImages = post.images && Array.isArray(post.images) && post.images.length > 0;
    const hasVideos = post.videos && Array.isArray(post.videos) && post.videos.length > 0;

    if (hasImages) {
      return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {post.images.map((image: string, index: number) => (
            <img
              key={index}
              src={image}
              alt={`Imagem ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                console.error('Erro ao carregar imagem:', image);
                e.currentTarget.style.display = 'none';
              }}
            />
          ))}
        </div>
      );
    }

    if (hasVideos) {
      return (
        <div className="grid grid-cols-1 gap-2 mt-2">
          {post.videos.map((video: string, index: number) => (
            <video
              key={index}
              src={video}
              controls
              className="w-full rounded-lg"
              onError={(e) => {
                console.error('Erro ao carregar vídeo:', video);
                e.currentTarget.style.display = 'none';
              }}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  const formatPostDate = (date: any) => {
    if (!date) return '';
    
    try {
      if (date instanceof Timestamp) {
        return formatDistanceToNow(date.toDate(), {
          addSuffix: true,
          locale: ptBR
        });
      }
      
      if (date instanceof Date) {
        return formatDistanceToNow(date, {
          addSuffix: true,
          locale: ptBR
        });
      }
      
      if (typeof date === 'number') {
        return formatDistanceToNow(new Date(date), {
          addSuffix: true,
          locale: ptBR
        });
      }
      
      return '';
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6 p-4 sm:p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={user?.avatar || ''} />
                  <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Compartilhe seu progresso..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Imagem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Câmera
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() && selectedFiles.length === 0 || uploading}
                >
                  {uploading ? 'Publicando...' : 'Publicar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={post.author?.avatar || ''} />
                    <AvatarFallback>{post.author?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.author?.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{post.content}</p>
                <PostContent post={post} />
                <div className="flex items-center space-x-4 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${post.likes?.includes(user?.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    {post.likes?.length || 0}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {post.comments?.length || 0}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
