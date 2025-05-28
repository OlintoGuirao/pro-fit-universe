import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, UpdateProfileData } from '@/services/profileService';
import { useToast } from '@/contexts/ToastContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        const profileData = await profileService.getProfile(user.id);
        setFormData(prev => ({
          ...prev,
          name: profileData.name || prev.name,
          phone: profileData.phone || prev.phone,
          bio: profileData.bio || prev.bio
        }));

        // Atualizar o estado do usuário com os dados do banco
        setUser(prev => prev ? {
          ...prev,
          name: profileData.name || prev.name,
          phone: profileData.phone || prev.phone,
          bio: profileData.bio || prev.bio,
          avatar: profileData.avatar || prev.avatar
        } : null);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        addToast({
          type: 'error',
          message: 'Erro ao carregar dados do perfil'
        });
      }
    };

    loadProfile();
  }, [user?.id, setUser, addToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      await profileService.updateProfile(user.id, formData);
      
      // Atualizar o estado do usuário
      setUser(prev => prev ? {
        ...prev,
        name: formData.name || prev.name,
        phone: formData.phone,
        bio: formData.bio
      } : null);

      addToast({
        type: 'success',
        message: 'Perfil atualizado com sucesso!'
      });
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Erro ao salvar alterações. Tente novamente.'
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      const imageUrl = await profileService.uploadProfileImage(user.id, file);
      
      // Atualizar o estado do usuário
      setUser(prev => prev ? {
        ...prev,
        avatar: imageUrl
      } : null);

      addToast({
        type: 'success',
        message: 'Foto de perfil atualizada com sucesso!'
      });
      setFormData(prev => ({
        ...prev,
        avatar: imageUrl
      }));
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Erro ao atualizar foto. Tente novamente.'
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
              <TabsTrigger value="photo">Foto de Perfil</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/')}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Alterações</Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="photo">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">Foto de Perfil</h3>
                    <p className="text-sm text-muted-foreground">
                      Clique para alterar sua foto de perfil
                    </p>
                  </div>
                </div>

                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 