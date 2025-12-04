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
    // Determine file type
    const fileType = determineFileType(file.type);
    
    // Create storage reference
    const storageRef = ref(storage, `media/${courseId}/${studentId}/${Date.now()}_${file.name}`);
    
    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Upload error:", error);
          alert(`Erro ao fazer upload: ${error.message}`);
          resolve(null);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
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
            
            const docRef = await addDoc(collection(db, MEDIA_COLLECTION), mediaData);
            console.log('Media uploaded successfully:', docRef.id);
            resolve(docRef.id);
          } catch (error: any) {
            console.error("Error saving media metadata:", error);
            alert(`Erro ao salvar metadados: ${error.message}`);
            resolve(null);
          }
        }
      );
    });
  } catch (error: any) {
    console.error("Error uploading media:", error);
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
