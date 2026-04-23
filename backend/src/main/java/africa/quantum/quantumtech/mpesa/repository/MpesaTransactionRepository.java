package africa.quantum.quantumtech.mpesa.repository;

import africa.quantum.quantumtech.mpesa.model.MpesaTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MpesaTransactionRepository extends JpaRepository<MpesaTransaction, Long> {

    Optional<MpesaTransaction> findByCheckoutRequestId(String checkoutRequestId);

    Optional<MpesaTransaction> findByMerchantRequestId(String merchantRequestId);

    List<MpesaTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
