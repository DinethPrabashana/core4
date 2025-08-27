# Transformer Management (React + Spring Boot)

This repository contains a React frontend and a Spring Boot backend for managing transformers and inspections. The frontend (`/src`) communicates with the backend (`transformer-backend/`) over REST APIs. The backend persists data to a PostgreSQL database.

## Repository layout

- `transformer-backend/` — Spring Boot application (Java, Maven)
- `src/` — React frontend (Create React App)
- `uploads/` — (runtime) uploaded images saved by the backend

## Key integration notes

- The React app calls backend endpoints under `http://localhost:8080/api/...` (for example `GET /api/transformers`).
- Backend stores entities (Transformer, Inspection) in PostgreSQL via Spring Data JPA. Configure DB connection in `transformer-backend/src/main/resources/application.properties`.
- File uploads (baseline/maintenance images) are saved to the `uploads/` folder by the backend and served from `/uploads/`.
- If the browser blocks requests due to CORS, enable CORS in the backend (there is a `WebConfig` class you can update) or configure a proxy for development.

## Prerequisites

- Java 11+ (or the Java version specified in `transformer-backend/pom.xml`)
- Maven 3.6+
- Node.js (16+) and npm
- PostgreSQL server

## PostgreSQL setup (example)

1. Create a database and user for the application (adjust names/credentials as desired):

```ps1
REM Windows (cmd/powershell) example using psql
psql -U postgres -c "CREATE DATABASE transformer_db;"
psql -U postgres -c "CREATE USER transformer_user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE transformer_db TO transformer_user;"
```

2. Edit `transformer-backend/src/main/resources/application.properties` and set:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/transformer_db
spring.datasource.username=transformer_user
spring.datasource.password=password
spring.jpa.hibernate.ddl-auto=update
app.upload.dir=uploads
```

Note: `spring.jpa.hibernate.ddl-auto=update` will create/update tables automatically during development. For production use, prefer controlled migrations.

## Run the backend

Open a terminal, change into the backend folder, and run with Maven. The backend listens on port 8080 by default; you can also pass the port as an argument.

```cmd
cd transformer-backend
mvn clean package
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8080
```

Alternatively run the packaged jar:

```cmd
cd transformer-backend
mvn package
java -jar target/transformer-backend-0.0.1-SNAPSHOT.jar --server.port=8080
```

Watch the backend logs for startup and for any database connection errors.

## Run the frontend (development)

In a separate terminal run:

```cmd
cd C:\Users\USER\Desktop\SDC\core4
npm install
npm start
```

The React dev server runs on port 3000 by default and makes API calls to `http://localhost:8080`. Ensure the backend is running first.

## Full-app workflow

1. Start PostgreSQL and ensure the database credentials in `application.properties` are correct.
2. Start the backend (see steps above) so it is reachable at `http://localhost:8080`.
3. Start the frontend with `npm start` and open `http://localhost:3000`.
4. Use the UI to create transformers and inspections; images uploaded from the UI are POSTed to the Spring Boot endpoints and saved under `uploads/`.

## Troubleshooting

- CORS errors: enable cross-origin requests in the backend (check `WebConfig`) or set up a proxy in the React app.
- DB connection errors: confirm PostgreSQL is running, the DB/user exist, and `application.properties` credentials match.
- Port in use: change `--server.port` argument when running backend or adjust frontend port (React will prompt to use another port).

## Notes

- This README focuses on running the integrated app locally. For deployment, production DB configuration, and secure credentials, follow your infrastructure/security practices.

If you want, I can add a short troubleshooting section that includes common console errors and how to fix them, or add a dev-only `application-dev.properties` example. Tell me which you'd prefer.
