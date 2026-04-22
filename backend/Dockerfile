# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and pom first (layer cache — only re-downloads deps when pom changes)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r//' mvnw && chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/target/*.jar app.jar

USER appuser
EXPOSE 8081

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
