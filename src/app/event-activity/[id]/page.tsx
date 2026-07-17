import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import EventActivityDetailModal from '@/components/EventActivityDetailModal';
import AccessIssue from '@/components/AccessIssue';

export default async function EventActivityPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const securityContext = await getSessionContext();
  
  let currentUser = null;
  if (securityContext) {
    currentUser = await prisma.user.findUnique({ where: { id: securityContext.id } });
  }

  try {
    const eventActivity: any = await withAuth(securityContext, () => ({
      model: 'eventActivity',
      operation: 'findUnique',
      args: {
        where: { id: params.id },
      }
    }));

    if (!eventActivity) {
      return <AccessIssue />;
    }

    return (
      <div style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <EventActivityDetailModal
          eventActivity={eventActivity}
          isOpen={false} // handled by inline
          currentUser={currentUser}
          eventId={eventActivity.eventId}
          inline={true}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading event activity:', error);
    return <AccessIssue />;
  }
}
