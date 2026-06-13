import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auth check
    const isSuperAdmin = email === 'luisfreitasyt@gmail.com';
    let isAdmin = isSuperAdmin;
    
    if (!isAdmin && adminDb) {
      const doc = await adminDb.collection('admins').doc(email).get();
      isAdmin = doc.exists;
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // 1. Total Leads
    const leadsSnapshot = await adminDb.collection('pre_list').count().get();
    const totalLeads = leadsSnapshot.data().count;

    // 2. Fetch all users for accurate breakdown and deduplication
    const allUsersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').get();
    
    const uniqueUsersMap = new Map();
    allUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const email = data.email || doc.id;
      // Because we ordered by desc, the first one we encounter is the newest.
      if (!uniqueUsersMap.has(email)) {
        uniqueUsersMap.set(email, { id: doc.id, ...data });
      }
    });

    const uniqueUsersList = Array.from(uniqueUsersMap.values());
    const totalUsers = uniqueUsersList.length;

    let freeCount = 0;
    let startCount = 0;
    let proCount = 0;
    let eliteCount = 0;

    uniqueUsersList.forEach((u: any) => {
      const plan = u.plan || 'free';
      if (plan === 'free') freeCount++;
      else if (plan === 'start') startCount++;
      else if (plan === 'pro') proCount++;
      else if (plan === 'elite') eliteCount++;
    });

    const recentUsers = uniqueUsersList.slice(0, 50).map((u: any) => ({
      ...u,
      plan: u.plan || 'free',
      createdAt: u.createdAt || null
    }));

    // 3. Total Actions
    const [
      estudiaSnapshot,
      platformActionsSnapshot,
      diagnosesSnapshot,
      calculationsSnapshot,
      ideasSnapshot,
      proposalsSnapshot
    ] = await Promise.all([
      adminDb.collection('estudia').count().get(),
      adminDb.collection('platform_actions').count().get(),
      adminDb.collection('diagnoses').count().get(),
      adminDb.collection('calculations').count().get(),
      adminDb.collection('ideas').count().get(),
      adminDb.collection('proposals').count().get()
    ]);
    
    const totalActions = 
      estudiaSnapshot.data().count + 
      platformActionsSnapshot.data().count + 
      diagnosesSnapshot.data().count + 
      calculationsSnapshot.data().count + 
      ideasSnapshot.data().count + 
      proposalsSnapshot.data().count;

    // 4. Recent Leads
    const recentLeadsSnapshot = await adminDb.collection('pre_list')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const recentLeads = recentLeadsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null
    }));

    // 6. Recent Platform Actions (Logs)
    const recentActionsSnapshot = await adminDb.collection('platform_actions')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const recentActions = recentActionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || null
      };
    });

    // 7. Merge old logs from all tools for consistency
    const [recentEstudiaSnapshot, recentDiagSnapshot, recentCalcSnapshot, recentIdeaSnapshot, recentPropSnapshot] = await Promise.all([
      adminDb.collection('estudia').orderBy('createdAt', 'desc').limit(20).get(),
      adminDb.collection('diagnoses').orderBy('createdAt', 'desc').limit(20).get(),
      adminDb.collection('calculations').orderBy('createdAt', 'desc').limit(20).get(),
      adminDb.collection('ideas').orderBy('createdAt', 'desc').limit(20).get(),
      adminDb.collection('proposals').orderBy('createdAt', 'desc').limit(20).get()
    ]);
    
    // Obter emails para os logs antigos
    const allOldDocs = [
      ...recentEstudiaSnapshot.docs,
      ...recentDiagSnapshot.docs,
      ...recentCalcSnapshot.docs,
      ...recentIdeaSnapshot.docs,
      ...recentPropSnapshot.docs
    ];
    
    const userIdsToFetch = [...new Set(allOldDocs.map(doc => doc.data().userId).filter(id => id))];
    const userEmailsMap: Record<string, string> = {};
    
    if (userIdsToFetch.length > 0) {
      // Firebase 'in' queries are limited to 10 items. We should batch them.
      const batches = [];
      for (let i = 0; i < userIdsToFetch.length; i += 10) {
        batches.push(userIdsToFetch.slice(i, i + 10));
      }
      for (const batch of batches) {
        const usersSnap = await adminDb.collection('users').where('__name__', 'in', batch).get();
        usersSnap.docs.forEach(uDoc => {
          userEmailsMap[uDoc.id] = uDoc.data().email || uDoc.id;
        });
      }
    }

    const mapAction = (doc: any, tool: string, desc: string) => {
      const data = doc.data();
      let createdAtStr = data.createdAt;
      // Handle Firebase Timestamp or string
      if (createdAtStr && createdAtStr.toDate) {
        createdAtStr = createdAtStr.toDate().toISOString();
      }
      const mappedEmail = data.userId ? (userEmailsMap[data.userId] || data.userId) : 'Usuário Antigo';
      return {
        id: doc.id,
        userEmail: data.userEmail || mappedEmail,
        tool,
        description: desc,
        createdAt: createdAtStr
      };
    };

    const oldActions = [
      ...recentEstudiaSnapshot.docs.map(doc => mapAction(doc, 'estudia', 'Foto de estúdio gerada (Log Antigo)')),
      ...recentDiagSnapshot.docs.map(doc => mapAction(doc, 'diagnostico', 'Diagnóstico de canal gerado (Log Antigo)')),
      ...recentCalcSnapshot.docs.map(doc => mapAction(doc, 'calculadora', 'Orçamento calculado (Log Antigo)')),
      ...recentIdeaSnapshot.docs.map(doc => mapAction(doc, 'gerador-ideias', 'Ideias de conteúdo geradas (Log Antigo)')),
      ...recentPropSnapshot.docs.map(doc => mapAction(doc, 'proposta', 'Proposta comercial gerada (Log Antigo)'))
    ];

    const allActions = [...recentActions, ...oldActions]
      .filter(a => a.createdAt) // remover nulos
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        totalUsers,
        plansBreakdown: {
          free: freeCount,
          start: startCount,
          pro: proCount,
          elite: eliteCount
        },
        totalActions
      },
      recentLeads,
      recentUsers,
      recentActions: allActions
    });
  } catch (error: any) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
