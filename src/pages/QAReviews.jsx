import { useState } from "react";
import { useProjects } from "../context/ProjectContext.jsx";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const projects = {
  "website-redesign": {
    name: "Website Redesign",
    description: "Redesign company website",
    tasks: 24,
    members: 8,
  },

  "mobile-application": {
    name: "Mobile Application",
    description: "Build mobile application",
    tasks: 35,
    members: 10,
  },

  "ai-dashboard": {
    name: "AI Dashboard",
    description: "Build AI powered dashboard",
    tasks: 18,
    members: 6,
  },
};

function QAReviews() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects: backendProjects, createTask, refreshTasks } = useProjects();

  const project = projects[projectId];
  const backendProject = backendProjects.find(
    (item) =>
      String(item.name || "").trim().toLowerCase() ===
      String(project?.name || "").trim().toLowerCase()
  );

  const [testCases, setTestCases] = useState([
    {
      id: 1,
      name: "Login functionality",
      description: "Check whether users can login successfully.",
      status: "Pending",
    },
    {
      id: 2,
      name: "Dashboard loading",
      description: "Check whether the dashboard loads correctly.",
      status: "Pending",
    },
    {
      id: 3,
      name: "Profile update",
      description: "Check whether users can update their profile.",
      status: "Pending",
    },
    {
      id: 4,
      name: "Logout functionality",
      description: "Check whether users can logout successfully.",
      status: "Pending",
    },
  ]);

  const [tickets, setTickets] = useState([]);

  const [showTicketModal, setShowTicketModal] = useState(false);

  const [selectedTest, setSelectedTest] = useState(null);

  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketDeadline, setTicketDeadline] = useState("");

  // -----------------------------------
  // PROJECT NOT FOUND
  // -----------------------------------

  if (!project) {
    return (
      <DashboardLayout>
        <div className="teamflow-page">

          <section className="teamflow-heading">
            <p className="welcome-label">
              QUALITY REVIEW
            </p>

            <h2>Project not found.</h2>

            <p className="welcome-description">
              The project you are trying to review does not exist.
            </p>
          </section>

          <section className="panel">
            <button
              className="primary-button"
              onClick={() => navigate("/completed-projects")}
            >
              ← Back to Completed Projects
            </button>
          </section>

        </div>
      </DashboardLayout>
    );
  }

  // -----------------------------------
  // MARK TEST CASE AS PASSED
  // -----------------------------------

  const markPassed = (testId) => {
    setTestCases((currentTests) =>
      currentTests.map((test) =>
        test.id === testId
          ? {
              ...test,
              status: "Passed",
            }
          : test
      )
    );
  };

  // -----------------------------------
  // OPEN TICKET MODAL
  // -----------------------------------

  const openTicketModal = (test) => {
    setSelectedTest(test);

    setTicketTitle(test.name);

    setTicketDescription(
      `Issue found while testing ${test.name}.`
    );

    setShowTicketModal(true);
  };

  // -----------------------------------
  // CREATE TICKET
  // -----------------------------------

  const createTicket = async () => {
    if (
      !ticketTitle.trim() ||
      !ticketDescription.trim() ||
      !ticketDeadline
    ) {
      alert("Please fill in all ticket details.");
      return;
    }

    if (!backendProject?.id) {
      alert(
        "This project could not be matched with the backend project. Please refresh the page."
      );
      return;
    }

    try {
      const createdTask = await createTask({
        projectId: backendProject.id,
        title: ticketTitle,
        description: ticketDescription,
        priority: ticketPriority.toLowerCase(),
        status: "pending",
        dueDate: ticketDeadline,
      });

      const newTicket = {
        id: createdTask?.id
          ? `TKT-${createdTask.id}`
          : `TKT-${String(tickets.length + 1).padStart(3, "0")}`,
        taskId: createdTask?.id || null,
        projectId: backendProject.id,
        projectName: project.name,
        title: ticketTitle,
        description: ticketDescription,
        priority: ticketPriority,
        deadline: ticketDeadline,
        status: "Open",
        assignedTo: null,
        createdAt: new Date().toISOString(),
        qaStatus: "Failed",
        testCaseId: selectedTest?.id,
      };

      setTickets((currentTickets) => {
        const updatedTickets = [
          ...currentTickets,
          newTicket,
        ];

        localStorage.setItem(
          "teamflow_tickets",
          JSON.stringify(updatedTickets)
        );

        return updatedTickets;
      });

      await refreshTasks();

      // Mark the test case as failed
      if (selectedTest) {
        setTestCases((currentTests) =>
          currentTests.map((test) =>
            test.id === selectedTest.id
              ? {
                  ...test,
                  status: "Failed",
                }
              : test
          )
        );
      }

      // Close modal
      setShowTicketModal(false);
      setSelectedTest(null);
      setTicketTitle("");
      setTicketDescription("");
      setTicketPriority("Medium");
      setTicketDeadline("");

      alert("Ticket created successfully.");
    } catch (error) {
      console.error("Create QA ticket error:", error);
      alert(error.message || "Failed to create ticket.");
    }
  };

  // -----------------------------------
  // QA SUMMARY
  // -----------------------------------

  const passedTests = testCases.filter(
    (test) => test.status === "Passed"
  ).length;

  const failedTests = testCases.filter(
    (test) => test.status === "Failed"
  ).length;

  const pendingTests = testCases.filter(
    (test) => test.status === "Pending"
  ).length;

  const allTestsPassed =
    testCases.length > 0 &&
    testCases.every(
      (test) => test.status === "Passed"
    );

  return (
    <DashboardLayout>

      <div className="teamflow-page">

        {/* =================================
            HEADER
        ================================= */}

        <section className="teamflow-heading">

          <p className="welcome-label">
            QUALITY ASSURANCE
          </p>

          <h2>
            {project.name}
          </h2>

          <p className="welcome-description">
            Test the completed project and report any
            issues found during QA.
          </p>

        </section>


        {/* =================================
            BACK BUTTON
        ================================= */}

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/completed-projects")
          }
        >
          ← Completed Projects
        </button>


        {/* =================================
            PROJECT SUMMARY
        ================================= */}

        <section className="panel qa-project-summary">

          <div>
            <span>Project</span>
            <strong>{project.name}</strong>
          </div>

          <div>
            <span>Development</span>
            <strong>100% Complete</strong>
          </div>

          <div>
            <span>Tasks</span>
            <strong>{project.tasks}</strong>
          </div>

          <div>
            <span>Team Members</span>
            <strong>{project.members}</strong>
          </div>

        </section>


        {/* =================================
            QA SUMMARY
        ================================= */}

        <section className="qa-stats">

          <div className="qa-stat-card">

            <span>Total Tests</span>

            <strong>
              {testCases.length}
            </strong>

          </div>


          <div className="qa-stat-card">

            <span>Passed</span>

            <strong>
              {passedTests}
            </strong>

          </div>


          <div className="qa-stat-card">

            <span>Failed</span>

            <strong>
              {failedTests}
            </strong>

          </div>


          <div className="qa-stat-card">

            <span>Pending</span>

            <strong>
              {pendingTests}
            </strong>

          </div>

        </section>


        {/* =================================
            TEST CASES
        ================================= */}

        <section className="panel">

          <div className="panel-heading">

            <div>

              <p className="welcome-label">
                TESTING
              </p>

              <h3>
                QA Test Cases
              </h3>

              <p>
                Check each feature and mark the result.
              </p>

            </div>

          </div>


          <div className="qa-test-list">

            {testCases.map((test) => (

              <div
                className="qa-test-item"
                key={test.id}
              >

                <div className="qa-test-info">

                  <h4>
                    {test.name}
                  </h4>

                  <p>
                    {test.description}
                  </p>

                </div>


                <div className="qa-test-actions">

                  <span
                    className={`qa-status qa-${test.status.toLowerCase()}`}
                  >
                    {test.status}
                  </span>


                  {test.status !== "Passed" && (
                    <button
                      className="qa-pass-button"
                      onClick={() =>
                        markPassed(test.id)
                      }
                    >
                      ✓ Pass
                    </button>
                  )}


                  {test.status !== "Failed" && (
                    <button
                      className="qa-fail-button"
                      onClick={() =>
                        openTicketModal(test)
                      }
                    >
                      ✕ Report Issue
                    </button>
                  )}

                </div>

              </div>

            ))}

          </div>

        </section>


        {/* =================================
            QA RESULT
        ================================= */}

        <section className="panel qa-result">

          {allTestsPassed ? (

            <>
              <div className="qa-result-icon">
                ✓
              </div>

              <div>

                <h3>
                  QA Passed
                </h3>

                <p>
                  All test cases have passed.
                  This project can now be considered
                  successfully delivered.
                </p>

              </div>
            </>

          ) : (

            <>
              <div className="qa-result-icon">
                !
              </div>

              <div>

                <h3>
                  QA Testing In Progress
                </h3>

                <p>
                  Complete all test cases before
                  considering the project fully verified.
                </p>

              </div>
            </>

          )}

        </section>


        {/* =================================
            TICKETS
        ================================= */}

        {tickets.length > 0 && (

          <section className="panel">

            <div className="panel-heading">

              <div>

                <p className="welcome-label">
                  ISSUES
                </p>

                <h3>
                  QA Tickets
                </h3>

                <p>
                  Issues discovered during testing.
                </p>

              </div>

              <button
                className="secondary-button"
                onClick={() => navigate("/tickets")}
              >
                View All Tickets →
              </button>

            </div>


            <div className="qa-ticket-list">

              {tickets.map((ticket) => (

                <div
                  className="qa-ticket-item"
                  key={ticket.id}
                >

                  <div>

                    <span className="ticket-id">
                      {ticket.id}
                    </span>

                    <h4>
                      {ticket.title}
                    </h4>

                    <p>
                      {ticket.description}
                    </p>

                  </div>


                  <div className="qa-ticket-meta">

                    <span>
                      {ticket.priority}
                    </span>

                    <span>
                      Due: {ticket.deadline}
                    </span>

                    <span>
                      {ticket.status}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          </section>

        )}


        {/* =================================
            TICKET MODAL
        ================================= */}

        {showTicketModal && (

          <div className="qa-modal-overlay">

            <div className="qa-modal">

              <div className="qa-modal-header">

                <div>

                  <p className="welcome-label">
                    QA ISSUE
                  </p>

                  <h3>
                    Raise Ticket
                  </h3>

                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setShowTicketModal(false)
                  }
                >
                  ×
                </button>

              </div>


              {/* TITLE */}

              <label>
                Ticket Title
              </label>

              <input
                type="text"
                value={ticketTitle}
                onChange={(e) =>
                  setTicketTitle(e.target.value)
                }
                placeholder="Enter issue title"
              />


              {/* DESCRIPTION */}

              <label>
                Description
              </label>

              <textarea
                value={ticketDescription}
                onChange={(e) =>
                  setTicketDescription(e.target.value)
                }
                placeholder="Describe the issue..."
              />


              {/* PRIORITY */}

              <label>
                Priority
              </label>

              <select
                value={ticketPriority}
                onChange={(e) =>
                  setTicketPriority(e.target.value)
                }
              >

                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>

              </select>


              {/* DEADLINE */}

              <label>
                Fix Deadline
              </label>

              <input
                type="date"
                value={ticketDeadline}
                onChange={(e) =>
                  setTicketDeadline(e.target.value)
                }
              />


              {/* INFO */}

              <div className="ticket-claim-info">

                <strong>
                  Assignment
                </strong>

                <p>
                  This ticket will be open for team
                  members to claim.
                </p>

              </div>


              {/* ACTIONS */}

              <div className="qa-modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowTicketModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={createTicket}
                >
                  Create Ticket
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}

export default QAReviews;