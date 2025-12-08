/**
 * Video utility functions for YouTube and Google Drive
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/  // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};

/**
 * Get YouTube embed URL from video ID
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
};

/**
 * Check if URL is a YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return /(?:youtube\.com|youtu\.be)/.test(url);
};

/**
 * Get YouTube thumbnail URL from video URL
 */
export const getYouTubeThumbnail = (videoUrl: string): string | null => {
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return null;

    // Return high quality thumbnail URL
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

/**
 * Check if URL is a Google Drive URL
 */
export const isGoogleDriveUrl = (url: string): boolean => {
    if (!url) return false;
    return /drive\.google\.com/.test(url);
};

/**
 * Get Google Drive embed URL
 * Converts /view or /edit URLs to /preview
 */
export const getGoogleDriveEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // Extract file ID
    const patterns = [
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
    ];

    let fileId = null;
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            fileId = match[1];
            break;
        }
    }

    if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    return null;
};

/**
 * Get universal embed URL (supports YouTube and Google Drive)
 */
export const getEmbedUrl = (url: string): string | null => {
    if (isYouTubeUrl(url)) {
        const id = extractYouTubeId(url);
        if (id) return getYouTubeEmbedUrl(id);
    }

    if (isGoogleDriveUrl(url)) {
        return getGoogleDriveEmbedUrl(url);
    }

    return null;
};
