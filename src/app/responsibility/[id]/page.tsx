import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import ResponsibilityDetailModal from '@/components/ResponsibilityDetailModal';
import AccessIssue from '@/components/AccessIssue';

export default async function ResponsibilityPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const securityContext = await getSessionContext();
  
  let currentUser = null;
  if (securityContext) {
    currentUser = await prisma.user.findUnique({ where: { id: securityContext.id } });
  }

  try {
    const responsibility: any = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'findUnique',
      args: {
        where: { id: params.id },
      }
    }));

    if (!responsibility) {
      return <AccessIssue />;
    }

    return (
      <div style={{ padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ResponsibilityDetailModal
          responsibility={responsibility}
          isOpen={false} // handled by inline
          inline={true}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading responsibility:', error);
    return <AccessIssue />;
  }
}
