import { useAuthStore } from '@/stores/authStore';

/**
 * Conditionally renders children based on user role.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if authorized
 * @param {string | string[]} props.to - The required role(s). Can be a single string ('admin') or array (['admin', 'super-admin'])
 * @param {React.ReactNode} [props.fallback] - Optional content to render if unauthorized
 * @returns {React.ReactNode}
 */
export function Restricted({ children, to, fallback = null }) {
    const { user } = useAuthStore();

    if (!user) return fallback;

    const allowedRoles = Array.isArray(to) ? to : [to];

    if (allowedRoles.includes(user.role)) {
        return children;
    }

    return fallback;
}
