# E-Commerce Microservices Platform

A robust, scalable e-commerce platform built using a microservices architecture. The application is divided into specialized, decoupled services that communicate with each other via RabbitMQ and REST APIs.

## Architecture Overview

The system is designed with multiple Node.js/Express backend services, each responsible for a distinct domain of the e-commerce application. This allows for independent scaling, development, and deployment.

Key architectural components include:
- **Node.js & Express.js**: Core framework for building RESTful APIs.
- **MongoDB**: Primary NoSQL database for flexible schema management across services.
- **Redis**: Used for caching and session management (primarily in the Auth service).
- **RabbitMQ**: Message broker used for asynchronous inter-service communication and event-driven architecture.
- **JWT (JSON Web Tokens)**: Used for secure authentication and authorization across the services.

## Microservices

The project consists of the following microservices:

### 1. Authentication Service (`/auth`)
Handles user registration, login, session management, and JWT generation.
- **Tech Stack**: Express, Mongoose, Redis, RabbitMQ, bcryptjs, JWT.

### 2. Product Service (`/product`)
Manages the product catalog, inventory, and image uploads.
- **Tech Stack**: Express, Mongoose, Multer, ImageKit, RabbitMQ.

### 3. Cart Service (`/cart`)
Manages the shopping cart functionality for users.
- **Tech Stack**: Express, Mongoose, JWT.

### 4. Order Service (`/order`)
Handles order creation, processing, and status tracking.
- **Tech Stack**: Express, Mongoose, Axios, RabbitMQ.

### 5. Payment Service (`/payment`)
Processes payments securely using third-party payment gateways.
- **Tech Stack**: Express, Mongoose, Razorpay, Axios, RabbitMQ.

### 6. Notification Service (`/notification`)
Sends out emails and other notifications to users based on system events (e.g., order confirmation).
- **Tech Stack**: Express, Mongoose, Nodemailer, RabbitMQ.

### 7. AI Buddy Service (`/ai buddy`)
An intelligent chatbot/assistant powered by LLMs to help users.
- **Tech Stack**: Express, Mongoose, Socket.io, Langchain, Google GenAI, OpenAI.

### 8. Seller Dashboard (`/seller deshboard`)
A dedicated portal for sellers to manage their products, orders, and view analytics.
- **Tech Stack**: Express, Mongoose, RabbitMQ.

## Prerequisites

Before running the project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Redis](https://redis.io/)
- [RabbitMQ](https://www.rabbitmq.com/)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Environment Variables:**
   Navigate into each service directory and create a `.env` file based on the `.env.example` or required variables (e.g., Database URIs, JWT Secrets, RabbitMQ connection strings, third-party API keys).

3. **Install Dependencies & Run:**
   For each microservice directory, install dependencies and start the development server:
   ```bash
   cd <service-folder>
   npm install
   npm run dev
   ```
   *Tip: You can use tools like `concurrently` or a root-level script to start all services simultaneously if configured.*

## Inter-Service Communication

The platform relies on **RabbitMQ** for event-driven asynchronous communication. For example:
- When an order is placed in the Order Service, an event is published.
- The Notification Service listens to this event and sends an email to the user.
- The Product Service listens to this event to update inventory.

## Testing

Many services have unit and integration tests configured using **Jest** and **Supertest** (e.g., Auth, Product, Order, Cart).
To run tests in a specific service:
```bash
cd <service-folder>
npm test
```
