import logger from '../../utils/logger';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from '../../lib/auth';

// No Next.js API Routes, o body parser precisa ser desativado ou configurado
// para receber streams/arquivos grandes se for multipart.
// Aqui faremos de conta que recebemos a imagem em Base64 no JSON para simplificar no MVP Serverless
// { image: "data:image/jpeg;base64,/9j/4AAQSk..." }

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida.' });
    }

    // Calcular tamanho aproximado do base64 em bytes (x * 3/4)
    const sizeInBytes = Math.ceil((image.length * 3) / 4);
    if (sizeInBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Campo invalido: Arquivo excede 5MB.' });
    }

    const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Campo invalido: Formato Base64 inválido.' });
    }

    const extension = matches[1].toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExtensions.includes(extension)) {
      return res.status(400).json({ error: 'Campo invalido: Tipo de arquivo não permitido (apenas jpg, jpeg, png, webp).' });
    }

    const base64Data = matches[2];
    const fileName = `${uuidv4()}.${extension}`;
    
    // Caminho na pasta public do Next.js
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, base64Data, 'base64');

    logger.info('Upload realizado (mock local)', { fileName });

    // Retorna a URL simulada
    return res.status(200).json({ 
      url: `/uploads/photos/${fileName}`, 
      uploadedAt: new Date().toISOString() 
    });

  } catch (error) {
    logger.error('Erro no upload', { error: error.message });
    return res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
  }
}

export default withAuth(handler);
