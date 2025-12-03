import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
import { Message } from '../types';

const MESSAGES_COLLECTION = 'messages';

export const sendMessage = async (
  courseId: string,
  userId: string,
  userName: string,
  userEmail: string,
  text: string,
  isInstructor: boolean = false
): Promise<string | null> => {
  try {
    const messageData = {
      courseId,
      userId,
      userName,
      userEmail,
      text,
      timestamp: Timestamp.now(),
      isInstructor,
    };

    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);
    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

export const getCourseMessages = async (courseId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('courseId', '==', courseId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as Message;
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

export const subscribeToCourseMessages = (
  courseId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('courseId', '==', courseId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Message;
      });
      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to messages:", error);
    return () => {};
  }
};

export const getUnreadMessageCount = async (courseId: string, userId: string, lastReadTimestamp?: Date): Promise<number> => {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('courseId', '==', courseId),
      where('userId', '!=', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!lastReadTimestamp) {
      return querySnapshot.size;
    }
    
    const unreadMessages = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      const messageTime = data.timestamp?.toDate() || new Date(0);
      return messageTime > lastReadTimestamp;
    });
    
    return unreadMessages.length;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};
