document.addEventListener("DOMContentLoaded", () => {
  function codeToRun() {
    // get member data for recording inputs
    const memberAtid = document.querySelector("#member-atid").value;
    const memberMsid = document.querySelector("#member-msid").value;

    // get opportunity data
    const opportunityData = document.querySelector("#opportunity-data");
    const opportunityAtid = opportunityData.getAttribute("opportunity-atid");
    //const opportunityStatus =
    //  opportunityData.getAttribute("opportunity-status");

    // Script to show/hide completed actions/sections
    window.$memberstackDom.getCurrentMember().then((member) => {
      const enrolledOpportunities =
        member?.data?.customFields["opportunities-approved"];
      const pendingOpportunities =
        member?.data?.customFields["opportunities-pending"];
      const waitlistOpportunities =
        member?.data?.customFields["opportunities-waitlist"];

      // Function to hide elements by attribute
      const hideElementsByAttribute = (attr, value) => {
        document
          .querySelectorAll(`[opportunity-label="${value}"]`)
          .forEach((element) => (element.style.display = "none"));
      };

      // Check if opportunityAtid is in any of the arrays
      const isInEnrolled = enrolledOpportunities.includes(opportunityAtid);
      const isInWaitlist = waitlistOpportunities.includes(opportunityAtid);
      const isInPending = pendingOpportunities.includes(opportunityAtid);

      if (!isInEnrolled && !isInWaitlist && !isInPending) {
        // If opportunityAtid is not in any array, hide elements with opportunity-label=user-group
        hideElementsByAttribute("opportunity-label", "user-group");
        const ctasWrapper = document.querySelector("#opportunity-ctas");
        ctasWrapper.style.display = "flex";
      } else {
        // If opportunityAtid is found in any array, hide elements with opportunity-label=cms-group
        hideElementsByAttribute("opportunity-label", "cms-group");

        if (isInEnrolled) {
          hideElementsByAttribute("opportunity-label", "user-waitlist");
          hideElementsByAttribute("opportunity-label", "user-pending");
        }

        if (isInWaitlist) {
          hideElementsByAttribute("opportunity-label", "user-approved");
          hideElementsByAttribute("opportunity-label", "user-pending");
        }

        if (isInPending) {
          hideElementsByAttribute("opportunity-label", "user-waitlist");
          hideElementsByAttribute("opportunity-label", "user-approved");
        }
      }

      const labelsWrapper = document.querySelector("#labels-wrapper");
      labelsWrapper.style.display = "flex";

      // function to create application on click
      const triggers = document.querySelectorAll("[opportunity-trigger]");
      triggers.forEach((trigger) => {
        trigger.addEventListener("click", () => {
          const targetType = trigger.getAttribute("opportunity-trigger");
          const targetAtid = opportunityAtid;
          const url = `https://hook.eu1.make.com/i1u27950lpbyvg9qlk1cen465alahi5o?memberATID=${memberAtid}&memberMSID=${memberMsid}&targetATID=${targetAtid}&targetType=${targetType}`;

          const loader = document.querySelector("#loader");
          const confirmation = document.querySelector("#confirmation");

          loader.style.display = "flex";
          trigger.style.pointerEvents = "none";

          // Send data using fetch
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => {
              if (response.ok) {
                return response.text();
              }
              throw new Error("Network response was not ok.");
            })

            .then(() => {
              trigger.remove();
              loader.style.display = "none";
              confirmation.style.display = "block";
            })

            .catch((error) => {
              console.error("Error:", error);
            });
        });
      });
    });
  }

  if (window.$memberstackReady) {
    codeToRun();
  } else {
    document.addEventListener("memberstack.ready", codeToRun);
  }
});
