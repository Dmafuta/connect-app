package africa.quantum.quantumtech.security;

import africa.quantum.quantumtech.model.Tenant;
import africa.quantum.quantumtech.model.User;
import africa.quantum.quantumtech.repository.TenantRepository;
import africa.quantum.quantumtech.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    public UserDetailsServiceImpl(UserRepository userRepository, TenantRepository tenantRepository) {
        this.userRepository  = userRepository;
        this.tenantRepository = tenantRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Long tenantId = TenantContext.get();

        User user;
        if (tenantId != null) {
            Tenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
            user = userRepository.findByEmailAndTenant(email, tenant)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        } else {
            // Platform login — SUPER_ADMIN has tenant IS NULL
            user = userRepository.findByEmailAndTenantIsNull(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
