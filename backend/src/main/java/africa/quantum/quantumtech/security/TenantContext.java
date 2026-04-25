package africa.quantum.quantumtech.security;

/**
 * Thread-local store for the current request's tenant ID.
 * Set by JwtAuthFilter (authenticated requests) and AuthController (login/register).
 * Always cleared in a finally block after use.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(Long tenantId) { CURRENT.set(tenantId); }

    public static Long get() { return CURRENT.get(); }

    public static void clear() { CURRENT.remove(); }
}
