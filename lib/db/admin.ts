import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, setDoc } from 'firebase/firestore';
import { isAdminEmail, isPrimaryAdmin, USERS_COLLECTION, ADMIN_EMAILS_COLLECTION, PRIMARY_ADMIN_EMAIL } from './config';
import { findAndMergeStudentByEmail } from './students';

// Security: Verify the current user is an admin before performing sensitive operations
export const requireAdmin = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado');

    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().role !== 'admin') {
        throw new Error('Acesso negado: permissão de administrador necessária');
    }
};

// Create user in Firestore if doesn't exist
export const createOrUpdateUser = async (uid: string, userData: any): Promise<void> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Check if a student with this email was manually added
            const merged = await findAndMergeStudentByEmail(userData.email, userData);

            if (!merged) {
                // Determine role: admin emails get admin role, all others are students
                const role = isAdminEmail(userData.email) ? 'admin' : 'student';

                // No existing student, create new user
                await setDoc(userRef, {
                    name: userData.displayName || '',
                    displayName: userData.displayName || '',
                    email: userData.email.toLowerCase(),
                    photoURL: userData.photoURL || '',
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    role: role,
                    // New users are NOT authorized by default (unless admin)
                    accessAuthorized: role === 'admin' ? true : false,
                    paymentStatus: role === 'admin' ? 'admin' : 'pending',
                });
                console.log('Created new user with role:', role, 'accessAuthorized:', role === 'admin');
            }
        } else {
            // Update last login and photo URL (in case it changed)
            await updateDoc(userRef, {
                lastLogin: new Date(),
                ...(userData.photoURL && { photoURL: userData.photoURL }),
                ...(userData.displayName && { displayName: userData.displayName }),
            });
        }
    } catch (error) {
        console.error("Error creating/updating user:", error);
    }
};

// Get user role from Firestore
export const getUserRole = async (uid: string): Promise<'admin' | 'student'> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.role === 'admin' ? 'admin' : 'student';
        }

        // Default to student if user not found
        return 'student';
    } catch (error) {
        console.error("Error getting user role:", error);
        return 'student';
    }
};

// Check if user has access authorization
export const checkUserAccess = async (uid: string): Promise<{ authorized: boolean; role: string; paymentStatus?: string }> => {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const role = userData.role || 'student';
            
            // Admins always have access
            if (role === 'admin') {
                return { authorized: true, role: 'admin' };
            }
            
            // Students need accessAuthorized to be true
            const authorized = userData.accessAuthorized === true;
            const paymentStatus = userData.paymentStatus || 'pending';
            
            return { authorized, role: 'student', paymentStatus };
        }

        return { authorized: false, role: 'student' };
    } catch (error) {
        console.error("Error checking user access:", error);
        return { authorized: false, role: 'student' };
    }
};

// Force update user role (for admin setup)
export const forceUpdateUserRole = async (uid: string, email: string): Promise<void> => {
    try {
        await requireAdmin();
        // Check if email is in admin list
        const adminEmails = await getAdminEmails();
        const isAdmin = adminEmails.includes(email.toLowerCase());
        const role = isAdmin ? 'admin' : 'student';
        
        const userRef = doc(db, USERS_COLLECTION, uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const updates: any = { role };

            // Update admin name if missing
            if (role === 'admin' && !userSnap.data().name) {
                updates.name = 'Administrador';
                updates.displayName = 'Administrador';
            }

            await updateDoc(userRef, updates);
        } else {
            await setDoc(userRef, {
                name: role === 'admin' ? 'Administrador' : '',
                displayName: role === 'admin' ? 'Administrador' : '',
                email: email.toLowerCase(),
                role,
                createdAt: new Date(),
                lastLogin: new Date(),
            });
            console.log('User document created with role:', role);
        }
    } catch (error) {
        console.error("Error force updating user role:", error);
    }
};

// Add a new admin by email
export const addAdminByEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
        await requireAdmin();
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return { success: false, message: 'Email inválido' };
        }

        // Check if user already exists
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('email', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // User exists, update their role to admin
            const userDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, USERS_COLLECTION, userDoc.id), {
                role: 'admin',
                updatedAt: new Date()
            });
            return { success: true, message: 'Usuário promovido a administrador com sucesso!' };
        } else {
            // User doesn't exist yet, create a placeholder admin entry
            await addDoc(collection(db, ADMIN_EMAILS_COLLECTION), {
                email: normalizedEmail,
                addedAt: new Date(),
                status: 'pending'
            });
            return { success: true, message: 'Email adicionado. O usuário será admin ao fazer login.' };
        }
    } catch (error) {
        console.error("Error adding admin:", error);
        return { success: false, message: 'Erro ao adicionar administrador' };
    }
};

// Get all admin emails (both existing users and pending)
export const getAdminEmails = async (): Promise<string[]> => {
    try {
        await requireAdmin();
        const adminEmails: string[] = [PRIMARY_ADMIN_EMAIL]; // Always include primary admin
        
        // Get existing admin users
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('role', '==', 'admin'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const email = doc.data().email;
            if (email && !adminEmails.includes(email)) {
                adminEmails.push(email);
            }
        });

        // Get pending admin emails
        const pendingRef = collection(db, ADMIN_EMAILS_COLLECTION);
        const pendingSnapshot = await getDocs(pendingRef);
        pendingSnapshot.forEach((doc) => {
            const email = doc.data().email;
            if (email && !adminEmails.includes(email)) {
                adminEmails.push(email);
            }
        });

        return adminEmails;
    } catch (error) {
        console.error("Error getting admin emails:", error);
        return [PRIMARY_ADMIN_EMAIL];
    }
};

// Remove admin privileges
export const removeAdmin = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
        await requireAdmin();
        const normalizedEmail = email.toLowerCase().trim();
        
        // Don't allow removing primary admin
        if (isPrimaryAdmin(normalizedEmail)) {
            return { success: false, message: 'Não é possível remover o administrador principal' };
        }

        // Remove from users collection
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('email', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, USERS_COLLECTION, userDoc.id), {
                role: 'student',
                updatedAt: new Date()
            });
        }

        // Remove from pending admin emails
        const pendingRef = collection(db, ADMIN_EMAILS_COLLECTION);
        const pendingQuery = query(pendingRef, where('email', '==', normalizedEmail));
        const pendingSnapshot = await getDocs(pendingQuery);
        
        const deletePromises = pendingSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        return { success: true, message: 'Administrador removido com sucesso' };
    } catch (error) {
        console.error("Error removing admin:", error);
        return { success: false, message: 'Erro ao remover administrador' };
    }
};

// Update student access authorization
export const updateStudentAccess = async (studentId: string, authorized: boolean, manual: boolean = false): Promise<{ success: boolean; message: string }> => {
    try {
        await requireAdmin();
        const updates: any = {
            accessAuthorized: authorized,
            accessUpdatedAt: new Date()
        };

        if (manual) {
            updates.manualAuthorization = true;
            updates.manualAuthBy = 'admin';
        } else {
            updates.manualAuthorization = false;
        }

        await updateDoc(doc(db, USERS_COLLECTION, studentId), updates);

        return { 
            success: true, 
            message: authorized ? 'Acesso autorizado com sucesso' : 'Acesso desautorizado com sucesso'
        };
    } catch (error: any) {
        console.error("Error updating student access:", error);
        return { success: false, message: error.message || 'Erro ao atualizar acesso' };
    }
};
