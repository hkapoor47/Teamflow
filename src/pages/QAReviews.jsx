import { useEffect, useState } from "react";
import { useProjects } from "../context/ProjectContext.jsx";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

const API_BASE_URL = "http://65.0.11.153:5001/api";

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

  const {
    projects: backendProjects,
    createTask,
    refreshTasks,
    fetchQATests,
    createQATest,
    updateQATest,
    deleteQATest,
  } = useProjects();

  const project = projects[projectId];

  const backendProject = backendProjects.find(
    (item) =>
      String(item.name || "").trim().toLowerCase() ===
      String(project?.name || "").trim().toLowerCase()
  );

  const [testCases, setTestCases] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [qaError, setQaError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(true);
  const [qaName, setQaName] = useState("");
  const [qaDescription, setQaDescription] = useState("");
  const [creatingTest, setCreatingTest] = useState(false);
  const [createTestError, setCreateTestError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [tickets, setTickets] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketDeadline, setTicketDeadline] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  /* =====================================================
     LOAD QA TESTS
  ===================================================== */

  useEffect(() => {
    const loadQATests = async () => {
      if (!backendProject?.id) {
        setLoadingTests(false);
        return;
      }

      try {
        setLoadingTests(true);
        setQaError("");

        const data = await fetchQATests(backendProject.id);
        const tests = Array.isArray(data) ? data : [];

        setTestCases(tests);

        // First-time QA flow:
        // no tests -> show only the create form.
        // existing tests -> show the test-case list.
        setShowCreateForm(tests.length === 0);
      } catch (error) {
        console.error("Load QA tests error:", error);
        setQaError(error.message || "Failed to load QA tests.");
        setTestCases([]);
        setShowCreateForm(true);
      } finally {
        setLoadingTests(false);
      }
    };

    loadQATests();
  }, [backendProject?.id]);

  /* =====================================================
     CREATE QA TEST
     POST /api/projects/:projectId/qa-tests

     Body:
     {
       name,
       description
     }
  ===================================================== */

  const handleCreateQATest = async (event) => {
    event?.preventDefault();

    setCreateTestError("");
    setSuccessMessage("");

    if (!qaName.trim()) {
      setCreateTestError("Test name is required.");
      return;
    }

    if (!qaDescription.trim()) {
      setCreateTestError("Description is required.");
      return;
    }

    if (!backendProject?.id) {
      setCreateTestError(
        "This project could not be matched with the backend project."
      );
      return;
    }

    try {
      setCreatingTest(true);

      const payload = {
        name: qaName.trim(),
        description: qaDescription.trim(),
      };

      const createdTest = await createQATest(
        backendProject.id,
        payload
      );

      // POST is the source of truth for the newly-created test.
      // Refresh from DB when possible, but don't lose the created test
      // just because the follow-up GET temporarily fails.
      let tests = createdTest ? [createdTest] : [];

      try {
        const latestTests = await fetchQATests(backendProject.id);

        if (Array.isArray(latestTests)) {
          tests = latestTests;

          // In case the GET response is stale and does not contain the
          // newly-created record yet, keep the POST response visible.
          if (
            createdTest?.id &&
            !tests.some((test) => String(test.id) === String(createdTest.id))
          ) {
            tests = [...tests, createdTest];
          }
        }
      } catch (refreshError) {
        console.warn(
          "QA test created, but refresh failed:",
          refreshError
        );
      }

      setTestCases(tests);

      setQaName("");
      setQaDescription("");
      setCreateTestError("");
      setQaError("");
      setSuccessMessage("QA test created successfully.");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Create QA test error:", error);
      setCreateTestError(
        error.message || "Failed to create QA test."
      );
    } finally {
      setCreatingTest(false);
    }
  };

  /* =====================================================
     STATUS HELPERS
  ===================================================== */

  const normalizedStatus = (status) =>
    String(status || "pending").trim().toLowerCase();

  const getStatusLabel = (status) => {
    const normalized = normalizedStatus(status);

    if (normalized === "passed") return "Passed";
    if (normalized === "failed") return "Failed";

    return "Pending";
  };

  const passedTests = testCases.filter(
    (test) => normalizedStatus(test.status) === "passed"
  ).length;

  const failedTests = testCases.filter(
    (test) => normalizedStatus(test.status) === "failed"
  ).length;

  const pendingTests = testCases.filter(
    (test) =>
      normalizedStatus(test.status) !== "passed" &&
      normalizedStatus(test.status) !== "failed"
  ).length;

  const allTestsPassed =
    testCases.length > 0 &&
    testCases.every(
      (test) => normalizedStatus(test.status) === "passed"
    );

  /* =====================================================
     UPDATE QA TEST
     PATCH /api/qa-tests/:testId
  ===================================================== */

  const markPassed = async (testId) => {
    try {
      setQaError("");
      setSuccessMessage("");

      const updatedTest = await updateQATest(
        backendProject.id,
        testId,
        "passed"
      );

      setTestCases((currentTests) =>
        currentTests.map((test) =>
          test.id === testId
            ? {
                ...test,
                ...(updatedTest || {}),
                status: "passed",
              }
            : test
        )
      );

      setSuccessMessage("QA test marked as passed.");
    } catch (error) {
      console.error("Update QA test error:", error);
      setQaError(
        error.message || "Failed to update QA test."
      );
    }
  };

  const markFailed = async (test) => {
    try {
      setQaError("");
      setSuccessMessage("");

      const updatedTest = await updateQATest(
        backendProject.id,
        test.id,
        "failed"
      );

      setTestCases((currentTests) =>
        currentTests.map((item) =>
          item.id === test.id
            ? {
                ...item,
                ...(updatedTest || {}),
                status: "failed",
              }
            : item
        )
      );

      // After marking it failed, open the ticket form.
      openTicketModal({
        ...test,
        status: "failed",
      });
    } catch (error) {
      console.error("Mark failed error:", error);
      setQaError(
        error.message || "Failed to update QA test."
      );
    }
  };

  /* =====================================================
     CLAIM TICKET

     Ticket API will be connected here next.
     For now this only shows a message so no fake API call
     is made.
  ===================================================== */

  const handleClaimTicket = (test) => {
    setQaError("");
    setSuccessMessage(
      `Ticket claim selected for "${test.name || "this QA test"}".`
    );
  };

  /* =====================================================
     DELETE QA TEST
     DELETE /api/qa-tests/:testId
  ===================================================== */

  const handleDeleteQATest = async (testId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this QA test case?"
    );

    if (!confirmed) return;

    try {
      setQaError("");
      setSuccessMessage("");

      await deleteQATest(testId);

      setTestCases((currentTests) =>
        currentTests.filter((test) => test.id !== testId)
      );

      setSuccessMessage("QA test deleted successfully.");
    } catch (error) {
      console.error("Delete QA test error:", error);
      setQaError(
        error.message || "Failed to delete QA test."
      );
    }
  };

  /* =====================================================
     TICKET MODAL
  ===================================================== */

  const openTicketModal = (test) => {
    setSelectedTest(test);

    setTicketTitle(test.name || "");

    setTicketDescription(
      `Issue found while testing ${
        test.name || "this test case"
      }.`
    );

    setTicketPriority("Medium");
    setTicketDeadline("");
    setShowTicketModal(true);
  };

  const createTicket = async () => {
    if (
      !ticketTitle.trim() ||
      !ticketDescription.trim() ||
      !ticketDeadline
    ) {
      setQaError(
        "Please fill in ticket title, description and fix deadline."
      );
      return;
    }

    if (!backendProject?.id) {
      setQaError(
        "This project could not be matched with the backend project."
      );
      return;
    }

    try {
      setCreatingTicket(true);
      setQaError("");

      const createdTask = await createTask({
        projectId: backendProject.id,
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
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
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
        priority: ticketPriority,
        deadline: ticketDeadline,
        status: "Open",
        assignedTo: null,
        createdAt: new Date().toISOString(),
        qaStatus: "Failed",
        testCaseId: selectedTest?.id || null,
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

      setShowTicketModal(false);
      setSelectedTest(null);
      setTicketTitle("");
      setTicketDescription("");
      setTicketPriority("Medium");
      setTicketDeadline("");
      setSuccessMessage("Ticket created successfully.");
    } catch (error) {
      console.error("Create QA ticket error:", error);
      setQaError(
        error.message || "Failed to create ticket."
      );
    } finally {
      setCreatingTicket(false);
    }
  };

  /* =====================================================
     PROJECT NOT FOUND
  ===================================================== */

  if (!project) {
    return (
      <DashboardLayout>
        <div className="teamflow-page">
          <section className="teamflow-heading">
            <p className="welcome-label">QUALITY ASSURANCE</p>

            <h2>Project not found</h2>

            <p className="welcome-description">
              The project you are trying to review does not exist.
            </p>
          </section>

          <button
            className="secondary-button"
            onClick={() => navigate("/completed-projects")}
          >
            ← Back to Completed Projects
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="teamflow-page qa-page">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="qa-page-header">
          <div>
            <p className="welcome-label">QUALITY ASSURANCE</p>

            <h2>QA Testing</h2>

            <p className="welcome-description">
              Test <strong>{project.name}</strong> and track every
              QA test case before delivery.
            </p>
          </div>

        </section>

        {/* =================================================
            BACK
        ================================================= */}

        <button
          className="qa-back-button"
          onClick={() => navigate("/completed-projects")}
        >
          ← Completed Projects
        </button>

        {/* =================================================
            PROJECT SUMMARY
        ================================================= */}

        <section className="qa-project-card">
          <div className="qa-project-main">
            <div className="qa-project-icon">
              {project.name.charAt(0)}
            </div>

            <div>
              <span className="qa-eyebrow">PROJECT</span>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </div>
          </div>

          <div className="qa-project-metrics">
            <div>
              <span>Development</span>
              <strong>100%</strong>
            </div>

            <div>
              <span>Tasks</span>
              <strong>{project.tasks}</strong>
            </div>

            <div>
              <span>Team</span>
              <strong>{project.members}</strong>
            </div>
          </div>
        </section>

        {/* =================================================
            NOTICES
        ================================================= */}

        {qaError && (
          <div className="qa-alert qa-alert-error">
            <span>!</span>
            <p>{qaError}</p>
            <button onClick={() => setQaError("")}>×</button>
          </div>
        )}

        {successMessage && (
          <div className="qa-alert qa-alert-success">
            <span>✓</span>
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage("")}>×</button>
          </div>
        )}

        {/* =================================================
            CREATE QA TEST FORM
        ================================================= */}

        {showCreateForm && (
          <section className="qa-create-card">
            <div className="qa-create-card-header">
              <div>
                <span className="qa-eyebrow">NEW TEST CASE</span>

                <h3>Create QA Test</h3>

                <p>
                  Define a test case that should be verified before
                  this project is delivered.
                </p>
              </div>

              {testCases.length > 0 && (
                <button
                  className="qa-close-form"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              )}
            </div>

            {createTestError && (
              <div className="qa-form-error">
                {createTestError}
              </div>
            )}

            <form onSubmit={handleCreateQATest}>
              <div className="qa-form-grid">
                <div className="qa-form-field qa-full-width">
                  <label>Test Name</label>

                  <input
                    type="text"
                    value={qaName}
                    onChange={(event) =>
                      setQaName(event.target.value)
                    }
                    placeholder="e.g. Password reset functionality"
                    autoFocus
                  />
                </div>

                <div className="qa-form-field qa-full-width">
                  <label>Description</label>

                  <textarea
                    value={qaDescription}
                    onChange={(event) =>
                      setQaDescription(event.target.value)
                    }
                    placeholder="Describe what this test should verify..."
                    rows={5}
                  />
                </div>
              </div>

              <div className="qa-form-footer">
                <span>
                  Status will start as <strong>Pending</strong>.
                </span>

                <button
                  type="submit"
                  className="qa-submit-button"
                  disabled={creatingTest}
                >
                  {creatingTest
                    ? "Creating..."
                    : "Create QA Test"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =================================================
            TEST CASES
        ================================================= */}

        {(!loadingTests && testCases.length > 0) && (
          <section className="qa-tests-card">
            <div className="qa-tests-header">
              <div>
                <span className="qa-eyebrow">QA REVIEW</span>

                <h3>Test Cases</h3>

                <p>
                  Run each test and mark the result.
                </p>
              </div>

              <button
                className="qa-secondary-create"
                onClick={() => {
                  setShowCreateForm(true);
                  setCreateTestError("");
                  setQaError("");
                  setSuccessMessage("");
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                + Create QA Test
              </button>
            </div>

            <div className="qa-test-list">
              {testCases.map((test, index) => {
                const status = normalizedStatus(test.status);
                const label = getStatusLabel(test.status);

                return (
                  <article
                    className="qa-test-row"
                    key={test.id}
                  >
                    <div className="qa-test-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="qa-test-content">
                      <div className="qa-test-title-row">
                        <h4>
                          {test.name || "Untitled QA Test"}
                        </h4>

                        <span
                          className={`qa-status-badge qa-status-${status}`}
                        >
                          {label}
                        </span>
                      </div>

                      <p>
                        {test.description ||
                          "No description provided."}
                      </p>

                      {test.created_at && (
                        <span className="qa-created-date">
                          Created{" "}
                          {new Date(
                            test.created_at
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="qa-test-actions">
                      {status === "pending" && (
                        <>
                          <button
                            className="qa-action-pass"
                            onClick={() =>
                              markPassed(test.id)
                            }
                          >
                            ✓ Pass
                          </button>

                          <button
                            className="qa-action-fail"
                            onClick={() =>
                              markFailed(test)
                            }
                          >
                            ✕ Fail
                          </button>
                        </>
                      )}

                      {status === "passed" && (
                        <span className="qa-result-label qa-result-passed">
                          ✓ Passed
                        </span>
                      )}

                      {status === "failed" && (
                        <button
                          className="qa-action-ticket"
                          onClick={() =>
                            handleClaimTicket(test)
                          }
                        >
                          Claim Ticket
                        </button>
                      )}

                      <button
                        className="qa-action-delete"
                        onClick={() =>
                          handleDeleteQATest(test.id)
                        }
                        title="Delete test"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* =================================================
            QA COMPLETION
        ================================================= */}

        {testCases.length > 0 && !showCreateForm && (
          <section
            className={`qa-completion-card ${
              allTestsPassed
                ? "qa-completion-success"
                : ""
            }`}
          >
            <div className="qa-completion-icon">
              {allTestsPassed ? "✓" : "!"}
            </div>

            <div>
              <h3>
                {allTestsPassed
                  ? "QA Testing Complete"
                  : "QA Testing In Progress"}
              </h3>

              <p>
                {allTestsPassed
                  ? "All QA test cases have passed."
                  : `${passedTests} of ${testCases.length} test cases have passed. Complete the remaining tests before final delivery.`}
              </p>
            </div>

            <div className="qa-completion-progress">
              <div>
                <span>Progress</span>

                <strong>
                  {Math.round(
                    (passedTests / testCases.length) * 100
                  )}
                  %
                </strong>
              </div>

              <div className="qa-progress-track">
                <div
                  className="qa-progress-fill"
                  style={{
                    width: `${
                      (passedTests / testCases.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            TICKETS
        ================================================= */}

        {tickets.length > 0 && (
          <section className="qa-tests-card">
            <div className="qa-tests-header">
              <div>
                <span className="qa-eyebrow">ISSUES</span>

                <h3>QA Tickets</h3>

                <p>
                  Issues discovered during testing.
                </p>
              </div>

              <button
                className="qa-secondary-create"
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

                    <h4>{ticket.title}</h4>

                    <p>{ticket.description}</p>
                  </div>

                  <div className="qa-ticket-meta">
                    <span>{ticket.priority}</span>
                    <span>Due: {ticket.deadline}</span>
                    <span>{ticket.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =================================================
            TICKET MODAL
        ================================================= */}

        {showTicketModal && (
          <div className="qa-modal-overlay">
            <div className="qa-modal">
              <div className="qa-modal-header">
                <div>
                  <span className="qa-eyebrow">
                    FAILED TEST
                  </span>

                  <h3>Raise QA Ticket</h3>

                  {selectedTest && (
                    <p>
                      {selectedTest.name}
                    </p>
                  )}
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

              <label>Ticket Title</label>

              <input
                type="text"
                value={ticketTitle}
                onChange={(e) =>
                  setTicketTitle(e.target.value)
                }
                placeholder="Enter issue title"
              />

              <label>Description</label>

              <textarea
                value={ticketDescription}
                onChange={(e) =>
                  setTicketDescription(
                    e.target.value
                  )
                }
                placeholder="Describe the issue..."
                rows={5}
              />

              <label>Priority</label>

              <select
                value={ticketPriority}
                onChange={(e) =>
                  setTicketPriority(
                    e.target.value
                  )
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">
                  Critical
                </option>
              </select>

              <label>Fix Deadline</label>

              <input
                type="date"
                value={ticketDeadline}
                onChange={(e) =>
                  setTicketDeadline(
                    e.target.value
                  )
                }
              />

              <div className="ticket-claim-info">
                <strong>Assignment</strong>

                <p>
                  This ticket will be open for team
                  members to claim.
                </p>
              </div>

              <div className="qa-modal-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowTicketModal(false)
                  }
                  disabled={creatingTicket}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={createTicket}
                  disabled={creatingTicket}
                >
                  {creatingTicket
                    ? "Creating..."
                    : "Create Ticket"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            LOCAL QA PAGE STYLES
        ================================================= */}

        <style>{`
          .qa-page {
            padding-bottom: 60px;
          }

          .qa-page-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 18px;
          }

          .qa-page-header h2 {
            margin: 4px 0 8px;
            font-size: 36px;
            letter-spacing: -0.8px;
          }

          .qa-page-header .welcome-description {
            margin: 0;
          }

          .qa-create-top-button,
          .qa-secondary-create {
            border: 0;
            border-radius: 10px;
            padding: 12px 18px;
            background: #19c7c1;
            color: #061118;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
            transition: transform 0.18s ease, opacity 0.18s ease;
          }

          .qa-create-top-button:hover,
          .qa-secondary-create:hover {
            transform: translateY(-1px);
            opacity: 0.92;
          }

          .qa-back-button {
            margin-bottom: 20px;
            padding: 10px 15px;
            border-radius: 9px;
            border: 1px solid #2c4159;
            background: #101d2d;
            color: #c8d7e8;
            cursor: pointer;
            font-weight: 700;
          }

          .qa-project-card {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid #263b53;
            border-radius: 16px;
            background: #101d2d;
          }

          .qa-project-main {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .qa-project-icon {
            width: 54px;
            height: 54px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            background: #c9f4f0;
            color: #087e7a;
            font-size: 23px;
            font-weight: 900;
          }

          .qa-eyebrow {
            display: block;
            color: #70a4d2;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.2px;
            text-transform: uppercase;
          }

          .qa-project-main h3 {
            margin: 3px 0 4px;
            font-size: 21px;
          }

          .qa-project-main p {
            margin: 0;
            color: #8eacd0;
          }

          .qa-project-metrics {
            display: flex;
            align-items: center;
            gap: 34px;
          }

          .qa-project-metrics div {
            min-width: 90px;
          }

          .qa-project-metrics span,
          .qa-stat-card span {
            display: block;
            color: #83a3c5;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .qa-project-metrics strong {
            display: block;
            margin-top: 5px;
            font-size: 20px;
          }

          .qa-alert {
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 13px 16px;
            margin-bottom: 16px;
            border-radius: 10px;
            border: 1px solid;
          }

          .qa-alert p {
            flex: 1;
            margin: 0;
          }

          .qa-alert button {
            border: 0;
            background: transparent;
            color: inherit;
            font-size: 20px;
            cursor: pointer;
          }

          .qa-alert-error {
            border-color: #713b46;
            background: #291a21;
            color: #ffb5bf;
          }

          .qa-alert-success {
            border-color: #176257;
            background: #102c2a;
            color: #8de8dc;
          }

          .qa-create-card,
          .qa-tests-card {
            margin-bottom: 20px;
            border: 1px solid #263b53;
            border-radius: 16px;
            background: #101d2d;
            overflow: hidden;
          }

          .qa-create-card {
            padding: 25px;
          }

          .qa-create-card-header,
          .qa-tests-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }

          .qa-create-card-header h3,
          .qa-tests-header h3 {
            margin: 5px 0 5px;
            font-size: 22px;
          }

          .qa-create-card-header p,
          .qa-tests-header p {
            margin: 0;
            color: #86a5c8;
          }

          .qa-close-form {
            width: 34px;
            height: 34px;
            border: 1px solid #30475e;
            border-radius: 8px;
            background: #162638;
            color: #bcd0e5;
            cursor: pointer;
            font-size: 20px;
          }

          .qa-form-error {
            margin: 18px 0 0;
            padding: 11px 13px;
            border-radius: 9px;
            background: #2b1b21;
            border: 1px solid #743c48;
            color: #ffb7c0;
          }

          .qa-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-top: 22px;
          }

          .qa-full-width {
            grid-column: 1 / -1;
          }

          .qa-form-field label,
          .qa-modal label {
            display: block;
            margin-bottom: 7px;
            color: #bcd0e4;
            font-size: 13px;
            font-weight: 700;
          }

          .qa-form-field input,
          .qa-form-field textarea,
          .qa-modal input,
          .qa-modal textarea,
          .qa-modal select {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #30475e;
            border-radius: 10px;
            background: #0b1725;
            color: #e8f1fa;
            padding: 12px 13px;
            outline: none;
            font: inherit;
          }

          .qa-form-field input:focus,
          .qa-form-field textarea:focus,
          .qa-modal input:focus,
          .qa-modal textarea:focus,
          .qa-modal select:focus {
            border-color: #19c7c1;
            box-shadow: 0 0 0 3px rgba(25, 199, 193, 0.1);
          }

          .qa-form-field textarea {
            resize: vertical;
            min-height: 115px;
          }

          .qa-form-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-top: 18px;
            padding-top: 17px;
            border-top: 1px solid #23374d;
          }

          .qa-form-footer span {
            color: #7f9cbb;
            font-size: 13px;
          }

          .qa-submit-button {
            border: 0;
            border-radius: 10px;
            padding: 12px 20px;
            background: #19c7c1;
            color: #061118;
            font-weight: 800;
            cursor: pointer;
          }

          .qa-submit-button:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          .qa-stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 20px;
          }

          .qa-stat-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px;
            border: 1px solid #263b53;
            border-radius: 14px;
            background: #101d2d;
          }

          .qa-stat-icon {
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            background: #18384a;
            color: #62ddd6;
            font-weight: 900;
          }

          .qa-stat-card strong {
            display: block;
            margin-top: 3px;
            font-size: 25px;
          }

          .qa-stat-pass .qa-stat-icon {
            background: #123c36;
            color: #5de0ba;
          }

          .qa-stat-fail .qa-stat-icon {
            background: #422630;
            color: #ff8d9e;
          }

          .qa-stat-pending .qa-stat-icon {
            background: #3d3522;
            color: #e9c66e;
          }

          .qa-tests-header {
            padding: 23px 25px;
            border-bottom: 1px solid #263b53;
          }

          .qa-test-list {
            display: flex;
            flex-direction: column;
          }

          .qa-test-row {
            display: grid;
            grid-template-columns: 46px minmax(0, 1fr) auto;
            align-items: center;
            gap: 16px;
            padding: 20px 25px;
            border-bottom: 1px solid #22364b;
          }

          .qa-test-row:last-child {
            border-bottom: 0;
          }

          .qa-test-number {
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            border-radius: 9px;
            background: #182b40;
            color: #78a6d0;
            font-size: 12px;
            font-weight: 800;
          }

          .qa-test-title-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .qa-test-content h4 {
            margin: 0;
            font-size: 16px;
          }

          .qa-test-content p {
            margin: 6px 0 7px;
            color: #8ca8c6;
            line-height: 1.5;
          }

          .qa-created-date {
            color: #607d9d;
            font-size: 11px;
          }

          .qa-status-badge {
            display: inline-flex;
            align-items: center;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
          }

          .qa-status-pending {
            background: #3d3420;
            color: #e9c66e;
          }

          .qa-status-passed {
            background: #123d35;
            color: #62dfbd;
          }

          .qa-status-failed {
            background: #44252e;
            color: #ff91a0;
          }

          .qa-test-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 7px;
            flex-wrap: wrap;
          }

          .qa-test-actions button {
            border-radius: 8px;
            padding: 8px 11px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
          }

          .qa-result-label {
            padding: 8px 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
          }

          .qa-result-passed {
            background: #123c36;
            color: #6ce2c1;
          }

          .qa-result-failed {
            background: #40242c;
            color: #ff9aa8;
          }

          .qa-action-pass {
            border: 1px solid #217e68;
            background: #123c36;
            color: #6ce2c1;
          }

          .qa-action-fail {
            border: 1px solid #864451;
            background: #40242c;
            color: #ff9aa8;
          }

          .qa-action-ticket {
            border: 1px solid #3a6b9a;
            background: #172f47;
            color: #8ec4f2;
          }

          .qa-action-delete {
            border: 1px solid #34495f;
            background: transparent;
            color: #8ea5bd;
          }

          .qa-empty-state {
            text-align: center;
            padding: 65px 20px;
            color: #7895b3;
          }

          .qa-empty-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            margin: 0 auto 13px;
            border-radius: 13px;
            background: #172a3e;
            color: #6bdad3;
            font-size: 25px;
          }

          .qa-empty-state h4 {
            margin: 0 0 6px;
            color: #d8e6f3;
            font-size: 17px;
          }

          .qa-empty-state p {
            margin: 0 0 18px;
          }

          .qa-loader {
            width: 30px;
            height: 30px;
            margin: 0 auto 15px;
            border: 3px solid #294058;
            border-top-color: #19c7c1;
            border-radius: 50%;
            animation: qaSpin 0.8s linear infinite;
          }

          @keyframes qaSpin {
            to {
              transform: rotate(360deg);
            }
          }

          .qa-completion-card {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) 260px;
            align-items: center;
            gap: 18px;
            margin-bottom: 20px;
            padding: 20px 23px;
            border: 1px solid #54482a;
            border-radius: 15px;
            background: #211e16;
          }

          .qa-completion-success {
            border-color: #216354;
            background: #102823;
          }

          .qa-completion-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: #493d20;
            color: #ebc965;
            font-weight: 900;
          }

          .qa-completion-success .qa-completion-icon {
            background: #17493e;
            color: #66dfbf;
          }

          .qa-completion-card h3 {
            margin: 0 0 5px;
            font-size: 17px;
          }

          .qa-completion-card p {
            margin: 0;
            color: #91a8c1;
            font-size: 13px;
          }

          .qa-completion-progress > div:first-child {
            display: flex;
            justify-content: space-between;
            color: #87a4c2;
            font-size: 12px;
            margin-bottom: 7px;
          }

          .qa-completion-progress strong {
            color: #5edbd3;
          }

          .qa-progress-track {
            height: 7px;
            overflow: hidden;
            border-radius: 999px;
            background: #263849;
          }

          .qa-progress-fill {
            height: 100%;
            border-radius: inherit;
            background: #19c7c1;
            transition: width 0.3s ease;
          }

          .qa-ticket-list {
            padding: 4px 25px 15px;
          }

          .qa-ticket-item {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 17px 0;
            border-bottom: 1px solid #22364b;
          }

          .qa-ticket-item:last-child {
            border-bottom: 0;
          }

          .ticket-id {
            color: #5ccfc8;
            font-size: 11px;
            font-weight: 800;
          }

          .qa-ticket-item h4 {
            margin: 5px 0;
          }

          .qa-ticket-item p {
            margin: 0;
            color: #829fbd;
            font-size: 13px;
          }

          .qa-ticket-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .qa-ticket-meta span {
            padding: 6px 9px;
            border-radius: 7px;
            background: #172a3d;
            color: #a9c1da;
            font-size: 11px;
          }

          .qa-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: grid;
            place-items: center;
            padding: 24px;
            background: rgba(3, 9, 17, 0.78);
            backdrop-filter: blur(5px);
          }

          .qa-modal {
            width: min(560px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            padding: 25px;
            border: 1px solid #314960;
            border-radius: 16px;
            background: #101d2d;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.45);
          }

          .qa-modal-header {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 22px;
          }

          .qa-modal-header h3 {
            margin: 4px 0;
            font-size: 22px;
          }

          .qa-modal-header p {
            margin: 4px 0 0;
            color: #809dba;
            font-size: 13px;
          }

          .modal-close {
            width: 34px;
            height: 34px;
            flex: 0 0 auto;
            border: 1px solid #30475e;
            border-radius: 8px;
            background: #17283a;
            color: #c6d8e9;
            cursor: pointer;
            font-size: 20px;
          }

          .qa-modal input,
          .qa-modal textarea,
          .qa-modal select {
            margin-bottom: 15px;
          }

          .qa-modal textarea {
            resize: vertical;
          }

          .ticket-claim-info {
            padding: 13px;
            margin: 2px 0 18px;
            border: 1px solid #294159;
            border-radius: 10px;
            background: #142438;
          }

          .ticket-claim-info strong {
            color: #d6e5f3;
          }

          .ticket-claim-info p {
            margin: 4px 0 0;
            color: #819db9;
            font-size: 12px;
          }

          .qa-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          @media (max-width: 900px) {
            .qa-page-header,
            .qa-project-card {
              flex-direction: column;
              align-items: stretch;
            }

            .qa-project-metrics {
              justify-content: space-between;
            }

            .qa-stat-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .qa-test-row {
              grid-template-columns: 36px minmax(0, 1fr);
            }

            .qa-test-actions {
              grid-column: 2;
              justify-content: flex-start;
            }

            .qa-completion-card {
              grid-template-columns: auto minmax(0, 1fr);
            }

            .qa-completion-progress {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 600px) {
            .qa-form-grid,
            .qa-stat-grid {
              grid-template-columns: 1fr;
            }

            .qa-project-metrics {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }

            .qa-form-footer,
            .qa-ticket-item {
              flex-direction: column;
              align-items: stretch;
            }

            .qa-tests-header {
              flex-direction: column;
            }

            .qa-secondary-create {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}

export default QAReviews;
