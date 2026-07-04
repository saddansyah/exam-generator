# Exam Generator
Client-side exam and cognitive drill generator built with React, TanStack Router, and Tailwind CSS.

## Preview
![Preview Exam Generator](https://github.com/user-attachments/assets/f06a0ba6-58b1-492b-a0db-0d9d2bb53709)

## Development

Install dependencies:
```bash
bun install
```

Run the development server:
```bash
bun dev
```

## Production

Build the assets:
```bash
bun run build
```
The static files will be generated inside the `dist` directory.

## Docker Deployment

Build the Docker image:
```bash
docker build -t exam-generator .
```

Run the container:
```bash
docker run -d -p 8080:80 exam-generator
```
Open [http://localhost:8080](http://localhost:8080) to access the application.
