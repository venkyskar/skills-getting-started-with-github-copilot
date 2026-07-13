document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const selectedActivityPanel = document.getElementById("selected-activity-panel");
  const selectedActivityTitle = document.getElementById("selected-activity-title");
  const selectedActivityParticipants = document.getElementById("selected-activity-participants");

  let activitiesData = {};

  function renderParticipantList(activityName, targetContainer) {
    if (!activityName || !activitiesData[activityName]) {
      targetContainer.innerHTML = "";
      return;
    }

    const details = activitiesData[activityName];
    const participants = details.participants || [];

    targetContainer.innerHTML = participants.length
      ? `<div class="participants-list">${participants
          .map(
            (participant) => `
              <div class="participant-row">
                <span class="participant-email">${participant}</span>
                <button class="participant-delete-btn" data-email="${participant}" data-activity="${activityName}" type="button" aria-label="Remove ${participant}">
                  ✕
                </button>
              </div>`
          )
          .join("")}</div>`
      : '<p class="participants-empty">No participants yet</p>';
  }

  function renderSelectedActivityParticipants(activityName) {
    if (!activityName || !activitiesData[activityName]) {
      selectedActivityPanel.classList.add("hidden");
      return;
    }

    selectedActivityTitle.textContent = `${activityName} Participants`;
    renderParticipantList(activityName, selectedActivityParticipants);
    selectedActivityPanel.classList.remove("hidden");
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to remove participant");
      }

      const activity = activitiesData[activityName];
      if (activity) {
        activity.participants = (activity.participants || []).filter((participant) => participant !== email);
      }

      renderSelectedActivityParticipants(activityName);
      fetchActivities();
      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
    } catch (error) {
      messageDiv.textContent = error.message;
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      activitiesData = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activitiesData).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants || [];
        const participantsMarkup = participants.length
          ? `<div class="participants-list">${participants
              .map(
                (participant) => `
                  <div class="participant-row">
                    <span class="participant-email">${participant}</span>
                    <button class="participant-delete-btn" data-email="${participant}" data-activity="${name}" type="button" aria-label="Remove ${participant}">
                      ✕
                    </button>
                  </div>`
              )
              .join("")}</div>`
          : '<p class="participants-empty">No participants yet</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      if (activitySelect.value) {
        renderSelectedActivityParticipants(activitySelect.value);
      } else {
        selectedActivityPanel.classList.add("hidden");
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitySelect.addEventListener("change", (event) => {
    renderSelectedActivityParticipants(event.target.value);
  });

  document.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete-btn");
    if (!deleteButton) {
      return;
    }

    const activityName = deleteButton.dataset.activity || activitySelect.value;
    const email = deleteButton.dataset.email;

    if (activityName && email) {
      await unregisterParticipant(activityName, email);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  renderSelectedActivityParticipants(activitySelect.value);
});
