import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import EventDetailModal from '@/components/EventDetailModal';
import AccessIssue from '@/components/AccessIssue';

export default async function EventPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const securityContext = await getSessionContext();
  
  let currentUser = null;
  if (securityContext) {
    currentUser = await prisma.user.findUnique({ where: { id: securityContext.id } });
  }

  try {
    const event: any = await withAuth(securityContext, () => ({
      model: 'event',
      operation: 'findUnique',
      args: {
        where: { id: params.id },
        include: {
          activities: {
            include: {
              participants: {
                include: { user: true }
              }
            }
          },
          responsibilities: true
        }
      }
    }));

    if (!event) {
      return <AccessIssue />;
    }

    return (
      <div style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <EventDetailModal
          event={event}
          isOpen={false} // handled by inline
          currentUser={currentUser}
          inline={true}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading event:', error);
    return <AccessIssue />;
  }
}
