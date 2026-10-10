TeamFlow AI — Frontend
TeamFlow AI is a React-based project and task management platform designed to help teams manage projects, tasks, QA testing, tickets, team members, and AI-powered recommendations from one workspace.
Tech Stack
- React
- Vite
- JavaScript
- React Router
- Axios
- CSS
- REST APIs
- JWT Authentication
Main Features
Authentication
- User registration and login
- JWT-based authentication
- Protected application routes
Project Management
- Create and manage projects
- Project-specific team members
- Department-based project visibility
- Project manager and employee roles
Task Management
- Create tasks inside projects
- Only the manager of a project can create tasks for that project
- Employees can view and claim eligible tasks
- Task status tracking
- Task completion workflow
- Project-specific task visibility
QA Testing
- QA testing for completed work
- Create QA test cases
- Pass / Fail workflow
- Failure tracking
- Create tickets when a QA test fails
Ticket Management
- Create tickets for issues found during QA
- Priority and deadline information
- Claim tickets
- Track ticket status
User Skills & Performance
- Add and manage user skills
- Track completed tasks
- Track missed deadlines
- Track QA pass/fail performance
- View user history and performance information
AI Recommendations
TeamFlow AI can provide task recommendations based on factors such as:
- User skills
- Previous work
- Task history
- Completion performance
- QA performance
- Deadline performance
Recommended tasks can be presented with a compatibility score to help users decide which task to claim.
Project Structure
src/
├── components/
├── pages/
├── context/
├── services/
├── assets/
├── App.jsx
└── main.jsx
The exact structure may vary as the application evolves.
Getting Started
1. Clone the repository
git clone <YOUR_FRONTEND_REPOSITORY_URL>
cd <YOUR_FRONTEND_PROJECT_FOLDER>
2. Install dependencies
npm install
3. Configure environment variables
Create a .env file in the frontend root:
VITE_API_BASE_URL=http://localhost:5001/api
If the backend is deployed, replace the value with the deployed backend API URL.
Example:
VITE_API_BASE_URL=https://your-backend-domain.com/api
4. Start the development server
npm run dev
Vite will display the local development URL in the terminal, normally:
http://localhost:5173
5. Build for production
npm run build
6. Preview the production build
npm run preview
Backend
The frontend communicates with the TeamFlow AI backend through REST APIs.
The backend handles:
- Authentication
- Projects
- Tasks
- QA tests
- Tickets
- User skills
- User performance/history
- AI recommendations
- Notifications
Make sure the backend is running and the VITE_API_BASE_URL value points to the correct API server.
Environment Variables
Variable	Description
VITE_API_BASE_URL	Base URL of the TeamFlow AI backend API


Do not commit .env files containing private credentials or secrets.
Development
Install dependencies after cloning or whenever package.json changes:
npm install
Run the frontend:
npm run dev
Create a production build:
npm run build
Deployment
For production deployment:
1. Install dependencies.
2. Configure the production backend URL in the environment.
3. Run the production build.
4. Deploy the generated dist/ folder to your hosting provider.
Typical command:
npm run build
The production-ready files will be generated in:
dist/
TeamFlow AI
TeamFlow AI combines project management, task assignment, QA workflows, performance tracking, and recommendation features into a single platform for development teams.