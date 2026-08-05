import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adoptOrphanUserByEmail, createOrUpdateUser } from '../../lib/db/admin';
import * as firestoreModule from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal<typeof firestoreModule>();
    return {
        ...actual, // keep initializeFirestore, persistentLocalCache, etc.
        collection: vi.fn(),
        doc: vi.fn((_db: any, collectionName: string, id: string) =>
            ({ __type: 'docRef', path: `${collectionName}/${id}` })
        ),
        query: vi.fn(),
        where: vi.fn(),
        getDocs: vi.fn(),
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
    };
});

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(),
    httpsCallable: vi.fn(),
}));

// ── Tests: adoptOrphanUserByEmail ─────────────────────────────────────────────

describe('adoptOrphanUserByEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return false if no candidates are found', async () => {
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [],
        } as any);

        const result = await adoptOrphanUserByEmail('new-uid', 'test@test.com', {});
        expect(result).toBe(false);
    });

    it('should return false on unexpected Firestore error', async () => {
        vi.mocked(firestoreModule.getDocs).mockRejectedValueOnce(
            new Error('Firestore unavailable')
        );

        const result = await adoptOrphanUserByEmail('new-uid', 'test@test.com', {});
        expect(result).toBe(false);
    });

    it('should adopt orphan user and migrate user_courses', async () => {
        const mockCandidateData = {
            name: 'Orphan Name',
            accessAuthorized: true,
            asaasCustomerId: 'cus_123',
            role: 'student',
        };

        // 1st getDocs → users query
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [{ id: 'old-orphan-id', data: () => mockCandidateData }],
        } as any);

        // 2nd getDocs → user_courses query
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [{ id: 'course1' }],
        } as any);

        const result = await adoptOrphanUserByEmail('new-uid', 'test@test.com', {
            displayName: 'New Name',
        });

        expect(result).toBe(true);

        // setDoc on the new user doc with correct path
        expect(firestoreModule.setDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/new-uid' },
            expect.objectContaining({
                email: 'test@test.com',
                name: 'New Name',
                accessAuthorized: true,
                asaasCustomerId: 'cus_123',
            })
        );

        // user_courses updated to point to new uid
        expect(firestoreModule.updateDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'user_courses/course1' },
            { userId: 'new-uid' }
        );

        // orphan document deleted
        expect(firestoreModule.deleteDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/old-orphan-id' }
        );
    });

    it('should prioritize candidate with accessAuthorized or asaasCustomerId', async () => {
        const unpaidDoc = {
            id: 'unpaid-id',
            data: () => ({ name: 'Unpaid' }),
        };
        const paidDoc = {
            id: 'paid-id',
            data: () => ({ name: 'Paid', accessAuthorized: true, asaasCustomerId: 'cus_456' }),
        };

        // unpaid comes first → logic should pick paid because of accessAuthorized
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [unpaidDoc, paidDoc],
        } as any);

        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [],
        } as any);

        await adoptOrphanUserByEmail('new-uid', 'test@test.com', { displayName: 'New' });

        expect(firestoreModule.setDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/new-uid' },
            expect.objectContaining({
                name: 'New',
                accessAuthorized: true,
                asaasCustomerId: 'cus_456',
            })
        );

        // both candidates should be deleted
        expect(firestoreModule.deleteDoc).toHaveBeenCalledTimes(2);
    });

    it('should assign admin role when email is in admin list', async () => {
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [{ id: 'orphan-id', data: () => ({ name: 'Orphan' }) }],
        } as any);

        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [],
        } as any);

        // PRIMARY_ADMIN_EMAIL = 'jairosouza67@gmail.com'
        await adoptOrphanUserByEmail('new-uid', 'jairosouza67@gmail.com', {
            displayName: 'Admin',
        });

        expect(firestoreModule.setDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/new-uid' },
            expect.objectContaining({ role: 'admin' })
        );
    });

    it('should merge all payment-related fields from orphan data', async () => {
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [
                {
                    id: 'orphan-id',
                    data: () => ({
                        name: 'Orphan',
                        accessAuthorized: true,
                        planType: 'monthly',
                        planValue: 49.9,
                        planStartDate: new Date('2026-01-01'),
                        planEndDate: new Date('2026-12-31'),
                        manualAuthorization: true,
                        lastAsaasSync: new Date('2026-06-01'),
                        paymentStatus: 'paid',
                        planStatus: 'active',
                    }),
                },
            ],
        } as any);

        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({ docs: [] } as any);

        await adoptOrphanUserByEmail('new-uid', 'test@test.com', {});

        expect(firestoreModule.setDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/new-uid' },
            expect.objectContaining({
                planType: 'monthly',
                planValue: 49.9,
                planStartDate: expect.any(Date),
                planEndDate: expect.any(Date),
                manualAuthorization: true,
                paymentStatus: 'paid',
                planStatus: 'active',
            })
        );
    });
});

