import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import EventResponsibilityDetailModal from '@/components/EventResponsibilityDetailModal';
import AccessIssue from '@/components/AccessIssue';

export default async function EventResponsibilityPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const securityContext = await getSessionContext();
  
  let currentUser = null;
  if (securityContext) {
    currentUser = await prisma.user.findUnique({ where: { id: securityContext.id } });
  }

  try {
    const eventResponsibility: any = await withAuth(securityContext, () => ({
      model: 'eventResponsibility',
      operation: 'findUnique',
      args: {
        where: { id: params.id },
      }
    }));

    if (!eventResponsibility) {
      return <AccessIssue />;
    }

    return (
      <div style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <EventResponsibilityDetailModal
          eventResponsibility={eventResponsibility}
          isOpen={false} // handled by inline
          currentUser={currentUser}
          eventId={eventResponsibility.eventId}
          inline={true}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading event responsibility:', error);
    return <AccessIssue />;
  }
}
