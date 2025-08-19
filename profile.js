document.addEventListener("DOMContentLoaded", () => {
  function codeToRun() {
    // Function to check if a URL param exists
    function hasLoginParam() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("login") === "true";
    }

    // Only run the onboarding status script if ?login=true is present in the URL
    if (hasLoginParam()) {
      // Onboarding status script, to redirect user until onboarding is completed
      window.$memberstackDom.getCurrentMember().then((member) => {
        const onboarded =
          member?.data?.customFields["onboarding-complete"] ?? false;
        // Redirect user if onboarded is false
        if (!onboarded) {
          window.location.replace(
            "https://www.goinggreentogether.org/onboarding-flow"
          );
        }
      });
    }

    // Script to show/hide completed actions/sections & enrolled opportunities
    window.$memberstackDom.getCurrentMember().then((member) => {
      const customFields = member?.data?.customFields;
      const loader = document.querySelector("#opportunities-loader");
      const startedSections = customFields["sections-started"];

      const sections = {
        completedActions: {
          ids: customFields["actions-completed"],
          counterId: "actions-count",
        },
        completedSections: {
          ids: customFields["sections-completed"],
          counterId: "sections-count",
        },
        approvedOpportunities: {
          ids: customFields["opportunities-approved"],
          targetId: "opportunities-approved",
        },
        pendingOpportunities: {
          ids: customFields["opportunities-pending"],
          targetId: "opportunities-pending",
        },
        waitlistedOpportunities: {
          ids: customFields["opportunities-waitlist"],
          targetId: "opportunities-waitlisted",
        },
      };

      console.log(sections.completedSections.ids);

      // Function to update count and apply classes to completed actions/sections
      function updateCompletedSections({ ids, counterId }) {
        if (Array.isArray(ids)) {
          if (counterId) {
            const counterEl = document.getElementById(counterId);
            if (counterEl) counterEl.innerText = ids.length;
          }
          ids.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
              const checkbox = element
                .closest(".workflow_list-item")
                ?.querySelector(".check-circle");
              checkbox?.classList.add("is-checked");
            }
          });
        }
      }

      // function used for the In Progress tag on sections list
      function removeHiddenClass(idsArray) {
        if (Array.isArray(idsArray)) {
          idsArray.forEach((id) => {
            const element = document.querySelector(
              `[section-in-progress="${id}"]`
            );
            if (element) {
              element.classList.remove("is-hidden-onload");
            }
          });
        }
      }

      function removeTemplateElements() {
        const templates = document.querySelectorAll(
          ".opportunity_item.is-template"
        );
        templates.forEach((template) => {
          template.remove();
        });
      }

      // Function to move opportunities based on template
      function moveOpportunities(ids, targetDivId) {
        const targetDiv = document.getElementById(targetDivId);
        if (targetDiv && Array.isArray(ids)) {
          ids.forEach((id) => {
            const element = document.querySelector(`[data-atid="${id}"]`);
            if (element) {
              cloneOpportunity(element, targetDiv);
              element.remove();
            }
          });
        }
      }

      // Function to clone an opportunity and move it to a target div
      function cloneOpportunity(sourceElement, targetDiv) {
        const template = targetDiv.querySelector(
          ".opportunity_item.is-template"
        );
        if (template) {
          const newOpportunity = template.cloneNode(true);
          newOpportunity.classList.remove("is-template");
          newOpportunity.querySelector(".opportunity_name").innerText =
            sourceElement.getAttribute("data-name");
          newOpportunity.querySelector(".icon_wrapper").href =
            sourceElement.querySelector(".icon_wrapper").href;
          targetDiv.appendChild(newOpportunity);
        }
      }

      // Function to move opportunities to Open or Waitlist sections
      function moveOtherOpportunities() {
        const targetDivs = {
          Open: document.getElementById("opportunities-open"),
          Waitlist: document.getElementById("opportunities-waitlist"),
        };

        document
          .querySelectorAll("#main-opportunities-list .opportunity_item")
          .forEach((item) => {
            const status = item.getAttribute("data-status");
            const targetDiv = targetDivs[status];
            if (targetDiv) {
              cloneOpportunity(item, targetDiv);
              item.remove();
            }
          });
      }

      function clearEmptyOpportunityCategories() {
        // get all wrappers
        const wrappers = document.querySelectorAll(
          ".p-opportunities_group .opportunities_list"
        );
        // remove wrappers with no children
        wrappers.forEach((wrapper) => {
          if (wrapper.childElementCount === 0) {
            const parentEl = wrapper.closest(".p-opportunities_group");
            if (parentEl) parentEl.remove();
          }
        });

        // add cc-no-line class to last visible .opportunities_list after clearing the empty ones
        const opportunitiesWrapper = document.querySelector(
          "#opportunities-wrapper"
        );
        if (opportunitiesWrapper) {
          // Get all .p-opportunities_group children that are still in the DOM and visible
          const groups = Array.from(
            opportunitiesWrapper.querySelectorAll(".p-opportunities_group")
          ).filter((group) => group.offsetParent !== null); // filter out hidden elements if any

          if (groups.length > 0) {
            // Add cc-no-line to the last visible .opportunities_list
            const lastGroup = groups[groups.length - 1];
            const lastList = lastGroup.querySelector(".opportunities_list");
            if (lastList) lastList.classList.add("cc-no-line");
          }
        }
      }

      // Apply actions/sections and move opportunities
      removeHiddenClass(startedSections);
      Object.values(sections).forEach(updateCompletedSections);
      moveOpportunities(
        sections.approvedOpportunities.ids,
        sections.approvedOpportunities.targetId
      );
      moveOpportunities(
        sections.pendingOpportunities.ids,
        sections.pendingOpportunities.targetId
      );
      moveOpportunities(
        sections.waitlistedOpportunities.ids,
        sections.waitlistedOpportunities.targetId
      );

      moveOtherOpportunities();
      removeTemplateElements();
      clearEmptyOpportunityCategories();

      loader.remove();
    });
  }

  if (window.$memberstackReady) {
    codeToRun();
  } else {
    document.addEventListener("memberstack.ready", codeToRun);
  }
});
