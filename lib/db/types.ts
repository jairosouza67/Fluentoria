export interface CourseLesson {
    id: string;
    title: string;
    duration: string;
    videoUrl?: string;
    type: 'video' | 'audio' | 'pdf';
    description?: string;
    supportMaterials?: SupportMaterial[];
}

export interface SupportMaterial {
    id: string;
    name: string;
    url: string;
    type: 'pdf' | 'image' | 'audio';
    size?: number;
    uploadedAt?: string;
}

export interface CourseModule {
    id: string;
    title: string;
    coverImage?: string;
    description?: string;
    lessons: CourseLesson[];
}

export interface CourseGallery {
    id: string;
    title: string;
    coverImage?: string;
    description?: string;
    modules: CourseModule[];
}

export interface Course {
    id?: string;
    title: string;
    author: string;
    duration: string;
    launchDate?: string;
    type: 'video' | 'audio' | 'pdf';
    progress: number;
    thumbnail: string;
    description?: string;
    videoUrl?: string;
    modules?: CourseModule[]; // Backward compatibility for old data
    galleries?: CourseGallery[]; // New structure
    coverImage?: string;
    productId?: string; // ID do curso ao qual este conteúdo (mindful/music) pertence
}

export interface Reminder {
    id?: string;
    title: string;
    message: string;
    videoUrl: string;
    coverImage?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReminderRead {
    id?: string;
    userId: string;
    reminderId: string;
    readAt: Date;
}

export interface UserCourse {
    id: string;
    userId: string;
    courseId: string;
    status: 'active' | 'expired' | 'pending';
    purchaseDate: Date;
    source: 'asaas' | 'manual';
    asaasPaymentId?: string;
}

export interface StudentCompletion {
    studentId: string;
    contentId: string;
    contentType: 'course' | 'mindful' | 'music';
    completed: boolean;
    completedAt?: Date;
}

export interface Student {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    createdAt?: Date;
    // Financial Data
    planType?: 'monthly' | 'annual' | 'lifetime';
    planStatus?: 'active' | 'expired' | 'pending';
    planStartDate?: Date;
    planEndDate?: Date;
    planValue?: number;
    // Asaas Integration Data
    asaasCustomerId?: string;
    paymentStatus?: 'active' | 'overdue' | 'pending' | 'no_payment' | 'admin';
    lastAsaasSync?: Date;
    accessAuthorized?: boolean;
    manualAuthorization?: boolean;
}
