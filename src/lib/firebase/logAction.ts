import { adminDb } from './admin';

export async function logPlatformAction(
  userId: string, 
  userEmail: string | undefined, 
  toolName: string, 
  actionDescription: string
) {
  try {
    if (!adminDb) return;
    
    await adminDb.collection('platform_actions').add({
      userId: userId || 'anon',
      userEmail: userEmail || 'Anônimo',
      tool: toolName,
      description: actionDescription,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log platform action', error);
  }
}
