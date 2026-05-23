# syntax=docker/dockerfile:1.7

FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace

ENV MAVEN_OPTS="-Xmx512m -XX:MaxMetaspaceSize=256m"

COPY backend/pom.xml backend/pom.xml
RUN --mount=type=cache,target=/root/.m2 \
    mvn -f backend/pom.xml -DskipTests dependency:go-offline

COPY backend backend
RUN --mount=type=cache,target=/root/.m2 \
    mvn -f backend/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

RUN useradd --system --create-home --home-dir /app smartseat

COPY --from=build /workspace/backend/target/*.jar /app/app.jar

EXPOSE 18080

USER smartseat

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
