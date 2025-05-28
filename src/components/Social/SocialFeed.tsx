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

const SocialFeed = () => {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<'progress' | 'workout' | 'diet' | 'general'>('general');
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToPosts((updatedPosts) => {
      setPosts(updatedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const uploadPromises = files.map(async (file) => {
      try {
        console.log('Iniciando upload do arquivo:', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });

        const url = await uploadToCloudinary(file);
        console.log('Upload concluído:', url);
        
        return url;
      } catch (error) {
        console.error('Erro detalhado no upload:', {
          error,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        throw new Error(`Falha no upload do arquivo ${file.name}: ${error.message}`);
      }
    });

    try {
      const urls = await Promise.all(uploadPromises);
      console.log('Todos os uploads concluídos com sucesso:', urls);
      return urls;
    } catch (error) {
      console.error('Erro no upload de arquivos:', error);
      throw error;
    }
  };

  const handleCreatePost = async () => {
    if (!user || (!newPost.trim() && selectedFiles.length === 0)) return;

    try {
      setUploading(true);
      let mediaUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        try {
          console.log('Iniciando upload de arquivos...', {
            fileCount: selectedFiles.length,
            fileTypes: selectedFiles.map(f => f.type),
            fileSizes: selectedFiles.map(f => f.size)
          });
          mediaUrls = await uploadFiles(selectedFiles);
          console.log('Uploads concluídos:', mediaUrls);
        } catch (error) {
          console.error('Erro no upload:', error);
          alert(`Erro ao fazer upload dos arquivos: ${error.message}`);
          return;
        }
      }

      console.log('Criando post com mídias:', mediaUrls);
      await createPost(
        user.id,
        newPost,
        selectedType,
        mediaUrls.filter(url => url.includes('image')),
        mediaUrls.filter(url => url.includes('video'))
      );

      setNewPost('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erro ao criar post:', error);
      alert(`Erro ao criar post: ${error.message}`);
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
    if (post.images && post.images.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Imagem ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ))}
        </div>
      );
    }

    if (post.videos && post.videos.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-2 mt-2">
          {post.videos.map((video, index) => (
            <video
              key={index}
              src={video}
              controls
              className="w-full rounded-lg"
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
      // Se for um Timestamp do Firestore
      if (date instanceof Timestamp) {
        return formatDistanceToNow(date.toDate(), {
          addSuffix: true,
          locale: ptBR
        });
      }
      
      // Se for uma data normal
      if (date instanceof Date) {
        return formatDistanceToNow(date, {
          addSuffix: true,
          locale: ptBR
        });
      }
      
      // Se for um número (timestamp)
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
    <div className="space-y-6 p-4 sm:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Rede Social</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Compartilhe seu progresso e se inspire com a comunidade</p>
      </div>

      {/* Nova Postagem */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {user?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm sm:text-base">{user?.name}</p>
              <p className="text-xs sm:text-sm text-gray-500">O que você quer compartilhar hoje?</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Compartilhe seu progresso, uma dica ou como foi seu treino..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] text-sm sm:text-base"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === 'progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('progress')}
                className="text-xs sm:text-sm"
              >
                Progresso
              </Button>
              <Button
                variant={selectedType === 'workout' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('workout')}
                className="text-xs sm:text-sm"
              >
                Treino
              </Button>
              <Button
                variant={selectedType === 'diet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('diet')}
                className="text-xs sm:text-sm"
              >
                Dieta
              </Button>
              <Button
                variant={selectedType === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('general')}
                className="text-xs sm:text-sm"
              >
                Geral
              </Button>
            </div>

            {/* Preview das mídias selecionadas */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group aspect-square">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                id="camera-capture"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4" />
                Adicionar Mídia
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4" />
                Tirar Foto
              </Button>
            </div>

            <Button 
              onClick={handleCreatePost}
              disabled={(!newPost.trim() && selectedFiles.length === 0) || uploading}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xs sm:text-sm"
            >
              {uploading ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed de Posts */}
      <div className="space-y-4 sm:space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
            <CardHeader className="p-0">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarImage src={post.author?.avatar} />
                  <AvatarFallback>{post.author?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base truncate">{post.author?.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {formatPostDate(post.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                      {post.type}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm sm:text-base whitespace-pre-wrap break-words">{post.content}</p>
                  <PostContent post={post} />
                  <div className="flex items-center space-x-4 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-1 text-xs sm:text-sm"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          post.likes.includes(user?.id) ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                      <span>{post.likes.length}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-1 text-xs sm:text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;
