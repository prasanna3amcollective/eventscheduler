import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import AccessIssue from '@/components/AccessIssue';

export default async function ActivityPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const securityContext = await getSessionContext();
  
  let currentUser = null;
  if (securityContext) {
    currentUser = await prisma.user.findUnique({ where: { id: securityContext.id } });
  }

  try {
    const activity: any = await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'findUnique',
      args: {
        where: { id: params.id },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      }
    }));

    if (!activity) {
      return <AccessIssue />;
    }

    // Extract staff members from participants
    const leaders = activity.participants?.filter((p: any) => p.type === 'Leader').map((p: any) => p.user?.name).filter(Boolean) || [];
    const guides = activity.participants?.filter((p: any) => p.type === 'Guide').map((p: any) => p.user?.name).filter(Boolean) || [];
    const observers = activity.participants?.filter((p: any) => p.type === 'Observer').map((p: any) => p.user?.name).filter(Boolean) || [];

    const transformedActivity = {
      ...activity,
      leaders,
      guides,
      observers,
      participantCount: activity.participants?.filter((p: any) => p.type === 'Participant').length || 0,
    };

    return (
      <div style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ActivityDetailModal
          activity={transformedActivity}
          isOpen={false} // Since inline is true, isOpen controls nothing, or we pass true if required
          isLoggedIn={!!securityContext}
          currentUser={currentUser}
          userRoles={securityContext?.roles || []}
          inline={true}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading activity:', error);
    return <AccessIssue />;
  }
}
