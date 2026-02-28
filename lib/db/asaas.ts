import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { USERS_COLLECTION } from './config';
import { requireAdmin } from './admin';

// Check payment status from Asaas
export const checkAsaasPaymentStatus = async (customerId: string): Promise<{ authorized: boolean; status: string; error?: string }> => {
    try {
        // Call Netlify Function to check payment status
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : '';

        const response = await fetch('/.netlify/functions/check-payment-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ customerId }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { authorized: false, status: 'error', error: error.error || 'Failed to fetch payment status' };
        }

        const data = await response.json();
        
        return {
            authorized: data.authorized,
            status: data.status,
        };
    } catch (error: any) {
        console.error("Error checking payment status:", error);
        return { authorized: false, status: 'error', error: error.message };
    }
};

// Sync student with Asaas
export const syncStudentWithAsaas = async (studentId: string, studentData: any): Promise<{ success: boolean; customerId?: string; error?: string }> => {
    try {
        // Check if student already has Asaas customer ID
        if (studentData.asaasCustomerId) {
            return { success: true, customerId: studentData.asaasCustomerId };
        }

        // Call Netlify Function to create customer
        const user = auth.currentUser;
        const idToken = user ? await user.getIdToken() : '';

        const response = await fetch('/.netlify/functions/create-asaas-customer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                name: studentData.name || studentData.displayName || 'Student',
                email: studentData.email,
                cpfCnpj: studentData.cpf || '',
                phone: studentData.phone || '',
                mobilePhone: studentData.mobilePhone || '',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create Asaas customer');
        }

        const data = await response.json();
        const customerId = data.customerId;

        // Update student with Asaas customer ID
        await updateDoc(doc(db, USERS_COLLECTION, studentId), {
            asaasCustomerId: customerId,
            asaasSyncedAt: new Date()
        });

        return { success: true, customerId };
    } catch (error: any) {
        console.error("Error syncing with Asaas:", error);
        return { success: false, error: error.message };
    }
};

// Sync all students with Asaas payment status
export const syncAllStudentsWithAsaas = async (): Promise<{ success: number; failed: number; errors: string[] }> => {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
        await requireAdmin();
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);

        for (const docSnap of querySnapshot.docs) {
            try {
                const studentData = docSnap.data();
                
                // Skip if manually authorized
                if (studentData.manualAuthorization) {
                    continue;
                }

                // Check if has Asaas customer ID
                if (!studentData.asaasCustomerId) {
                    results.errors.push(`${studentData.email}: Sem customer ID do Asaas`);
                    results.failed++;
                    continue;
                }

                // Check payment status
                const paymentStatus = await checkAsaasPaymentStatus(studentData.asaasCustomerId);

                // Determine planStatus based on paymentStatus
                let planStatus = 'pending';
                if (paymentStatus.status === 'active') {
                    planStatus = 'active';
                } else if (paymentStatus.status === 'overdue') {
                    planStatus = 'pending';
                }

                // Update access based on payment status
                await updateDoc(doc(db, USERS_COLLECTION, docSnap.id), {
                    accessAuthorized: paymentStatus.authorized,
                    paymentStatus: paymentStatus.status,
                    planStatus: planStatus,
                    lastAsaasSync: new Date()
                });

                results.success++;
            } catch (error: any) {
                results.errors.push(`${docSnap.id}: ${error.message}`);
                results.failed++;
            }
        }

        return results;
    } catch (error: any) {
        console.error("Error syncing all students:", error);
        throw new Error(error.message || 'Failed to sync students');
    }
};
