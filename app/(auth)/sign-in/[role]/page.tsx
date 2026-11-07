import { notFound } from 'next/navigation';
import { RoleSignInForm } from '@/components/auth/role-sign-in-form';
import { UserRole } from '@/lib/roles';

const allowedRoles: UserRole[] = ['student', 'client', 'admin'];

export default async function RoleSignInPage({
  params
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;

  if (!allowedRoles.includes(role as UserRole)) {
    notFound();
  }

  return <RoleSignInForm role={role as UserRole} />;
}
