import { db, storage } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { MediaSubmission } from '../types';

const MEDIA_COLLECTION = 'media_submissions';

export const uploadMedia = async (
  file: File,
  courseId: string,
  studentId: string,
  studentName: string,
  description?: string,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  try {
    console.log('Starting upload...', { fileName: file.name, fileSize: file.size, courseId, studentId });
    
    // Validate inputs
    if (!file) {
      console.error('No file provided');
      alert('Nenhum arquivo selecionado');
      return null;
    }
    
    if (!courseId || !studentId || !studentName) {
      console.error('Missing required parameters', { courseId, studentId, studentName });
      alert('Dados incompletos para upload');
      return null;
    }
    
    // Determine file type
    const fileType = determineFileType(file.type);
    console.log('File type determined:', fileType, 'MIME:', file.type);
    
    // Create storage reference
    const storagePath = `media/${courseId}/${studentId}/${Date.now()}_${file.name}`;
    console.log('Storage path:', storagePath);
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress.toFixed(2) + '%');
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Upload error:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          
          let errorMessage = 'Erro ao fazer upload do arquivo';
          if (error.code === 'storage/unauthorized') {
            errorMessage = 'Você não tem permissão para fazer upload. Verifique as regras do Firebase Storage.';
          } else if (error.code === 'storage/canceled') {
            errorMessage = 'Upload cancelado';
          } else if (error.code === 'storage/unknown') {
            errorMessage = 'CORS Error: Configure o CORS no Firebase Storage.\n\nSolução:\n1. Vá para Firebase Console\n2. Storage → Rules\n3. Permita leitura/escrita para usuários autenticados\n\nOu execute: gsutil cors set cors.json gs://fluentoria-527b2.firebasestorage.app';
          } else if (error.message && error.message.includes('CORS')) {
            errorMessage = 'CORS Error: Configure o CORS no Firebase Storage.\n\nVeja o console para instruções.';
            console.error('\n=== CORS CONFIGURATION NEEDED ===');
            console.error('Run this command:');
            console.error('gsutil cors set cors.json gs://fluentoria-527b2.firebasestorage.app');
            console.error('\nOr update Storage Rules in Firebase Console');
            console.error('==================================\n');
          }
          
          alert(errorMessage);
          resolve(null);
        },
        async () => {
          try {
            console.log('Upload completed, getting download URL...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL obtained:', downloadURL);
            
            // Save metadata to Firestore
            const mediaData = {
              courseId,
              studentId,
              studentName,
              fileName: file.name,
              fileType,
              fileUrl: downloadURL,
              fileSize: file.size,
              uploadedAt: Timestamp.now(),
              description: description || '',
            };
            
            console.log('Saving metadata to Firestore...', mediaData);
            const docRef = await addDoc(collection(db, MEDIA_COLLECTION), mediaData);
            console.log('Media uploaded successfully! Document ID:', docRef.id);
            alert('Arquivo enviado com sucesso!');
            resolve(docRef.id);
          } catch (error: any) {
            console.error("Error saving media metadata:", error);
            console.error("Error details:", error.message, error.code);
            alert(`Erro ao salvar informações do arquivo: ${error.message}`);
            resolve(null);
          }
        }
      );
    });
  } catch (error: any) {
    console.error("Error uploading media:", error);
    console.error("Error stack:", error.stack);
    alert(`Erro ao preparar upload: ${error.message}`);
    return null;
  }
};

export const getCourseMedia = async (courseId: string): Promise<MediaSubmission[]> => {
  try {
    const q = query(
      collection(db, MEDIA_COLLECTION),
      where('courseId', '==', courseId),
      orderBy('uploadedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        id: doc.id,
        courseId: data.courseId,
        studentId: data.studentId,
        studentName: data.studentName,
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        description: data.description,
      } as MediaSubmission;
    });
  } catch (error) {
    console.error("Error fetching course media:", error);
    return [];
  }
};

export const getStudentMedia = async (studentId: string, courseId?: string): Promise<MediaSubmission[]> => {
  try {
    let q;
    if (courseId) {
      q = query(
        collection(db, MEDIA_COLLECTION),
        where('studentId', '==', studentId),
        where('courseId', '==', courseId),
        orderBy('uploadedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, MEDIA_COLLECTION),
        where('studentId', '==', studentId),
        orderBy('uploadedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        id: doc.id,
        courseId: data.courseId,
        studentId: data.studentId,
        studentName: data.studentName,
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        description: data.description,
      } as MediaSubmission;
    });
  } catch (error) {
    console.error("Error fetching student media:", error);
    return [];
  }
};

export const deleteMedia = async (mediaId: string, fileUrl: string): Promise<boolean> => {
  try {
    // Delete from Storage
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    await deleteDoc(doc(db, MEDIA_COLLECTION, mediaId));
    
    return true;
  } catch (error) {
    console.error("Error deleting media:", error);
    return false;
  }
};

const determineFileType = (mimeType: string): MediaSubmission['fileType'] => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
