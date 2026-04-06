import DiagnosticClient from './DiagnosticClient';
import { requireAdminOrRedirect } from '@/lib/auth/admin';

export default async function DiagnosticPage() {
    await requireAdminOrRedirect();
    return <DiagnosticClient />;
}
