import { Cloudinary } from '@cloudinary/url-gen';

// Configuração do Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: 'ddi5cc9em'
  }
});

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'fitlife_preset');

  // Determinar o tipo de upload baseado no tipo do arquivo
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

  try {
    console.log('Iniciando upload para Cloudinary:', {
      fileName: file.name,
      fileType: file.type,
      resourceType: resourceType
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/ddi5cc9em/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na resposta do Cloudinary:', errorData);
      throw new Error(`Falha no upload para o Cloudinary: ${errorData.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    console.log('Upload concluído com sucesso:', {
      url: data.secure_url,
      publicId: data.public_id
    });

    return data.secure_url;
  } catch (error) {
    console.error('Erro ao fazer upload para o Cloudinary:', error);
    throw error;
  }
};

export { cld }; 