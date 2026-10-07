import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from "react";



import UserProfileContext from "./userProfileContext.js";



import {

  loadUserProfile,

  saveUserProfile,

} from "./userProfileStorage.js";



const API_BASE_URL =

  "http://65.0.11.153:5001/api";



function getToken() {

  return localStorage.getItem("token");

}



// Decode JWT payload.

// Only used to get the logged-in user's ID.

// Token verification itself is still done by backend.

function getUserIdFromToken() {

  try {

    const token = getToken();



    if (!token) {

      return null;

    }



    const payload = token.split(".")[1];



    if (!payload) {

      return null;

    }



    const decoded = JSON.parse(

      atob(

        payload

          .replace(/-/g, "+")

          .replace(/_/g, "/")

      )

    );



    return decoded?.userId || null;



  } catch (error) {

    console.error(

      "Unable to decode user token:",

      error

    );



    return null;

  }

}



export default function UserProfileProvider({

  children,

}) {

  const initialProfile = loadUserProfile();

  // Logged-in account returned by the login API.
  // The login response should be stored in localStorage as "user".
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Unable to load logged-in user:", error);
      return null;
    }
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch (error) {
      console.error("Unable to refresh logged-in user:", error);
      setUser(null);
    }
  }, []);



  const [department, setDepartmentState] =

    useState(

      initialProfile.department || ""

    );



  const [skills, setSkills] = useState(

    Array.isArray(initialProfile.skills)

      ? initialProfile.skills

      : []

  );



  const [history, setHistory] = useState(

    Array.isArray(initialProfile.history)

      ? initialProfile.history

      : []

  );



  const [performance, setPerformance] =

    useState(

      initialProfile.performance || null

    );



  const [loadingSkills, setLoadingSkills] =

    useState(false);



  const [loadingHistory, setLoadingHistory] =

    useState(false);



  const [

    loadingPerformance,

    setLoadingPerformance,

  ] = useState(false);



  const [skillError, setSkillError] =

    useState("");



  const [historyError, setHistoryError] =

    useState("");



  /* =====================================================

     SAVE PROFILE LOCALLY

  ===================================================== */



  useEffect(() => {

    saveUserProfile({

      department,

      skills,

      history,

      performance,

    });

  }, [

    department,

    skills,

    history,

    performance,

  ]);



  /* =====================================================

     GET SKILLS

     GET /api/users/skills

  ===================================================== */



  const fetchSkills = useCallback(

    async () => {

      const token = getToken();



      if (!token) {

        return;

      }



      setLoadingSkills(true);

      setSkillError("");



      try {

        const response = await fetch(

          `${API_BASE_URL}/users/skills`,

          {

            method: "GET",

            headers: {

              Authorization:

                `Bearer ${token}`,

            },

          }

        );



        const data =

          await response.json();



        if (!response.ok) {

          throw new Error(

            data?.message ||

              "Failed to fetch skills"

          );

        }



        const backendSkills =

          Array.isArray(data?.skills)

            ? data.skills

            : [];



        setSkills(backendSkills);



      } catch (error) {

        console.error(

          "Fetch skills error:",

          error

        );



        setSkillError(

          error.message ||

            "Failed to load skills"

        );



      } finally {

        setLoadingSkills(false);

      }

    },

    []

  );



  /* =====================================================

     GET WORK HISTORY

     GET /api/users/:userId/history

  ===================================================== */



  const fetchHistory = useCallback(

    async () => {

      const token = getToken();



      if (!token) {

        return;

      }



      const userId =

        getUserIdFromToken();



      if (!userId) {

        setHistoryError(

          "Unable to identify logged-in user."

        );

        return;

      }



      setLoadingHistory(true);

      setHistoryError("");



      try {

        const response = await fetch(

          `${API_BASE_URL}/users/${userId}/history`,

          {

            method: "GET",

            headers: {

              Authorization:

                `Bearer ${token}`,

            },

          }

        );



        const data =

          await response.json();



        if (!response.ok) {

          throw new Error(

            data?.message ||

              "Failed to fetch work history"

          );

        }



        const backendHistory =

          Array.isArray(data?.history)

            ? data.history

            : [];



        setHistory(

          backendHistory

        );



      } catch (error) {

        console.error(

          "Fetch history error:",

          error

        );



        setHistoryError(

          error.message ||

            "Failed to load work history"

        );



      } finally {

        setLoadingHistory(false);

      }

    },

    []

  );



  /* =====================================================

     GET PERFORMANCE

     GET /api/users/:userId/performance

  ===================================================== */



  const fetchPerformance =

    useCallback(

      async () => {

        const token = getToken();



        if (!token) {

          return;

        }



        const userId =

          getUserIdFromToken();



        if (!userId) {

          return;

        }



        setLoadingPerformance(true);



        try {

          const response = await fetch(

            `${API_BASE_URL}/users/${userId}/performance`,

            {

              method: "GET",

              headers: {

                Authorization:

                  `Bearer ${token}`,

              },

            }

          );



          const data =

            await response.json();



          if (!response.ok) {

            throw new Error(

              data?.message ||

                "Failed to fetch performance"

            );

          }



          setPerformance(data);



        } catch (error) {

          console.error(

            "Fetch performance error:",

            error

          );



        } finally {

          setLoadingPerformance(false);

        }

      },

      []

    );



  /* =====================================================

     LOAD BACKEND DATA WHEN PROVIDER STARTS

  ===================================================== */



  useEffect(() => {

    fetchSkills();

    fetchHistory();

    fetchPerformance();

  }, [

    fetchSkills,

    fetchHistory,

    fetchPerformance,

  ]);



  /* =====================================================

     SET DEPARTMENT

  ===================================================== */



  const setDepartment = useCallback(

    (value) => {

      setDepartmentState(value);

    },

    []

  );



  /* =====================================================

     ADD SKILL

     POST /api/users/skills

  ===================================================== */



  const addSkill = useCallback(

    async (skillName) => {

      const cleanSkill =

        String(skillName || "").trim();



      if (!cleanSkill) {

        return null;

      }



      const token = getToken();



      if (!token) {

        throw new Error(

          "Authentication required. Please login again."

        );

      }



      const alreadyExists =

        skills.some(

          (skill) =>

            String(

              skill?.skill_name || ""

            ).toLowerCase() ===

            cleanSkill.toLowerCase()

        );



      if (alreadyExists) {

        return null;

      }



      setSkillError("");



      try {

        const response = await fetch(

          `${API_BASE_URL}/users/skills`,

          {

            method: "POST",



            headers: {

              "Content-Type":

                "application/json",



              Authorization:

                `Bearer ${token}`,

            },



            body: JSON.stringify({

              name: cleanSkill,

            }),

          }

        );



        const data =

          await response.json();



        if (!response.ok) {

          throw new Error(

            data?.message ||

              "Failed to add skill"

          );

        }



        const newSkill =

          data?.skill;



        if (!newSkill) {

          throw new Error(

            "Skill was added but the server did not return the skill."

          );

        }



        setSkills(

          (currentSkills) => [

            ...currentSkills,

            newSkill,

          ]

        );



        return newSkill;



      } catch (error) {

        console.error(

          "Add skill error:",

          error

        );



        setSkillError(

          error.message ||

            "Failed to add skill"

        );



        throw error;

      }

    },

    [skills]

  );



  /* =====================================================

     UPDATE SKILL

     PATCH /api/users/skills/:skillId

  ===================================================== */



  const updateSkill = useCallback(

    async (

      skillId,

      skillName,

      proficiency = null

    ) => {

      const cleanSkill =

        String(skillName || "").trim();



      if (!skillId || !cleanSkill) {

        return null;

      }



      const token = getToken();



      if (!token) {

        throw new Error(

          "Authentication required. Please login again."

        );

      }



      setSkillError("");



      try {

        const response = await fetch(

          `${API_BASE_URL}/users/skills/${skillId}`,

          {

            method: "PATCH",



            headers: {

              "Content-Type":

                "application/json",



              Authorization:

                `Bearer ${token}`,

            },



            body: JSON.stringify({

              name: cleanSkill,

              proficiency,

            }),

          }

        );



        const data =

          await response.json();



        if (!response.ok) {

          throw new Error(

            data?.message ||

              "Failed to update skill"

          );

        }



        const updatedSkill =

          data?.skill;



        if (!updatedSkill) {

          throw new Error(

            "Skill was updated but the server did not return the skill."

          );

        }



        setSkills(

          (currentSkills) =>

            currentSkills.map(

              (skill) =>

                skill.id === skillId

                  ? updatedSkill

                  : skill

            )

        );



        return updatedSkill;



      } catch (error) {

        console.error(

          "Update skill error:",

          error

        );



        setSkillError(

          error.message ||

            "Failed to update skill"

        );



        throw error;

      }

    },

    []

  );



  /* =====================================================

     DELETE SKILL

     DELETE /api/users/skills/:skillId

  ===================================================== */



  const removeSkill = useCallback(

    async (skillId) => {

      if (!skillId) {

        return;

      }



      const token = getToken();



      if (!token) {

        throw new Error(

          "Authentication required. Please login again."

        );

      }



      setSkillError("");



      try {

        const response = await fetch(

          `${API_BASE_URL}/users/skills/${skillId}`,

          {

            method: "DELETE",

            headers: {

              Authorization:

                `Bearer ${token}`,

            },

          }

        );



        const data =

          await response.json();



        if (!response.ok) {

          throw new Error(

            data?.message ||

              "Failed to delete skill"

          );

        }



        setSkills(

          (currentSkills) =>

            currentSkills.filter(

              (skill) =>

                skill.id !== skillId

            )

        );



        return data;



      } catch (error) {

        console.error(

          "Delete skill error:",

          error

        );



        setSkillError(

          error.message ||

            "Failed to delete skill"

        );



        throw error;

      }

    },

    []

  );



  /* =====================================================

     ADD HISTORY

     Kept for compatibility.

  ===================================================== */



  const addHistory = useCallback(

    (historyItem) => {

      setHistory(

        (currentHistory) => [

          ...currentHistory,

          historyItem,

        ]

      );

    },

    []

  );



  /* =====================================================

     CONTEXT VALUE

  ===================================================== */



  const value = useMemo(

    () => ({

      user,

      department,



      skills,



      history,



      performance,



      loadingSkills,



      loadingHistory,



      loadingPerformance,



      skillError,



      historyError,



      setDepartment,



      addSkill,



      updateSkill,



      removeSkill,



      fetchSkills,



      fetchHistory,



      fetchPerformance,



      addHistory,

    }),

    [

      user,

      department,

      skills,

      history,

      performance,



      loadingSkills,

      loadingHistory,

      loadingPerformance,



      skillError,

      historyError,



      setDepartment,



      addSkill,

      updateSkill,

      removeSkill,



      fetchSkills,

      fetchHistory,

      fetchPerformance,



      addHistory,

    ]

  );



  return (

    <UserProfileContext.Provider

      value={value}

    >

      {children}

    </UserProfileContext.Provider>

  );

}