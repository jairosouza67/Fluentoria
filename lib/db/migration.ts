import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';

export async function runAccessMigration() {
  try {
    const callable = httpsCallable(functions, 'runAccessMigration');
    const result = await callable();
    return result.data as {
      success: boolean;
      message: string;
      details?: { users: number; mindful: number; music: number; primaryCourseId?: string };
    };
  } catch (error: any) {
    console.error('Migration error:', error);

    // Fallback path: explicit token via HTTP endpoint (more reliable in some browser contexts)
    if (error?.code === 'unauthenticated') {
      try {
        const user = auth.currentUser;
        if (!user) {
          return { success: false, message: 'Erro na migração: faça login novamente e tente de novo.' };
        }

        const idToken = await user.getIdToken(true);
        const projectId = user.auth.app.options.projectId;
        const url = `https://us-central1-${projectId}.cloudfunctions.net/runAccessMigrationHttp`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({}),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { success: false, message: body?.message || `Erro na migração: HTTP ${response.status}` };
        }

        return body as {
          success: boolean;
          message: string;
          details?: { users: number; mindful: number; music: number; primaryCourseId?: string };
        };
      } catch (fallbackError: any) {
        const fallbackMessage = fallbackError?.message || 'Falha no fallback HTTP';
        return { success: false, message: 'Erro na migração: ' + fallbackMessage };
      }
    }

    if (error?.code === 'permission-denied') {
      return { success: false, message: 'Erro na migração: apenas administradores podem executar esta ação.' };
    }
    if (error?.code === 'not-found' || error?.code === 'unimplemented') {
      return { success: false, message: 'Erro na migração: função runAccessMigration não encontrada. Faça deploy das Cloud Functions e tente novamente.' };
    }

    const message = error?.message || 'Erro desconhecido';
    return { success: false, message: 'Erro na migração: ' + message };
  }
}
