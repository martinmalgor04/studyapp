'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const BUCKET_NAME = 'program-pdfs';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPE = 'application/pdf';

export async function uploadPDF(formData: FormData): Promise<{
  error?: string;
  data?: { fileUrl: string; extractionId: string; fileName: string };
}> {
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return { error: 'No se proporcionó un archivo válido' };
  }

  if (file.type !== ALLOWED_MIME_TYPE) {
    return { error: 'Solo se permiten archivos PDF' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'El archivo excede el límite de 10MB' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${user.id}/${timestamp}_${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: ALLOWED_MIME_TYPE,
      upsert: false,
    });

  if (uploadError) {
    logger.error('uploadPDF: error subiendo archivo a Storage', uploadError.message);
    return { error: 'Error al subir el archivo' };
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 60 * 60); // 1h for immediate use

  if (signedUrlError || !signedUrlData?.signedUrl) {
    logger.error('uploadPDF: error generando signed URL', signedUrlError?.message);
    return { error: 'Error al generar la URL del archivo' };
  }

  const { data: extraction, error: insertError } = await supabase
    .from('ai_extractions')
    .insert({
      user_id: user.id,
      file_url: storagePath,
      file_name: file.name,
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (insertError || !extraction) {
    logger.error('uploadPDF: error creando registro en ai_extractions', insertError?.message);
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return { error: 'Error al registrar la extracción' };
  }

  return {
    data: {
      fileUrl: signedUrlData.signedUrl,
      extractionId: extraction.id,
      fileName: file.name,
    },
  };
}

export async function deletePDF(extractionId: string): Promise<{
  error?: string;
  success?: boolean;
}> {
  if (!extractionId) {
    return { error: 'ID de extracción no proporcionado' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const { data: extraction, error: fetchError } = await supabase
    .from('ai_extractions')
    .select('id, file_url, user_id')
    .eq('id', extractionId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !extraction) {
    logger.error('deletePDF: extracción no encontrada o sin permisos', fetchError?.message);
    return { error: 'Extracción no encontrada' };
  }

  const { error: removeError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([extraction.file_url]);

  if (removeError) {
    logger.warn('deletePDF: no se pudo eliminar archivo de Storage', removeError.message);
  }

  const { error: deleteError } = await supabase
    .from('ai_extractions')
    .delete()
    .eq('id', extractionId)
    .eq('user_id', user.id);

  if (deleteError) {
    logger.error('deletePDF: error eliminando registro de ai_extractions', deleteError.message);
    return { error: 'Error al eliminar la extracción' };
  }

  return { success: true };
}
