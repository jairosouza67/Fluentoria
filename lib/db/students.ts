import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { Student } from './types';
import { USERS_COLLECTION } from './config';
import { requireAdmin } from './admin';

export const getAllStudents = async (): Promise<Student[]> => {
    try {
        await requireAdmin();
        const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));

        const students = querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Auto-sync planStatus with paymentStatus if needed
            let planStatus = data.planStatus;
            const paymentStatus = data.paymentStatus;
            

            
            if (paymentStatus && paymentStatus !== 'admin') {
                // Sync planStatus based on paymentStatus
                if (paymentStatus === 'active') {
                    planStatus = 'active';
                } else if (paymentStatus === 'overdue' || paymentStatus === 'no_payment') {
                    planStatus = 'pending';
                }
            }
            
            return {
                id: doc.id,
                name: data.name || data.displayName || 'Unknown',
                email: data.email || '',
                photoURL: data.photoURL,
                createdAt: data.createdAt?.toDate(),
                // Financial Data
                planType: data.planType,
                planStatus: planStatus,
                planStartDate: data.planStartDate?.toDate(),
                planEndDate: data.planEndDate?.toDate(),
                planValue: data.planValue,
                // Asaas Data
                asaasCustomerId: data.asaasCustomerId,
                paymentStatus: paymentStatus,
                lastAsaasSync: data.lastAsaasSync?.toDate(),
                accessAuthorized: data.accessAuthorized,
                manualAuthorization: data.manualAuthorization,
            } as Student;
        });



        // Sort by name (client-side to avoid index requirement)
        students.sort((a, b) => a.name.localeCompare(b.name));

        return students;
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
};

export const addStudent = async (name: string, email: string, photoURL?: string): Promise<string | null> => {
    try {
        await requireAdmin();
        const studentData = {
            name,
            email: email.toLowerCase(),
            displayName: name,
            photoURL: photoURL || '',
            createdAt: new Date(),
            role: 'student',
        };

        const docRef = await addDoc(collection(db, USERS_COLLECTION), studentData);
        console.log('Student added successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding student:", error);
        return null;
    }
};

export const updateStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    try {
        await requireAdmin();
        const docRef = doc(db, USERS_COLLECTION, id);
        await updateDoc(docRef, updates as any);
        return true;
    } catch (error) {
        console.error("Error updating student:", error);
        return false;
    }
};

export const deleteStudent = async (id: string): Promise<boolean> => {
    try {
        await requireAdmin();
        const docRef = doc(db, USERS_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting student:", error);
        return false;
    }
};

// Check if student exists by email and merge Google user data
export const findAndMergeStudentByEmail = async (email: string, googleUserData: any): Promise<boolean> => {
    try {
        const emailLower = email.toLowerCase();
        const q = query(collection(db, USERS_COLLECTION), where('email', '==', emailLower));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Student with this email already exists
            const studentDoc = querySnapshot.docs[0];
            const studentData = studentDoc.data();

            // Merge Google user data with existing student record
            const updates: any = {
                displayName: googleUserData.displayName || studentData.name,
                photoURL: googleUserData.photoURL || studentData.photoURL || '',
                lastLogin: new Date(),
            };

            // If student didn't have a name, use Google's
            if (!studentData.name && googleUserData.displayName) {
                updates.name = googleUserData.displayName;
            }

            await updateDoc(doc(db, USERS_COLLECTION, studentDoc.id), updates);

            return true;
        }

        return false;
    } catch (error) {
        console.error("Error finding/merging student:", error);
        return false;
    }
};

// Export student data to CSV (with Asaas integration data)
export const exportStudentData = async (): Promise<string> => {
    try {
        await requireAdmin();
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);

        // CSV Headers
        const headers = ['ID', 'Name', 'Display Name', 'Email', 'Role', 'Created At', 'Last Login', 'Asaas Customer ID', 'Payment Status'];
        let csvContent = headers.join(',') + '\n';

        // Add student data
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = [
                doc.id,
                `"${data.name || ''}"`,
                `"${data.displayName || ''}"`,
                data.email || '',
                data.role || 'student',
                data.createdAt?.toDate().toLocaleDateString() || '',
                data.lastLogin?.toDate().toLocaleDateString() || '',
                data.asaasCustomerId || '',
                data.paymentStatus || 'pending'
            ];
            csvContent += row.join(',') + '\n';
        });

        return csvContent;
    } catch (error) {
        console.error("Error exporting student data:", error);
        throw error;
    }
};

// Import student data from CSV
export const importStudentData = async (csvData: string): Promise<{ success: number; errors: string[] }> => {
    const results = { success: 0, errors: [] as string[] };

    try {
        await requireAdmin();
        // Parse CSV
        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file is empty or invalid');
        }

        // Skip header line
        const dataLines = lines.slice(1);

        for (let i = 0; i < dataLines.length; i++) {
            try {
                const line = dataLines[i];
                const values = line.match(/([^,"]+|"[^"]*")+/g) || [];

                if (values.length < 3) {
                    results.errors.push(`Line ${i + 2}: Invalid format`);
                    continue;
                }

                // Parse values
                const [id, name, displayName, email, role, createdAt, lastLogin, asaasCustomerId, paymentStatus] = values.map(v => v.replace(/^"|"$/g, '').trim());

                if (!email || !email.includes('@')) {
                    results.errors.push(`Line ${i + 2}: Invalid email`);
                    continue;
                }

                // Check if user already exists
                const existingUser = query(collection(db, USERS_COLLECTION), where('email', '==', email));
                const existingSnapshot = await getDocs(existingUser);

                const userData: any = {
                    name: name || displayName || 'Student',
                    displayName: displayName || name || 'Student',
                    email: email.toLowerCase(),
                    role: role || 'student',
                    createdAt: createdAt ? new Date(createdAt) : new Date(),
                    lastLogin: lastLogin ? new Date(lastLogin) : new Date(),
                };

                if (asaasCustomerId) {
                    userData.asaasCustomerId = asaasCustomerId;
                }
                if (paymentStatus) {
                    userData.paymentStatus = paymentStatus;
                }

                if (!existingSnapshot.empty) {
                    // Update existing user
                    const userDoc = existingSnapshot.docs[0];
                    await updateDoc(doc(db, USERS_COLLECTION, userDoc.id), userData);
                } else {
                    // Create new user
                    if (id) {
                        await setDoc(doc(db, USERS_COLLECTION, id), userData);
                    } else {
                        await addDoc(collection(db, USERS_COLLECTION), userData);
                    }
                }

                results.success++;
            } catch (lineError: any) {
                results.errors.push(`Line ${i + 2}: ${lineError.message}`);
            }
        }

        return results;
    } catch (error: any) {
        console.error("Error importing student data:", error);
        throw new Error(error.message || 'Failed to import data');
    }
};

// Get students with access control info
export const getStudentsWithAccessControl = async (): Promise<any[]> => {
    try {
        await requireAdmin();
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);

        const students = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            accessAuthorized: doc.data().accessAuthorized ?? false,
            manualAuthorization: doc.data().manualAuthorization ?? false,
            paymentStatus: doc.data().paymentStatus || 'unknown',
            asaasCustomerId: doc.data().asaasCustomerId || null,
            lastAsaasSync: doc.data().lastAsaasSync?.toDate() || null
        }));

        return students;
    } catch (error) {
        console.error("Error getting students with access control:", error);
        return [];
    }
};