// ── Tests: createOrUpdateUser ─────────────────────────────────────────────────

describe('createOrUpdateUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should adopt via callable and skip local setDoc on success', async () => {
        // user does not exist yet
        vi.mocked(firestoreModule.getDoc).mockResolvedValueOnce({
            exists: () => false,
        } as any);

        const mockCallable = vi.fn().mockResolvedValue({
            data: { adopted: true },
        });
        vi.mocked(httpsCallable).mockReturnValue(mockCallable);

        const result = await createOrUpdateUser('new-uid', {
            email: 'test@test.com',
            displayName: 'Test',
        });

        expect(mockCallable).toHaveBeenCalledWith({
            uid: 'new-uid',
            email: 'test@test.com',
            displayName: 'Test',
            photoURL: undefined,
        });
        expect(result).toEqual({ adopted: true });
        // setDoc must NOT be called because callable handled adoption
        expect(firestoreModule.setDoc).not.toHaveBeenCalled();
    });

    it('should fallback to local and create new user when callable fails', async () => {
        vi.mocked(firestoreModule.getDoc).mockResolvedValueOnce({
            exists: () => false,
        } as any);

        const mockCallable = vi.fn().mockRejectedValue(new Error('Callable failed'));
        vi.mocked(httpsCallable).mockReturnValue(mockCallable);

        // fallback adoptOrphanUserByEmail → no candidates
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            docs: [],
        } as any);

        const result = await createOrUpdateUser('new-uid', { email: 'test@test.com' });

        expect(mockCallable).toHaveBeenCalled();
        expect(result).toEqual({ adopted: false });

        // Local fallback writes whitelisted profile fields only, with merge:true.
        // role/payment fields are blocked by Firestore rules on owner create and
        // are set exclusively by the server-side callable path.
        expect(firestoreModule.setDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/new-uid' },
            expect.objectContaining({
                email: 'test@test.com',
            }),
            { merge: true }
        );
        const setDocData = vi.mocked(firestoreModule.setDoc).mock.calls[0][1] as any;
        expect(setDocData).not.toHaveProperty('role');
        expect(setDocData).not.toHaveProperty('accessAuthorized');
        expect(setDocData).not.toHaveProperty('paymentStatus');
    });

    it('should skip local setDoc when callable creates the profile', async () => {
        vi.mocked(firestoreModule.getDoc).mockResolvedValueOnce({
            exists: () => false,
        } as any);

        // callable reports it created the profile server-side (created: true)
        const mockCallable = vi.fn().mockResolvedValue({
            data: { adopted: false, created: true },
        });
        vi.mocked(httpsCallable).mockReturnValue(mockCallable);

        const result = await createOrUpdateUser('admin-uid', {
            email: 'jairosouza67@gmail.com',
            displayName: 'Admin',
        });

        expect(result).toEqual({ adopted: false });
        // profile already created by the callable → no local write at all
        expect(firestoreModule.setDoc).not.toHaveBeenCalled();
    });

    it('should update lastLogin if user already exists', async () => {
        vi.mocked(firestoreModule.getDoc).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ email: 'exist@test.com', role: 'student' }),
        } as any);

        await createOrUpdateUser('existing-uid', { email: 'exist@test.com' });

        expect(firestoreModule.updateDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/existing-uid' },
            expect.objectContaining({ lastLogin: expect.any(Date) })
        );
    });

    it('should update photoURL and displayName when user already exists', async () => {
        vi.mocked(firestoreModule.getDoc).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ email: 'exist@test.com', role: 'student' }),
        } as any);

        await createOrUpdateUser('existing-uid', {
            email: 'exist@test.com',
            displayName: 'Updated Name',
            photoURL: 'https://photo.url',
        });

        expect(firestoreModule.updateDoc).toHaveBeenCalledWith(
            { __type: 'docRef', path: 'users/existing-uid' },
            expect.objectContaining({
                lastLogin: expect.any(Date),
                displayName: 'Updated Name',
                photoURL: 'https://photo.url',
            })
        );
    });

    it('should retry adoption when existing profile is bare (previous attempt failed)', async () => {
        // Doc exists but has no role/payment fields — last-resort profile left
        // behind when the callable was unreachable. Must retry adoption.
        vi.mocked(firestoreModule.getDoc).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ email: 'test@test.com' }),
        } as any);

        const mockCallable = vi.fn().mockResolvedValue({
            data: { adopted: true },
        });
        vi.mocked(httpsCallable).mockReturnValue(mockCallable);

        const result = await createOrUpdateUser('bare-uid', { email: 'test@test.com' });

        expect(mockCallable).toHaveBeenCalled();
        expect(result).toEqual({ adopted: true });
        expect(firestoreModule.updateDoc).not.toHaveBeenCalled();
    });
});

