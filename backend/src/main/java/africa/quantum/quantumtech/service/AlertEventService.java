package africa.quantum.quantumtech.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

@Service
public class AlertEventService {

    // tenantId → list of active emitters
    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long tenantId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.computeIfAbsent(tenantId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(tenantId, emitter));
        emitter.onTimeout(()    -> remove(tenantId, emitter));
        emitter.onError(e      -> remove(tenantId, emitter));

        // Send a keep-alive comment immediately so the browser knows the connection is open
        try { emitter.send(SseEmitter.event().comment("connected")); } catch (IOException ignored) {}

        return emitter;
    }

    public void publish(Long tenantId, Object payload) {
        List<SseEmitter> list = emitters.get(tenantId);
        if (list == null || list.isEmpty()) return;
        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name("alert").data(payload));
            } catch (IOException e) {
                dead.add(emitter);
            }
        }
        list.removeAll(dead);
    }

    private void remove(Long tenantId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(tenantId);
        if (list != null) list.remove(emitter);
    }
}
