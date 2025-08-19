document.addEventListener("DOMContentLoaded", () => {
  function codeToRun() {
    // get member data for recording inputs
    const memberAtid = document.querySelector("#member-atid").value;
    const memberMsid = document.querySelector("#member-msid").value;

    // remove all CMS hidden elements
    const hiddenOption = document.querySelectorAll(".w-condition-invisible");
    hiddenOption.forEach((item) => {
      item.remove();
    });

    // Add checked combo class to show expandable answer on checkboxes
    document
      .querySelectorAll('.check-box_item input[type="checkbox"]')
      .forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
          const checkBoxItem = this.closest(".check-box_item");

          if (this.checked) {
            checkBoxItem.classList.add("is-checked");
          } else {
            checkBoxItem.classList.remove("is-checked");
          }
        });
      });

    // Add checked combo class to show expandable answer on radios
    document
      .querySelectorAll('.check-box_item input[type="radio"]')
      .forEach(function (radio) {
        radio.addEventListener("change", function () {
          const radioItem = this.closest(".check-box_item");
          const parentGroup = radioItem.closest(".group-div");
          const otherRadios = parentGroup.querySelectorAll(".check-box_item");

          otherRadios.forEach((item) => {
            item.classList.remove("is-checked");
          });
          radioItem.classList.add("is-checked");
        });
      });

    // function to nest questions and organize radio groups
    function organizeFormElements() {
      // Select all check-box_item elements
      const questions = document.querySelectorAll(
        "#questions-list .check-box_item"
      );

      // Object to store radio groups
      const radioGroups = {};

      questions.forEach((item) => {
        // Remove hidden elements
        item
          .querySelectorAll(".w-condition-invisible")
          .forEach((hiddenItem) => {
            hiddenItem.remove();
          });

        // Find parent exercise and append question to it
        const questionParentAtid = item.getAttribute("data-action-atid");
        const parentExercise = document.querySelector(
          `[data-action-atid="${questionParentAtid}"]`
        );
        const parentTarget = parentExercise.querySelector(".form-list");
        if (parentTarget) parentTarget.appendChild(item);

        // If there are radio inputs inside the current question
        const radios = item.querySelectorAll('input[type="radio"]');
        radios.forEach((radio) => {
          const groupName = radio.name; // Get the group name from the radio's name attribute

          // If the group doesn't exist yet, create a div for the group
          if (!radioGroups[groupName]) {
            const groupDiv = document.createElement("div"); // Create group div
            groupDiv.classList.add("group-div"); // Add class for styling if needed

            // Create and add the label with the group name
            const groupHeading = document.createElement("label");
            groupHeading.textContent = groupName;
            groupDiv.appendChild(groupHeading);

            // Append the group div to the form-list div
            parentTarget.appendChild(groupDiv);

            // Store the group div in the radioGroups object
            radioGroups[groupName] = groupDiv;
          }

          // Append the current .check-box_item div to the respective group div
          radioGroups[groupName].appendChild(item);
        });
      });
    }

    organizeFormElements();

    // select all elements with an attribute of target-tracking="true"
    // run tracking function on those elements
    const triggers = document.querySelectorAll('[target-tracking="true"]');

    // Iterate over the NodeList and log each element
    triggers.forEach((element) => {
      const targetType = element.getAttribute("target-type");
      const parentSection = element.getAttribute("target-section") || null;

      element.addEventListener("click", function (event) {
        if (targetType !== "exercise") {
          // Get relevant data & add them as params to Webhook
          const targetAtid = element.getAttribute("target-atid");
          let url = `https://hook.eu1.make.com/6ncy30sbjvo6vsbniowc1b90911at5hh?memberATID=${memberAtid}&memberMSID=${memberMsid}&targetATID=${targetAtid}&targetType=${targetType}`;

          if (parentSection !== null) {
            url += `&parentSection=${parentSection}`;
          }

          const loader = element.querySelectorAll(".is-loader")[0];
          const checkMark = element.querySelectorAll(".is-checkmark")[0];
          const checkbox = element.querySelectorAll(".is-unchecked")[0];
          checkbox.style.opacity = "0";
          loader.style.display = "flex";

          // Send data using fetch
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => {
              if (response.ok) {
                return response.text(); // Treat response as text
              }
              throw new Error("Network response was not ok.");
            })

            .then(() => {
              loader.style.display = "none";
              checkbox.style.opacity = "100";
              checkMark.style.display = "flex";

              const completedText =
                targetType === "section"
                  ? "Section Completed"
                  : "Task Completed";
              element.style.pointerEvents = "none";
              //element.setAttribute("tabindex", "-1"); // to prevent triggering this through tabing

              const buttonText = element.querySelector(
                `[target-completed-text="${targetAtid}"]`
              );
              buttonText.innerText = completedText;
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        } else if (targetType == "exercise") {
          const exerciseWrapper = element.closest(".form-exercises");
          const checkboxesWrapper = exerciseWrapper.querySelector(".form-list");

          var checkedEntries = [];
          var uncheckedEntries = [];

          // Select all checkboxes and radios, regardless of checked state
          const allInputs = checkboxesWrapper.querySelectorAll(
            'input[type="checkbox"], input[type="radio"]'
          );

          // Iterate over all inputs
          allInputs.forEach((input) => {
            const targetAtid = input.getAttribute("data-question-atid");
            if (targetAtid) {
              if (input.checked) {
                checkedEntries.push(targetAtid);
              } else {
                uncheckedEntries.push(targetAtid);
              }
            }
          });

          // URL encode the arrays
          const checkedEntriesEncoded = encodeURIComponent(
            checkedEntries.join(",")
          );
          const uncheckedEntriesEncoded = encodeURIComponent(
            uncheckedEntries.join(",")
          );

          // Get relevant data & add them as params to Webhook
          const targetAtid = element.getAttribute("target-atid");
          let url = `https://hook.eu1.make.com/6ncy30sbjvo6vsbniowc1b90911at5hh?memberATID=${memberAtid}&memberMSID=${memberMsid}&targetATID=${targetAtid}&targetType=${targetType}&uncheckedATIDs=${uncheckedEntriesEncoded}&checkedATIDs=${checkedEntriesEncoded}`;

          if (parentSection !== null) {
            url += `&parentSection=${parentSection}`;
          }

          // visual part
          const loader = element.nextElementSibling; //querySelectorAll('.is-loader')[0];
          loader.style.display = "flex";
          element.innerText = "Saving Answers..";

          // Send data using fetch
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => {
              if (response.ok) {
                return response.text(); // Treat response as text
              }
              throw new Error("Network response was not ok.");
            })
            // Visual Part
            .then(() => {
              // Hide Loader
              loader.style.display = "none";

              // set button text to Saved for 5 seconds
              element.innerText = "Answers Saved!";

              // Change it back to "Save Answers" after 5 seconds
              setTimeout(() => {
                element.innerText = "Save Answers";
              }, 5000);
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }
      });
    });

    // Script to show/hide completed actions/sections
    window.$memberstackDom.getCurrentMember().then((member) => {
      const completedSections =
        member?.data?.customFields["sections-completed"];
      const completedActions = member?.data?.customFields["actions-completed"];
      const completedQuestions =
        member?.data?.customFields["questions-completed"];

      // Function to add the 'is-visible' class to elements based on an array of IDs
      function addVisibleClass(idsArray, type) {
        if (Array.isArray(idsArray)) {
          // Check if idsArray is an array
          idsArray.forEach(function (id) {
            if (type == "questions") {
              const element = document.querySelector(
                `[data-question-atid="${id}"]`
              );

              if (element) {
                const input = element.querySelector("input");

                if (input) {
                  input.checked = true;

                  // If input is checkbox, we need to add the class to check
                  const checkbox = input.previousElementSibling;
                  if (checkbox) {
                    checkbox.classList.add("w--redirected-checked");
                  }

                  // If input is radio, we need to add the class to parent element
                  const parentItem = input.closest(".check-box_item");
                  if (parentItem) {
                    parentItem.classList.add("is-checked");
                  }
                }
              }
            } else {
              const element = document.getElementById(id);
              if (element) {
                element.style.display = "block";

                //const parentClass = type === "sections" ? '.section-complete' : '.button-icon';
                const completedText =
                  type === "sections" ? "Section Completed" : "Task Completed";

                //const parent = element.closest(parentClass);
                const parent = element.closest('[target-tracking="true"]');
                parent.style.pointerEvents = "none";
                // parent.setAttribute("tabindex", "-1"); // to prevent triggering this through tabing

                // set button text if completed
                const buttonText = parent.querySelector(
                  `[target-completed-text="${id}"]`
                );
                buttonText.innerText = completedText;
              }
            }
          });
        } else {
          console.warn("Expected an array, but got:", idsArray);
        }
      }

      addVisibleClass(completedActions, "actions");
      addVisibleClass(completedSections, "sections");
      addVisibleClass(completedQuestions, "questions");
    });
  }

  if (window.$memberstackReady) {
    codeToRun();
  } else {
    // Wait for Memberstack to be ready if it's not already
    document.addEventListener("memberstack.ready", codeToRun);
  }
});
