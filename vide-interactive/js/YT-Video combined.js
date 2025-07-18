function customVideoIn(editor) {
  editor.on("component:add", (model) => {
    if (model.get("type") === "videoIn") {
      // Ask number of pages when video block is added
      askNumberOfPages();
    }
  });

  // 🎯 Step 1: Show modal to ask for number of pages
  function askNumberOfPages() {
    editor.Modal.setTitle("Enter Number of Pages");
    editor.Modal.setContent(`
    <div>
      <label for="customPageCount">How many pages do you want?</label>
      <input type="number" id="customPageCount" class="form-control" min="1" placeholder="Enter a number" style="margin-top: 10px;" />
      
      <button id="confirmPageCount" class="btn btn-primary" style="margin-top: 15px;">Next</button>
    </div>
  `);

    editor.Modal.open();

    // Confirm button handler
    document
      .getElementById("confirmPageCount")
      .addEventListener("click", handlePageSelection);
  }

  // 🎨 Handle page selection and proceed to canvas size
  function handlePageSelection() {
    const numPages = parseInt(document.getElementById("customPageCount").value);

    if (isNaN(numPages) || numPages <= 0) {
      alert("Please enter a valid number of pages.");
      return;
    }

    // Proceed to canvas size selection
    askCanvasSize(numPages);
  }

  function askCanvasSize(numPages) {
    editor.Modal.setTitle("Select Canvas Size");
    editor.Modal.setContent(`
    <div>
      <label for="canvasSizeSelect">Choose Canvas Size:</label>
      <select id="canvasSizeSelect" class="form-control">
        <option value="A4">A4 (595px x 842px)</option>
        <option value="720p">720p (1280px x 720px)</option>
        <option value="custom">Custom Size</option>
      </select>

      <div id="customSizeInputs" style="display:none; margin-top: 10px;">
        <label for="customWidth">Width:</label>
        <input type="text" id="customWidth" class="form-control" placeholder="Enter width (e.g., 800px)" />

        <label for="customHeight" style="margin-top: 10px;">Height:</label>
        <input type="text" id="customHeight" class="form-control" placeholder="Enter height (e.g., 600px)" />
      </div>

      <button id="confirmCanvasSize" class="btn btn-primary" style="margin-top: 15px;">Confirm</button>
    </div>
  `);

    editor.Modal.open();

    // ✅ Bind events *after* modal is rendered
    document
      .getElementById("canvasSizeSelect")
      .addEventListener("change", handleSizeChange);

    document
      .getElementById("confirmCanvasSize")
      .addEventListener("click", () => handleCanvasSelection(numPages));
  }

  // 🎯 Handle size selection and custom input visibility
  function handleSizeChange() {
    const selectedSize = document.getElementById("canvasSizeSelect").value;
    const customInputs = document.getElementById("customSizeInputs");

    if (selectedSize === "custom") {
      customInputs.style.display = "block"; // Show inputs
    } else {
      customInputs.style.display = "none"; // Hide inputs
    }
  }

  // 🎨 Handle canvas selection and create slides
  function handleCanvasSelection(numPages) {
    const selectedSize = document.getElementById("canvasSizeSelect").value;
    let width, height;

    switch (selectedSize) {
      case "A4":
        width = "595px";
        height = "840px";
        break;
      case "720p":
        width = "1280px";
        height = "720px";
        break;
      case "custom":
        width = document.getElementById("customWidth").value;
        height = document.getElementById("customHeight").value;
        if (!isValidSize(width) || !isValidSize(height)) {
          alert("Invalid custom size. Please enter valid dimensions.");
          return;
        }
        break;
      default:
        alert("Invalid option. Using default A4 size.");
        width = "595px";
        height = "842px";
    }

    // Create slides with selected size
    createSlides(numPages, width, height);
    editor.Modal.close();
  }

  // 🎨 Validate custom size format
  function isValidSize(size) {
    return size && size.match(/^\d+(px|%)$/);
  }

  let transitions = {};
  let clickStates = {};
  window.presentationState = {
    currentSlideIndex: 1, // Current active slide index
    slides: [], // Stores slide components
  };

  let currentSlideIndex = window.presentationState.currentSlideIndex; // Keep track of active slide
  let slides = window.presentationState.slides;

  const activeStyle = document.createElement("style");
  activeStyle.innerHTML = `
  .thumbnail.active-thumbnail {
    transform: scale(1.2) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25) !important;
    border-color: #007bff;
  }
`;
  document.head.appendChild(activeStyle);

  // 🎨 Enhanced styling for slide thumbnails
  function createSlides(numPages, width, height) {
    window.presentationState.slides = slides;
    const slidesContainer = document.createElement("div");
    slidesContainer.id = "slides-thumbnails";
    slidesContainer.style.position = "sticky";
    slidesContainer.style.bottom = "0";
    slidesContainer.style.left = "0";
    slidesContainer.style.width = "82.9%";
    slidesContainer.style.zIndex = "999";
    slidesContainer.style.display = "flex";
    slidesContainer.style.overflowX = "auto";
    slidesContainer.style.background = "#f9f9f9";
    slidesContainer.style.padding = "10px 15px";
    slidesContainer.style.border = "1px solid #ccc";
    slidesContainer.style.alignItems = "center";

    function createDeleteButton(thumbnail, slideIndex) {
      const deleteBtn = document.createElement("div");
      deleteBtn.innerHTML = "&times;";
      deleteBtn.style.position = "absolute";
      deleteBtn.style.top = "1px";
      deleteBtn.style.right = "4px";
      deleteBtn.style.fontSize = "23px";
      deleteBtn.style.color = "#000000";
      // deleteBtn.style.background = "#2e0d7d";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.style.zIndex = "10";
      deleteBtn.title = "Delete Slide";

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this slide?"))
          return;
        const index = parseInt(thumbnail.getAttribute("data-slide-index"));

        // Remove slide component and thumbnail
        slides[index - 1].remove();
        slides.splice(index - 1, 1);
        thumbnail.remove();

        delete transitions[index];
        delete clickStates[index];

        // Reindex slides, thumbnails, transitions, clickStates
        const allThumbnails = slidesContainer.querySelectorAll(".thumbnail");
        allThumbnails.forEach((thumb, idx) => {
          const newIndex = idx + 1;
          thumb.innerText = `Page ${newIndex}`;
          thumb.setAttribute("data-slide-index", newIndex);

          // Remove old delete buttons if any
          const oldDelete = thumb.querySelector("div");
          if (oldDelete) oldDelete.remove();

          // Add fresh delete button
          const newDeleteBtn = createDeleteButton(thumb, newIndex);
          thumb.appendChild(newDeleteBtn);

          const slide = slides[idx];
          slide.addAttributes({
            "data-slide": newIndex,
          });
          transitions[newIndex] = transitions[newIndex] || {
            type: "none",
            duration: 0,
            direction: "none",
          };
          clickStates[newIndex] = clickStates[newIndex] || false;
        });

        // Clean up stale keys
        const keys = Object.keys(transitions);
        keys.forEach((key) => {
          if (parseInt(key) > slides.length) delete transitions[key];
        });

        currentSlideIndex = Math.min(currentSlideIndex, slides.length);
        window.presentationState.currentSlideIndex = currentSlideIndex;
        switchSlide(currentSlideIndex);
      });

      return deleteBtn;
    }

    for (let i = 1; i <= numPages; i++) {
      let slide = editor.Components.addComponent({
        tagName: "div",
        attributes: {
          "data-slide": i,
          "data-transition-type": "none",
          "data-transition-duration": "0",
          "data-slide-timer": "0",
          "data-transition-direction": "none",
        },
        content: ``,
        style: {
          width,
          height,
          border: "1px solid #ccc",
          textAlign: "center",
          lineHeight: height,
          backgroundColor: "#f4f4f4",
          display: i === 1 ? "block" : "none",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        },
      });

      transitions[i] = { type: "none", duration: 0, direction: "none" };
      slides.push(slide);

      let thumbnail = document.createElement("div");
      thumbnail.innerText = `Page ${i}`;
      thumbnail.classList.add("thumbnail");
      thumbnail.setAttribute("data-slide-index", i);
      thumbnail.style.width = "80px";
      thumbnail.style.height = "60px";
      thumbnail.style.border = "1px solid #888";
      thumbnail.style.cursor = "pointer";
      thumbnail.style.display = "flex";
      thumbnail.style.alignItems = "center";
      thumbnail.style.justifyContent = "center";
      thumbnail.style.position = "relative";
      thumbnail.style.fontSize = "16px";
      thumbnail.style.fontWeight = "bold";
      thumbnail.style.color = "#333";
      thumbnail.style.borderRadius = "6px";
      thumbnail.style.marginRight = "10px";
      thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      thumbnail.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
      thumbnail.style.backgroundSize = "cover";
      thumbnail.style.backgroundPosition = "center";

      const blurEffect = document.createElement("style");
      blurEffect.innerHTML = `
      .thumbnail::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png') center center no-repeat;
        background-size: cover;
        filter: blur(1.5px);
        z-index: -1;
      }
    `;
      document.head.appendChild(blurEffect);

      const deleteBtn = createDeleteButton(thumbnail, i);
      thumbnail.appendChild(deleteBtn);

      clickStates[i] = false;

      thumbnail.addEventListener("mouseenter", () => {
        thumbnail.style.transform = "scale(1.1)";
        thumbnail.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
      });

      thumbnail.addEventListener("mouseleave", () => {
        thumbnail.style.transform = "scale(1)";
        thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      });

      thumbnail.addEventListener("click", () => {
        const index = parseInt(thumbnail.getAttribute("data-slide-index"));
        if (currentSlideIndex === index) {
          askTransitionSettings(index);
        } else {
          editor.Modal.close();
          switchSlide(index);
        }
        clickStates[index] = !clickStates[index];
      });

      if (i === 1) {
        thumbnail.classList.add("active-thumbnail"); // ✅ Start with first thumbnail highlighted
      }

      slidesContainer.appendChild(thumbnail);
    }

    // ➕ Add "+" button to add a new slide
    let addSlideBtn = document.createElement("div");
    addSlideBtn.innerText = "+";
    addSlideBtn.style.width = "60px";
    addSlideBtn.style.height = "60px";
    addSlideBtn.style.display = "flex";
    addSlideBtn.style.alignItems = "center";
    addSlideBtn.style.justifyContent = "center";
    addSlideBtn.style.fontSize = "32px";
    addSlideBtn.style.color = "#007bff";
    addSlideBtn.style.border = "2px dashed #007bff";
    addSlideBtn.style.borderRadius = "8px";
    addSlideBtn.style.cursor = "pointer";
    addSlideBtn.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
    addSlideBtn.title = "Add New Slide";

    addSlideBtn.addEventListener("mouseenter", () => {
      addSlideBtn.style.transform = "scale(1.1)";
    });
    addSlideBtn.addEventListener("mouseleave", () => {
      addSlideBtn.style.transform = "scale(1)";
    });

    addSlideBtn.addEventListener("click", () => {
      const newIndex = slides.length + 1;
      const slide = editor.Components.addComponent({
        tagName: "div",
        attributes: {
          "data-slide": newIndex,
          "data-transition-type": "none",
          "data-transition-duration": "0",
          "data-transition-direction": "none",
        },
        content: ``,
        style: {
          width,
          height,
          border: "1px solid #ccc",
          textAlign: "center",
          lineHeight: height,
          backgroundColor: "#f4f4f4",
          display: "none",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
        },
      });

      transitions[newIndex] = { type: "none", duration: 0, direction: "none" };
      slides.push(slide);

      let thumbnail = document.createElement("div");
      thumbnail.innerText = `Page ${newIndex}`;
      thumbnail.classList.add("thumbnail");
      thumbnail.setAttribute("data-slide-index", newIndex);
      thumbnail.style.width = "80px";
      thumbnail.style.height = "60px";
      thumbnail.style.border = "1px solid #888";
      thumbnail.style.cursor = "pointer";
      thumbnail.style.display = "flex";
      thumbnail.style.alignItems = "center";
      thumbnail.style.justifyContent = "center";
      thumbnail.style.position = "relative";
      thumbnail.style.fontSize = "16px";
      thumbnail.style.fontWeight = "bold";
      thumbnail.style.color = "#333";
      thumbnail.style.borderRadius = "6px";
      thumbnail.style.marginRight = "10px";
      thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      thumbnail.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
      thumbnail.style.backgroundSize = "cover";
      thumbnail.style.backgroundPosition = "center";

      const deleteBtn = createDeleteButton(thumbnail, newIndex);
      thumbnail.appendChild(deleteBtn);

      clickStates[newIndex] = false;

      thumbnail.addEventListener("mouseenter", () => {
        thumbnail.style.transform = "scale(1.1)";
        thumbnail.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
      });

      thumbnail.addEventListener("mouseleave", () => {
        thumbnail.style.transform = "scale(1)";
        thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      });

      thumbnail.addEventListener("click", () => {
        if (!clickStates[newIndex]) {
          switchSlide(newIndex);
        } else {
          askTransitionSettings(newIndex);
        }
        clickStates[newIndex] = !clickStates[newIndex];
      });

      slidesContainer.insertBefore(thumbnail, addSlideBtn);
    });

    slidesContainer.appendChild(addSlideBtn);
    document.body.appendChild(slidesContainer);

    // ✅ Modify iframe styling
    const iframe = document.querySelector("iframe.i_designer-frame");
    if (iframe) {
      iframe.style.height = "89.16%";
      iframe.style.margin = "0";
    }
    document.body.style.overflow = "hidden";

    // Only show the download button if a "videoIn" component is added
    const videoInComponent = editor
      .getWrapper()
      .find('[data-i_designer-type="videoIn"]');
    if (videoInComponent.length > 0) {
      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download";
      downloadBtn.className = "btn btn-success";
      downloadBtn.style.marginLeft = "65px";
      downloadBtn.style.padding = "12px 24px";
      downloadBtn.style.fontSize = "16px";
      downloadBtn.style.borderRadius = "8px";
      downloadBtn.style.backgroundColor = "#28a745";
      downloadBtn.style.color = "#fff";
      downloadBtn.style.border = "none";
      downloadBtn.style.cursor = "pointer";
      downloadBtn.style.transition =
        "background-color 0.3s ease, transform 0.3s ease"; // Smooth hover effect
      downloadBtn.onclick = () => {
        generateInteractiveSlideshowHTML();
      };

      // Add hover effect to the download button
      downloadBtn.addEventListener("mouseenter", () => {
        downloadBtn.style.backgroundColor = "#218838";
        downloadBtn.style.transform = "scale(1.05)";
      });

      downloadBtn.addEventListener("mouseleave", () => {
        downloadBtn.style.backgroundColor = "#28a745";
        downloadBtn.style.transform = "scale(1)";
      });

      slidesContainer.appendChild(downloadBtn); // 👉 Append right next to slides
    }
  }

  function switchSlide(index) {
    slides.forEach((slide, i) => {
      let el = slide.getEl();
      if (el) el.style.display = i + 1 === index ? "block" : "none";
    });

    currentSlideIndex = index;
    window.presentationState.currentSlideIndex = currentSlideIndex;

    // Automatically select the active slide so new components go into it
    const selectedSlide = slides[index - 1];
    if (selectedSlide) {
      editor.select(selectedSlide);
    }

    // ✅ Highlight the current thumbnail
    const allThumbnails = document.querySelectorAll(".thumbnail");
    allThumbnails.forEach((thumb) => {
      const idx = parseInt(thumb.getAttribute("data-slide-index"));
      thumb.classList.toggle("active-thumbnail", idx === index);
    });
  }

  // Global variable to store current video duration
  let currentVideoDuration = 0;

  // Function to extract YouTube video ID from URL
  function extractYouTubeVideoId(url) {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  // // Function to get YouTube video duration using YouTube API
  // async function getYouTubeVideoDuration(videoId) {
  //   try {
  //     // You'll need to replace 'YOUR_YOUTUBE_API_KEY' with your actual YouTube API key
  //     const apiKey = 'AIzaSyDCKDh8OWxeJGsO7dp6A8yRrj_VTYqp8ig';
  //     const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=contentDetails`);
  //     const data = await response.json();

  //     if (data.items && data.items.length > 0) {
  //       const duration = data.items[0].contentDetails.duration;
  //       return convertISO8601ToSeconds(duration);
  //     }
  //     return 0;
  //   } catch (error) {
  //     console.error('Error fetching YouTube video duration:', error);
  //     return 0;
  //   }
  // }

  // // Function to convert ISO 8601 duration format to seconds
  // function convertISO8601ToSeconds(duration) {
  //   const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  //   const hours = (parseInt(match[1]) || 0);
  //   const minutes = (parseInt(match[2]) || 0);
  //   const seconds = (parseInt(match[3]) || 0);
  //   return hours * 3600 + minutes * 60 + seconds;
  // }

  // Function to load YouTube Iframe Player API (only once)
  function loadYouTubeIframeAPI() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => resolve();
    });
  }

  // Function to get video duration using Iframe Player API
  async function getYouTubeDurationUsingIframe(videoId) {
    return new Promise(async (resolve) => {
      await loadYouTubeIframeAPI();

      const tempDivId = `yt-temp-player-${Date.now()}`;
      const tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);

      let timeoutId;

      const player = new YT.Player(tempDivId, {
        videoId,
        events: {
          onReady: function () {
            clearTimeout(timeoutId);
            const duration = player.getDuration();
            resolve(duration || 0);
            player.destroy();
            tempDiv.remove();
          },
          onError: function () {
            clearTimeout(timeoutId);
            console.warn("YT Iframe Player error");
            resolve(0);
            player.destroy();
            tempDiv.remove();
          },
        },
      });

      timeoutId = setTimeout(() => {
        console.warn("YT Iframe Player timeout");
        resolve(0);
        player.destroy();
        tempDiv.remove();
      }, 5000);
    });
  }

  // Rewritten function using Iframe API instead of Data API
  async function checkAndSetVideoDuration(slideIndex) {
    currentVideoDuration = 0;
    console.log("function checksetvideo");

    const canvasFrame = editor.Canvas.getFrameEl();
    const slideEl = canvasFrame.contentDocument.querySelector(
      `[data-slide="${slideIndex}"]`
    );
    console.log("DOM element of slide", slideIndex, ":", slideEl);
    console.log("Outer HTML:", slideEl?.outerHTML);

    if (!slideEl) return;

    const youtubeIframe = slideEl.querySelector(
      'iframe[src*="youtube.com/embed"], iframe[src*="youtu.be"]'
    );
    console.log("YT 1st step", youtubeIframe);

    if (youtubeIframe) {
      let src = youtubeIframe.src;

      // ✅ Ensure enablejsapi=1 is present
      if (!src.includes("enablejsapi=1")) {
        const hasQuery = src.includes("?");
        src += hasQuery ? "&enablejsapi=1" : "?enablejsapi=1";
        youtubeIframe.src = src;
      }

      const videoId = extractYouTubeVideoId(src);
      console.log("YT 2nd step", videoId);

      if (videoId) {
        console.log("YT 2nd step555", videoId);
        currentVideoDuration = await getYouTubeDurationUsingIframe(videoId); // ← using videoId, not iframe
        console.log("YT 3rd step (duration)", currentVideoDuration);

        if (currentVideoDuration > 0) {
          if (!transitions[slideIndex]) {
            transitions[slideIndex] = {
              type: "none",
              duration: 0,
              direction: "none",
              slideTimer: 0,
              isHidden: false,
              wordToHide: "",
            };
          }

          transitions[slideIndex].slideTimer = currentVideoDuration;

          let slide = slides[slideIndex - 1];
          if (slide) {
            slide.addAttributes({
              "data-slide-timer": currentVideoDuration,
            });
          }
        }
      }
    }
  }

  async function askTransitionSettings(slideIndex) {
    // Check for YouTube video and set duration before opening modal
    await checkAndSetVideoDuration(slideIndex);

    const transition = transitions[slideIndex] || {
      type: "none",
      duration: 0,
      direction: "none",
      slideTimer: 0,
      isHidden: false,
      wordToHide: "",
    };

    // Initialize the modal content
    editor.Modal.setTitle(`Transition for Slide ${slideIndex}`);
    editor.Modal.setContent(`
  <div>
    <label for="transitionType">Transition Type:</label>
    <select id="transitionType" class="form-control">
      <option value="none" ${
        transition.type === "none" ? "selected" : ""
      }>None</option>
      <option value="fade" ${
        transition.type === "fade" ? "selected" : ""
      }>Fade</option>
      <option value="slide" ${
        transition.type === "slide" ? "selected" : ""
      }>Slide</option>
      <option value="zoom" ${
        transition.type === "zoom" ? "selected" : ""
      }>Zoom</option>
    </select>

    <label for="transitionDuration" style="margin-top: 10px;">Transition Duration (seconds):</label>
    <input type="number" id="transitionDuration" class="form-control" min="0" step="0.1" value="${
      transition.duration || 0
    }" /><br>

    <label for="slideTimer" style="margin-top: 10px;">Slide Timer (seconds):</label>
    <input type="number" id="slideTimer" class="form-control" min="0" step="0.1" value="${
      transition.slideTimer || 0
    }" />
    ${
      currentVideoDuration > 0
        ? `<small style="color: #666; display: block; margin-top: 5px;">YouTube video duration: ${currentVideoDuration} seconds (minimum required)</small>`
        : ""
    }

    <div id="directionField" style="display:${
      transition.type === "slide" ? "block" : "none"
    }; margin-top: 10px;">
      <label for="transitionDirection">Direction:</label>
      <select id="transitionDirection" class="form-control">
        <option value="left" ${
          transition.direction === "left" ? "selected" : ""
        }>Left</option>
        <option value="right" ${
          transition.direction === "right" ? "selected" : ""
        }>Right</option>
        <option value="up" ${
          transition.direction === "up" ? "selected" : ""
        }>Up</option>
        <option value="down" ${
          transition.direction === "down" ? "selected" : ""
        }>Down</option>
      </select>
    </div>

    <label for="hideSlide" style="margin-top: 10px;">
      <input type="checkbox" id="hideSlide" ${
        transition.isHidden ? "checked" : ""
      } />
      Hide Slide in Downloaded Slideshow
    </label>

    <div id="wordToHideDiv" style="display:${
      transition.isHidden ? "block" : "none"
    }; margin-top: 10px;">
      <label for="wordToHide">Enter word to hide this slide:</label>
      <input type="text" id="wordToHide" class="form-control" value="${
        transition.wordToHide || ""
      }" />
    </div>

    <div id="validationMessage" style="color: red; margin-top: 10px; display: none;"></div>
    <button id="saveTransition" class="btn btn-primary" style="margin-top: 15px;">Save</button>
  </div>
`);

    // Show or hide the word input based on the checkbox state
    document.getElementById("hideSlide").addEventListener("change", (e) => {
      document.getElementById("wordToHideDiv").style.display = e.target.checked
        ? "block"
        : "none";
    });

    // Update direction field visibility when transition type changes
    document
      .getElementById("transitionType")
      .addEventListener("change", (e) => {
        document.getElementById("directionField").style.display =
          e.target.value === "slide" ? "block" : "none";
      });

    // Add validation for slide timer input
    document
      .getElementById("slideTimer")
      .addEventListener("input", validateSlideTimer);

    // Save the transition settings when the save button is clicked
    document
      .getElementById("saveTransition")
      .addEventListener("click", () => saveTransition(slideIndex));

    editor.Modal.open();
  }

  // Function to validate slide timer against video duration
  function validateSlideTimer() {
    const slideTimerInput = document.getElementById("slideTimer");
    const saveButton = document.getElementById("saveTransition");
    const validationMessage = document.getElementById("validationMessage");

    const slideTimerValue = parseFloat(slideTimerInput.value);

    if (currentVideoDuration > 0 && slideTimerValue < currentVideoDuration) {
      validationMessage.textContent = `Slide timer must be at least ${currentVideoDuration} seconds (YouTube video duration)`;
      validationMessage.style.display = "block";
      saveButton.disabled = true;
      saveButton.style.opacity = "0.5";
      return false;
    } else {
      validationMessage.style.display = "none";
      saveButton.disabled = false;
      saveButton.style.opacity = "1";
      return true;
    }
  }

  function saveTransition(slideIndex) {
    // Validate before saving
    if (!validateSlideTimer()) {
      return; // Don't save if validation fails
    }

    const type = document.getElementById("transitionType").value;
    let duration = parseFloat(
      document.getElementById("transitionDuration").value
    );
    let slideTimer = parseFloat(document.getElementById("slideTimer").value);
    const direction =
      type === "slide"
        ? document.getElementById("transitionDirection").value
        : "none";
    const isHidden = document.getElementById("hideSlide").checked;
    const wordToHide = document.getElementById("wordToHide").value.trim(); // Trim any extra spaces

    // If transitionDuration or slideTimer are invalid, set them to 0
    if (isNaN(duration)) duration = 0;
    if (isNaN(slideTimer)) slideTimer = 0;

    // Store transition data
    transitions[slideIndex] = {
      type,
      duration,
      direction,
      slideTimer,
      isHidden,
      wordToHide: wordToHide || "",
    };

    let slide = slides[slideIndex - 1];
    if (slide) {
      slide.addAttributes({
        "data-transition-type": type,
        "data-transition-duration": duration,
        "data-transition-direction": direction,
        "data-slide-timer": slideTimer,
        "data-hide": isHidden ? "true" : "false", // Store the hide flag
        "data-word-to-hide": wordToHide || "", // Store the word to hide the slide (empty string if no word)
      });
    }

    editor.Modal.close();
    switchSlide(currentSlideIndex); // Ensure the current slide is still displayed after saving
  }

  function showDownloadButton() {
    const footer = document.createElement("div");
    footer.style.textAlign = "center";
    footer.style.marginTop = "20px";

    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download";
    downloadBtn.className = "btn btn-success";
    downloadBtn.style.margin = "10px";
    downloadBtn.onclick = () => {
      generateInteractiveSlideshowHTML();
    };

    footer.appendChild(downloadBtn);
    document.body.appendChild(footer);
  }

async function generateInteractiveSlideshowHTML() { 
  const iframe = document.querySelector('#editor iframe'); 
  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document; 
  const slideElements = iframeDoc?.querySelectorAll('[data-slide]'); 
  
  if (!slideElements?.length) { 
    alert('No slides found!'); 
    return; 
  } 
  
  const slideData = []; 
  const editorHtml = editor.getHtml(); 
  const editorCss = editor.getCss(); 
  
  const styles = (editor.canvas && editor.canvas.styles) || []; 
  const scripts = (editor.canvas && editor.canvas.scripts) || []; 
  
  for (let i = 0; i < slideElements.length; i++) { 
    const el = slideElements[i]; 
    const slideIndex = i + 1; 
    
    slideElements.forEach((s, idx) => s.style.display = idx === i ? 'block' : 'none'); 
    await new Promise(r => setTimeout(r, 800)); 
    
    const computed = getComputedStyle(el); 
    const width = parseFloat(computed.width); 
    const height = parseFloat(computed.height); 
    const img = encodeURIComponent(el.innerHTML); 
    const transition = parseFloat(el.getAttribute("data-transition-duration")) || 1; 
    const display = parseFloat(el.getAttribute("data-slide-timer")) || 5; 
    const type = el.getAttribute("data-transition-type") || "fade"; 
    const dir = el.getAttribute("data-transition-direction") || "left"; 
    const backgroundColor = computed.backgroundColor || "#fff"; 
    const isHidden = el.getAttribute("data-hide") === "true"; 
    const wordToHide = el.getAttribute("data-word-to-hide") || ""; 
    
    // Check for YouTube video in this slide
    const youtubeIframes = el.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    let youtubeVideoId = null;
    let youtubeStartTime = 0;
    
    if (youtubeIframes.length > 0) {
      const ytSrc = youtubeIframes[0].src;
      const videoIdMatch = ytSrc.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (videoIdMatch) {
        youtubeVideoId = videoIdMatch[1];
        // Extract start time if present (t parameter)
        const startTimeMatch = ytSrc.match(/[?&]t=(\d+)/);
        if (startTimeMatch) {
          youtubeStartTime = parseInt(startTimeMatch[1]);
        }
      }
    }
    
    if (isHidden && !wordToHide) { 
      continue; 
    } 
    
    if (isHidden && wordToHide) { 
      const jsonDataString = localStorage.getItem("common_json"); 
      const jsonData = JSON.parse(jsonDataString || "{}"); 
      const custom_language = localStorage.getItem("language") || "english"; 
      const divs = el.querySelectorAll("div[id]"); 
      let matchFound = false; 
      
      divs.forEach((div) => { 
        const divId = div.id; 
        const styleContent = editor.getCss(); 
        const regex = new RegExp(`#${divId}\\s*{[^}]*my-input-json:\\s*([^;]+);`, "i"); 
        const match = regex.exec(styleContent); 
        
        if (match) { 
          const jsonKey = match[1].trim(); 
          const value = jsonData?.[custom_language]?.[jsonKey]; 
          if (typeof value === "string" && value.includes(wordToHide)) { 
            matchFound = true; 
          } 
        } 
      }); 
      
      if (matchFound) { 
        continue; 
      } 
    } 
    
    slideData.push({ 
      img, 
      width, 
      height, 
      transition, 
      display, 
      type, 
      dir, 
      backgroundColor,
      youtubeVideoId,
      youtubeStartTime
    }); 
  } 
  
  const totalDuration = slideData.reduce((acc, s) => acc + s.transition + s.display, 0); 

  // Check if the HTML content from the editor contains a table 
  const containsTable = editorHtml.includes('<table'); 
  const tableInitializationScript = containsTable ? 
    `<script> 
      $(document).ready(function() { 
        $('table').DataTable({ 
          dom: 'Bfrtip', 
          buttons: ['copy', 'csv', 'excel', 'pdf', 'print'] 
        }); 
      }); 
    </script>` : ''; 
  
  const headContent = [ 
    `<style>${editorCss}</style>`, 
    ...styles.map(url => `<link rel="stylesheet" href="${url}">`), 
    ...scripts.map(url => `<script src="${url}"></script>`), 
    tableInitializationScript // Add script only if a table exists 
  ].join(''); 
  
  const fullHTML = `<!DOCTYPE html> 
<html lang="en"> 
<head> 
  <meta charset="UTF-8" /> 
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/> 
  <title>Interactive Slideshow</title> 
  ${headContent} 
  <!-- External Styles --> 
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"> 
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"> 
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/v/bs4/dt-1.13.2/datatables.min.css"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css"> 
  <!-- External Scripts --> 
  <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script> 
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script> 
  <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script> 
  <script src="https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js"></script> 
  <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js"></script> 
  <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js"></script> 
  <script src="https://code.highcharts.com/highcharts.js"></script> 
  <script src="https://code.highcharts.com/modules/drilldown.js"></script> 
  <!-- YouTube API -->
  <script src="https://www.youtube.com/iframe_api"></script>
  <style> 
  html, body { 
    margin: 0; 
    padding: 0; 
    background: #FFFFFF; 
    width: 100%; 
    height: 100%; 
    overflow: hidden; 
    font-family: Arial, sans-serif; 
  } 
  
  .slide { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    display: none; 
    opacity: 0; 
    transform: translate(-50%, -50%); 
    transition: opacity 0.5s ease, transform 0.5s ease; 
  } 
  
  .controls { 
    position: absolute; 
    bottom: 15px; 
    left: 50%; 
    transform: translateX(-50%); 
    display: flex; 
    gap: 15px; 
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
  } 
  
  .controls.visible {
    opacity: 1;
  }
  
  .controls button { 
    width: 55px;
    height: 55px;
    font-size: 20px; 
    background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
    color: white; 
    border: none; 
    border-radius: 50%; 
    cursor: pointer; 
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2),
                inset 0 2px 2px rgba(255,255,255,0.1);
  } 
  
  .controls button:hover {
    background: linear-gradient(145deg, #333333, #222222);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.25),
                inset 0 2px 2px rgba(255,255,255,0.1);
  }
  
  .controls button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  .controls button i {
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  
  #progressContainer { 
    position: absolute; 
    bottom: 0; 
    left: 0; 
    width: 100%; 
    height: 10px; 
    background: rgba(0,0,0,0.3); 
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease, height 0.2s ease;
    z-index: 5;
  } 
  
  #progressContainer.visible {
    opacity: 1;
  }
  
  #progressContainer:hover {
    height: 16px;
  }
  
  #progressBar { 
    height: 100%; 
    width: 0%; 
    background: linear-gradient(90deg, #ff3636, #ff5252);
    box-shadow: 0 0 8px rgba(255,50,50,0.5);
    transition: width 0.2s linear; 
    position: relative; 
    z-index: 1; 
  } 
  
  #progressBar::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background: #ff3636;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255,50,50,0.8);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  #progressContainer:hover #progressBar::after {
    opacity: 1;
  }
  
  .marker { 
    position: absolute; 
    top: 0; 
    bottom: 0; 
    width: 3px; 
    background-color: rgba(0, 0, 0, 0.6); 
    z-index: 2;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  } 
  
  #timeLabel { 
    position: absolute; 
    bottom: 20px; 
    right: 20px; 
    font-size: 14px; 
    color: #fff; 
    background: rgba(0,0,0,0.7);
    padding: 6px 10px;
    border-radius: 20px;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  } 
  
  #timeLabel.visible {
    opacity: 1;
  }

  /* Thumbnail Navigation Styles */
  #thumbnailContainer {
    position: absolute;
    bottom: 25px;
    left: 0;
    width: 100%;
    height: 90px;
    display: flex;
    overflow-x: auto;
    padding: 10px 20px;
    opacity: 0;
    transition: opacity 0.3s ease;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
    z-index: 4;
  }
  
  #thumbnailContainer::-webkit-scrollbar {
    height: 6px;
  }
  
  #thumbnailContainer::-webkit-scrollbar-track {
    background: transparent;
  }
  
  #thumbnailContainer::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.3);
    border-radius: 6px;
  }
  
  #thumbnailContainer.visible {
    opacity: 1;
  }
  
  .thumbnail {
    min-width: 120px;
    height: 70px;
    margin: 0 6px;
    background-color: #000;
    background-image: url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png');
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }
  
  .thumbnail:hover {
    transform: scale(1.08);
    border-color: rgba(255,255,255,0.7);
  }
  
.thumbnail.active {
  border: 3px solid #ff3636;
  box-shadow: 0 0 15px rgba(255, 50, 50, 0.5);
}

  .thumbnail-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    color: white;
    font-size: 16px;
    padding: 5px 0;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }
  </style> 
</head> 
<body> 
  ${slideData.map((s, i) => {
    let slideContent = decodeURIComponent(s.img);
    // Replace YouTube iframes with divs that will be converted to YouTube players
    if (s.youtubeVideoId) {
      slideContent = slideContent.replace(
        /<iframe[^>]*src[^>]*(?:youtube\.com\/embed\/|youtu\.be\/)[^>]*><\/iframe>/gi,
        `<div id="youtube-player-${i}" class="youtube-player-container"></div>`
      );
    }
    return `<div class="slide" id="slide-${i}" style="width:${s.width}px;height:${s.height}px;background-color:${s.backgroundColor};">${slideContent}</div>`;
  }).join('')} 
  
  <!-- Thumbnail Navigation -->
  <div id="thumbnailContainer">
    ${slideData.map((s, i) => `<div class="thumbnail" id="thumb-${i}" onclick="jumpToSlide(${i})">
      <div class="thumbnail-label">Slide ${i+1}</div>
    </div>`).join('')}
  </div>
  
  <div class="controls"> 
    <button onclick="togglePlay()" id="playBtn"><i class="fas fa-pause"></i></button> 
  </div> 
  <div id="progressContainer" onclick="seek(event)"> 
    <div id="progressBar"></div> 
  </div> 
  <div id="timeLabel">00:00 / 00:00</div> 
  
  <script> 
  const slides = [...document.querySelectorAll('.slide')]; 
  const thumbnails = [...document.querySelectorAll('.thumbnail')];
  const slideData = ${JSON.stringify(slideData)}; 
  const totalTime = ${totalDuration}; 
  const progressBar = document.getElementById("progressBar"); 
  const timeLabel = document.getElementById("timeLabel"); 
  
  // YouTube API variables
  let youtubePlayersReady = false;
  const youtubePlayers = {};
  let currentYouTubePlayer = null;
  let youtubeApiReady = false;
  
  // Add slide boundary markers 
  const progressContainer = document.getElementById("progressContainer"); 
  let accumulated = 0; 
  for (let i = 0; i < slideData.length - 1; i++) { 
    accumulated += slideData[i].transition + slideData[i].display; 
    const pct = (accumulated / totalTime) * 100; 
    const marker = document.createElement('div'); 
    marker.className = 'marker'; 
    marker.style.left = pct + '%'; 
    progressContainer.appendChild(marker); 
  } 
  
  let current = 0; 
  let phase = 'transition'; 
  let remaining = slideData[0].transition; 
  let elapsed = 0; 
  let playing = true; 
  let last = null; 
  let rafId; 
  let slideshowStartTime = 0; // Track when slideshow started for YouTube sync
  
  // YouTube API Ready Callback
  function onYouTubeIframeAPIReady() {
    youtubeApiReady = true;
    initializeYouTubePlayers();
  }
  
  function initializeYouTubePlayers() {
    slideData.forEach((slide, index) => {
      if (slide.youtubeVideoId) {
        const playerDiv = document.getElementById(\`youtube-player-\${index}\`);
        if (playerDiv) {
          // Set size for YouTube player container
          playerDiv.style.width = '100%';
          playerDiv.style.height = '400px';
          
          youtubePlayers[index] = new YT.Player(\`youtube-player-\${index}\`, {
            height: '400',
            width: '100%',
            videoId: slide.youtubeVideoId,
            playerVars: {
              'autoplay': 0,
              'controls': 0, // Hide YouTube controls since we're using our own
              'disablekb': 1,
              'fs': 0,
              'iv_load_policy': 3,
              'modestbranding': 1,
              'playsinline': 1,
              'rel': 0,
              'start': slide.youtubeStartTime || 0
            },
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
        }
      }
    });
    youtubePlayersReady = true;
  }
  
  function onPlayerReady(event) {
    // Player is ready, but don't auto-play
    event.target.pauseVideo();
  }
  
  function onPlayerStateChange(event) {
    // Sync slideshow state with YouTube player state
    if (currentYouTubePlayer && event.target === currentYouTubePlayer) {
      if (event.data === YT.PlayerState.PLAYING && !playing) {
        // If YouTube starts playing but slideshow is paused, pause YouTube
        currentYouTubePlayer.pauseVideo();
      } else if (event.data === YT.PlayerState.PAUSED && playing) {
        // If YouTube pauses but slideshow is playing, play YouTube
        currentYouTubePlayer.playVideo();
      }
    }
  }
  
  function syncYouTubePlayer() {
    if (currentYouTubePlayer && youtubePlayersReady) {
      const slideStartTime = getSlideTiming(current).startTime;
      const currentSlideElapsed = elapsed - slideStartTime;
      const youtubeTime = slideData[current].youtubeStartTime + currentSlideElapsed;
      
      try {
        currentYouTubePlayer.seekTo(youtubeTime, true);
        if (playing) {
          currentYouTubePlayer.playVideo();
        } else {
          currentYouTubePlayer.pauseVideo();
        }
      } catch (e) {
        console.log('YouTube player not ready yet');
      }
    }
  }
  
  function getSlideTiming(slideIndex) {
    let startTime = 0;
    for (let i = 0; i < slideIndex; i++) {
      startTime += slideData[i].transition + slideData[i].display;
    }
    return {
      startTime: startTime,
      endTime: startTime + slideData[slideIndex].transition + slideData[slideIndex].display
    };
  }
  
  function format(t) { 
    const m = Math.floor(t / 60).toString().padStart(2, '0'); 
    const s = Math.floor(t % 60).toString().padStart(2, '0'); 
    return m + ':' + s; 
  } 
  
  function updateProgressUI() { 
    const percent = (elapsed / totalTime) * 100; 
    progressBar.style.width = percent + '%'; 
    timeLabel.textContent = format(elapsed) + ' / ' + format(totalTime); 
    
    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === current);
    });
  } 
  
  function showSlide(index) { 
    // Pause current YouTube player if any
    if (currentYouTubePlayer) {
      currentYouTubePlayer.pauseVideo();
    }
    
    // Set new current YouTube player
    currentYouTubePlayer = youtubePlayers[index] || null;
    
    slides.forEach((s, i) => { 
      s.style.display = i === index ? 'block' : 'none'; 
      s.style.opacity = 0; 
      if (i === index) { 
        const { type, dir } = slideData[i]; 
        if (type === 'zoom') { 
          s.style.transform = 'translate(-50%, -50%) scale(0.8)'; 
        } else if (type === 'slide') { 
          let tx = 0, ty = 0, dist = 100; 
          if (dir === 'left') tx = -dist; 
          if (dir === 'right') tx = dist; 
          if (dir === 'up') ty = -dist; 
          if (dir === 'down') ty = dist; 
          s.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%))\`; 
        } else { 
          s.style.transform = 'translate(-50%, -50%)'; 
        } 
      } 
    }); 
    
    // Sync YouTube player when slide becomes visible
    if (phase === 'display') {
      setTimeout(() => syncYouTubePlayer(), 100);
    }
  } 
  
  function renderTransition(progress) { 
    const slide = slides[current]; 
    const { type, dir } = slideData[current]; 
    if (type === 'fade') { 
      slide.style.opacity = progress; 
      slide.style.transform = 'translate(-50%, -50%)'; 
    } else if (type === 'zoom') { 
      slide.style.opacity = 1; 
      slide.style.transform = \`translate(-50%, -50%) scale(\${0.8 + 0.2 * progress})\`; 
    } else if (type === 'slide') { 
      slide.style.opacity = 1; 
      let tx = 0, ty = 0; 
      const dist = 100; 
      if (dir === 'left') tx = -dist * (1 - progress); 
      if (dir === 'right') tx = dist * (1 - progress); 
      if (dir === 'up') ty = -dist * (1 - progress); 
      if (dir === 'down') ty = dist * (1 - progress); 
      slide.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%))\`; 
    } 
  } 
  
  function run(timestamp) { 
    if (!last) last = timestamp; 
    const delta = (timestamp - last) / 1000; 
    last = timestamp; 
    remaining -= delta; 
    elapsed += delta; 
    updateProgressUI(); 
    
    if (phase === 'transition') { 
      const full = slideData[current].transition; 
      const progress = 1 - (remaining / full); 
      renderTransition(progress); 
    } else if (phase === 'display' && currentYouTubePlayer) {
      // Continuously sync YouTube player during display phase
      syncYouTubePlayer();
    }
    
    if (remaining <= 0) { 
      if (phase === 'transition') { 
        phase = 'display'; 
        remaining = slideData[current].display; 
        slides[current].style.opacity = 1; 
        // Start YouTube video when transition completes
        syncYouTubePlayer();
      } else { 
        if (current === slideData.length - 1) { 
          playing = false; 
          document.getElementById("playBtn").innerHTML = '<i class="fas fa-play"></i>'; 
          if (currentYouTubePlayer) {
            currentYouTubePlayer.pauseVideo();
          }
          return; 
        } 
        slides[current].style.opacity = 0; 
        current++; 
        phase = 'transition'; 
        remaining = slideData[current].transition; 
        showSlide(current); 
      } 
    } 
    
    if (playing) rafId = requestAnimationFrame(run); 
  } 
  
  function togglePlay() { 
    playing = !playing; 
    const playBtn = document.getElementById("playBtn");
    playBtn.innerHTML = playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    
    // Control YouTube player
    if (currentYouTubePlayer) {
      if (playing) {
        currentYouTubePlayer.playVideo();
      } else {
        currentYouTubePlayer.pauseVideo();
      }
    }
    
    if (playing) { 
      last = null; 
      rafId = requestAnimationFrame(run); 
    } else { 
      cancelAnimationFrame(rafId); 
    } 
  } 
  
  function seek(e) { 
    const pct = e.offsetX / e.currentTarget.offsetWidth; 
    const targetTime = pct * totalTime; 
    jumpToTime(targetTime);
  } 
  
  function jumpToSlide(slideIndex) {
    // Calculate time to the beginning of the selected slide
    let targetTime = 0;
    for (let i = 0; i < slideIndex; i++) {
      targetTime += slideData[i].transition + slideData[i].display;
    }
    jumpToTime(targetTime);
  }
  
  function jumpToTime(targetTime) {
    elapsed = 0;
    let time = 0;
    
    for (let i = 0; i < slideData.length; i++) {
      const { transition, display } = slideData[i];
      
      if (time + transition >= targetTime) {
        current = i;
        phase = 'transition';
        remaining = transition - (targetTime - time);
        elapsed = targetTime;
        showSlide(current);
        renderTransition(1 - (remaining / transition));
        updateProgressUI();
        return restart();
      }
      
      time += transition;
      
      if (time + display >= targetTime) {
        current = i;
        phase = 'display';
        remaining = display - (targetTime - time);
        elapsed = targetTime;
        showSlide(current);
        slides[current].style.opacity = 1;
        updateProgressUI();
        // Sync YouTube player after seeking
        setTimeout(() => syncYouTubePlayer(), 100);
        return restart();
      }
      
      time += display;
    }
  }
  
  function restart() { 
    cancelAnimationFrame(rafId); 
    last = null; 
    if (playing) rafId = requestAnimationFrame(run); 
  } 
  
  // Initialize when page loads
  window.onload = () => { 
    showSlide(current); 
    updateProgressUI(); 
    
    // Initialize YouTube API if not already ready
    if (!youtubeApiReady && typeof YT === 'undefined') {
      // YouTube API will call onYouTubeIframeAPIReady when ready
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    } else if (youtubeApiReady || typeof YT !== 'undefined') {
      // API is already loaded
      onYouTubeIframeAPIReady();
    }
    
    if (playing) rafId = requestAnimationFrame(run); 
    
    // Set up idle timer for UI elements
    setupIdleTimer();
    
    // Set specific background image for each thumbnail
    thumbnails.forEach((thumb) => {
      thumb.style.backgroundImage = "url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png')";
    });
  }; 
  
  // Handle idle time for UI visibility
  let idleTimer = null;
  function setupIdleTimer() {
    // Show controls initially
    document.getElementById('thumbnailContainer').classList.add('visible');
    document.getElementById('progressContainer').classList.add('visible');
    document.getElementById('timeLabel').classList.add('visible');
    document.querySelector('.controls').classList.add('visible');
    
    // Hide after 3 seconds of inactivity
    idleTimer = setTimeout(hideUIElements, 3000);
    
    // Reset timer on mouse movement
    document.addEventListener('mousemove', resetIdleTimer);
    
    // Also reset on touch for mobile devices
    document.addEventListener('touchstart', resetIdleTimer);
  }
  
  function resetIdleTimer() {
    // Show UI elements
    document.getElementById('thumbnailContainer').classList.add('visible');
    document.getElementById('progressContainer').classList.add('visible');
    document.getElementById('timeLabel').classList.add('visible');
    document.querySelector('.controls').classList.add('visible');
    
    // Clear and reset timer
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hideUIElements, 3000);
  }
  
  function hideUIElements() {
    document.getElementById('thumbnailContainer').classList.remove('visible');
    document.getElementById('progressContainer').classList.remove('visible');
    document.getElementById('timeLabel').classList.remove('visible');
    document.querySelector('.controls').classList.remove('visible');
  }
  
  // Global YouTube API ready callback
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
  </script> 
</body> 
</html>`; 

  const blob = new Blob([fullHTML], { type: 'text/html' }); 
  const url = URL.createObjectURL(blob); 
  const a = document.createElement("a"); 
  a.href = url; 
  a.download = "interactive_slideshow.html"; 
  document.body.appendChild(a); 
  a.click(); 
  document.body.removeChild(a); 
}}

// ----------------------------------------------------------------------------------------------------

async function generateInteractiveSlideshowHTML() { 
  const iframe = document.querySelector('#editor iframe'); 
  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document; 
  const slideElements = iframeDoc?.querySelectorAll('[data-slide]'); 
  
  if (!slideElements?.length) { 
    alert('No slides found!'); 
    return; 
  } 
  
  const slideData = []; 
  const editorHtml = editor.getHtml(); 
  const editorCss = editor.getCss(); 
  
  const styles = (editor.canvas && editor.canvas.styles) || []; 
  const scripts = (editor.canvas && editor.canvas.scripts) || []; 
  
  for (let i = 0; i < slideElements.length; i++) { 
    const el = slideElements[i]; 
    const slideIndex = i + 1; 
    
    slideElements.forEach((s, idx) => s.style.display = idx === i ? 'block' : 'none'); 
    await new Promise(r => setTimeout(r, 800)); 
    
    const computed = getComputedStyle(el); 
    const width = parseFloat(computed.width); 
    const height = parseFloat(computed.height); 
    const img = encodeURIComponent(el.innerHTML); 
    const transition = parseFloat(el.getAttribute("data-transition-duration")) || 1; 
    const display = parseFloat(el.getAttribute("data-slide-timer")) || 5; 
    const type = el.getAttribute("data-transition-type") || "fade"; 
    const dir = el.getAttribute("data-transition-direction") || "left"; 
    const backgroundColor = computed.backgroundColor || "#fff"; 
    const isHidden = el.getAttribute("data-hide") === "true"; 
    const wordToHide = el.getAttribute("data-word-to-hide") || ""; 
    const slideInput = el.getAttribute("data-slide-input") === "true"; 
    
    // Check for video in slide
    const videoElement = el.querySelector('video');
    const hasVideo = videoElement !== null;
    let videoSrc = null;
    
    if (hasVideo) {
      videoSrc = videoElement.getAttribute('src') || 
                 (videoElement.querySelector('source') ? videoElement.querySelector('source').getAttribute('src') : null);
    }
    
    if (isHidden && !wordToHide) { 
      continue; 
    } 
    
    if (isHidden && wordToHide) { 
      const jsonDataString = localStorage.getItem("common_json"); 
      const jsonData = JSON.parse(jsonDataString || "{}"); 
      const custom_language = localStorage.getItem("language") || "english"; 
      const divs = el.querySelectorAll("div[id]"); 
      let matchFound = false; 
      
      divs.forEach((div) => { 
        const divId = div.id; 
        const styleContent = editor.getCss(); 
        const regex = new RegExp(`#${divId}\\s*{[^}]*my-input-json:\\s*([^;]+);`, "i"); 
        const match = regex.exec(styleContent); 
        
        if (match) { 
          const jsonKey = match[1].trim(); 
          const value = jsonData?.[custom_language]?.[jsonKey]; 
          if (typeof value === "string" && value.includes(wordToHide)) { 
            matchFound = true; 
          } 
        } 
      }); 
      
      if (matchFound) { 
        continue; 
      } 
    } 
    
    slideData.push({ 
      img, 
      width, 
      height, 
      transition, 
      display, 
      type, 
      dir, 
      backgroundColor,
      hasVideo,
      videoSrc,
      slideInput
    }); 
  } 
  
  const totalDuration = slideData.reduce((acc, s) => acc + s.transition + s.display, 0); 

  // Check if the HTML content from the editor contains a table 
  const containsTable = editorHtml.includes('<table'); 
  const tableInitializationScript = containsTable ? 
    `<script> 
      $(document).ready(function() { 
        $('table').DataTable({ 
          dom: 'Bfrtip', 
          buttons: ['copy', 'csv', 'excel', 'pdf', 'print'] 
        }); 
      }); 
    </script>` : ''; 
  
  const headContent = [ 
    `<style>${editorCss}</style>`, 
    ...styles.map(url => `<link rel="stylesheet" href="${url}">`), 
    ...scripts.map(url => `<script src="${url}"></script>`), 
    tableInitializationScript // Add script only if a table exists 
  ].join(''); 
  
  const fullHTML = `<!DOCTYPE html> 
<html lang="en"> 
<head> 
  <meta charset="UTF-8" /> 
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/> 
  <title>Interactive Slideshow</title> 
  ${headContent} 
  <!-- External Styles --> 
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"> 
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"> 
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/v/bs4/dt-1.13.2/datatables.min.css"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css"> 
  <!-- External Scripts --> 
  <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script> 
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script> 
  <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script> 
  <script src="https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js"></script> 
  <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js"></script> 
  <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js"></script> 
  <script src="https://code.highcharts.com/highcharts.js"></script> 
  <script src="https://code.highcharts.com/modules/drilldown.js"></script> 
  <style> 
  html, body { 
    margin: 0; 
    padding: 0; 
    background: #FFFFFF; 
    width: 100%; 
    height: 100%; 
    overflow: hidden; 
    font-family: Arial, sans-serif; 
  } 
  
  .slide { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    display: none; 
    opacity: 0; 
    transform: translate(-50%, -50%); 
    transition: opacity 0.5s ease, transform 0.5s ease; 
  } 
  
  /* Hide video controls */
  .slide video {
    pointer-events: none;
  }
  
  .slide video::-webkit-media-controls {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-panel {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-play-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-start-playback-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-timeline {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-current-time-display {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-time-remaining-display {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-mute-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-volume-slider {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-fullscreen-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-picture-in-picture-button {
    display: none !important;
  }
  
  .controls { 
    position: absolute; 
    bottom: 15px; 
    left: 50%; 
    transform: translateX(-50%); 
    display: flex; 
    gap: 15px; 
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
  } 
  
  .controls.visible {
    opacity: 1;
  }
  
  .controls button { 
    width: 55px;
    height: 55px;
    font-size: 20px; 
    background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
    color: white; 
    border: none; 
    border-radius: 50%; 
    cursor: pointer; 
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2),
                inset 0 2px 2px rgba(255,255,255,0.1);
  } 
  
  .controls button:hover {
    background: linear-gradient(145deg, #333333, #222222);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.25),
                inset 0 2px 2px rgba(255,255,255,0.1);
  }
  
  .controls button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  .controls button i {
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  
  #progressContainer { 
    position: absolute; 
    bottom: 0; 
    left: 0; 
    width: 100%; 
    height: 10px; 
    background: rgba(0,0,0,0.3); 
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease, height 0.2s ease;
    z-index: 5;
  } 
  
  #progressContainer.visible {
    opacity: 1;
  }
  
  #progressContainer:hover {
    height: 16px;
  }
  
  #progressBar { 
    height: 100%; 
    width: 0%; 
    background: linear-gradient(90deg, #ff3636, #ff5252);
    box-shadow: 0 0 8px rgba(255,50,50,0.5);
    transition: width 0.2s linear; 
    position: relative; 
    z-index: 1; 
  } 
  
  #progressBar::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background: #ff3636;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255,50,50,0.8);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  #progressContainer:hover #progressBar::after {
    opacity: 1;
  }
  
  .marker { 
    position: absolute; 
    top: 0; 
    bottom: 0; 
    width: 3px; 
    background-color: rgba(0, 0, 0, 0.6); 
    z-index: 2;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  } 
  
  #timeLabel { 
    position: absolute; 
    bottom: 20px; 
    right: 20px; 
    font-size: 14px; 
    color: #fff; 
    background: rgba(0,0,0,0.7);
    padding: 6px 10px;
    border-radius: 20px;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  } 
  
  #timeLabel.visible {
    opacity: 1;
  }

  /* Thumbnail Navigation Styles */
  #thumbnailContainer {
    position: absolute;
    bottom: 25px;
    left: 0;
    width: 100%;
    height: 90px;
    display: flex;
    overflow-x: auto;
    padding: 10px 20px;
    opacity: 0;
    transition: opacity 0.3s ease;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
    z-index: 4;
  }
  
  #thumbnailContainer::-webkit-scrollbar {
    height: 6px;
  }
  
  #thumbnailContainer::-webkit-scrollbar-track {
    background: transparent;
  }
  
  #thumbnailContainer::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.3);
    border-radius: 6px;
  }
  
  #thumbnailContainer.visible {
    opacity: 1;
  }
  
  .thumbnail {
    min-width: 120px;
    height: 70px;
    margin: 0 6px;
    background-color: #000;
    background-image: url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png');
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }
  
  .thumbnail:hover {
    transform: scale(1.08);
    border-color: rgba(255,255,255,0.7);
  }
  
  .thumbnail.active {
    border: 3px solid #ff3636;
    box-shadow: 0 0 15px rgba(255, 50, 50, 0.5);
  }

  .thumbnail-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    color: white;
    font-size: 16px;
    padding: 5px 0;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }
  </style> 
</head> 
<body> 
  ${slideData.map((s, i) => `<div class="slide" id="slide-${i}" style="width:${s.width}px;height:${s.height}px;background-color:${s.backgroundColor};"> 
    ${decodeURIComponent(s.img)} 
  </div>`).join('')} 
  
  <!-- Thumbnail Navigation -->
  <div id="thumbnailContainer">
    ${slideData.map((s, i) => `<div class="thumbnail" id="thumb-${i}" onclick="jumpToSlide(${i})">
      <div class="thumbnail-label">Slide ${i+1}</div>
    </div>`).join('')}
  </div>
  
  <div class="controls"> 
    <button onclick="togglePlay()" id="playBtn"><i class="fas fa-pause"></i></button> 
  </div> 
  <div id="progressContainer" onclick="seek(event)"> 
    <div id="progressBar"></div> 
  </div> 
  <div id="timeLabel">00:00 / 00:00</div> 
  
  <script> 
  const slides = [...document.querySelectorAll('.slide')]; 
  const thumbnails = [...document.querySelectorAll('.thumbnail')];
  const slideData = ${JSON.stringify(slideData)}; 
  const totalTime = ${totalDuration}; 
  const progressBar = document.getElementById("progressBar"); 
  const timeLabel = document.getElementById("timeLabel"); 
  
  // Video sync variables
  let currentVideo = null;
  let videoSyncMode = false;
  let videoStartTime = 0;
  let slideDisplayStartTime = 0;
  
  // Input validation variables
  let waitingForInput = false;
  let inputValidationListener = null;
  
  // Add slide boundary markers 
  const progressContainer = document.getElementById("progressContainer"); 
  let accumulated = 0; 
  for (let i = 0; i < slideData.length - 1; i++) { 
    accumulated += slideData[i].transition + slideData[i].display; 
    const pct = (accumulated / totalTime) * 100; 
    const marker = document.createElement('div'); 
    marker.className = 'marker'; 
    marker.style.left = pct + '%'; 
    progressContainer.appendChild(marker); 
  } 
  
  let current = 0; 
  let phase = 'transition'; 
  let remaining = slideData[0].transition; 
  let elapsed = 0; 
  let playing = true; 
  let last = null; 
  let rafId; 
  
  function format(t) { 
    const m = Math.floor(t / 60).toString().padStart(2, '0'); 
    const s = Math.floor(t % 60).toString().padStart(2, '0'); 
    return m + ':' + s; 
  } 
  
  function updateProgressUI() { 
    const percent = (elapsed / totalTime) * 100; 
    progressBar.style.width = percent + '%'; 
    timeLabel.textContent = format(elapsed) + ' / ' + format(totalTime); 
    
    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === current);
    });
  } 
  
  function getCurrentSlideVideo() {
    const slideElement = slides[current];
    return slideElement ? slideElement.querySelector('video') : null;
  }
  
  function setupVideoSync() {
    currentVideo = getCurrentSlideVideo();
    
    if (currentVideo && slideData[current].hasVideo) {
      videoSyncMode = true;
      
      // Remove existing event listeners to avoid duplicates
      currentVideo.removeEventListener('loadedmetadata', onVideoLoaded);
      currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
      currentVideo.removeEventListener('ended', onVideoEnded);
      currentVideo.removeEventListener('contextmenu', preventContextMenu);
      
      // Add event listeners
      currentVideo.addEventListener('loadedmetadata', onVideoLoaded);
      currentVideo.addEventListener('timeupdate', onVideoTimeUpdate);
      currentVideo.addEventListener('ended', onVideoEnded);
      currentVideo.addEventListener('contextmenu', preventContextMenu);
      
      // Set video attributes to hide controls
      currentVideo.setAttribute('controls', false);
      currentVideo.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      currentVideo.setAttribute('disablePictureInPicture', true);
      
      // Set video to start from beginning
      currentVideo.currentTime = 0;
      
      if (playing && phase === 'display') {
        currentVideo.play().catch(e => console.log('Video play failed:', e));
      }
    } else {
      videoSyncMode = false;
      currentVideo = null;
    }
  }
  
  function preventContextMenu(event) {
    event.preventDefault();
  }
  
  function onVideoLoaded() {
    // Video metadata loaded, ready to sync
    if (playing && phase === 'display') {
      currentVideo.play().catch(e => console.log('Video play failed:', e));
    }
  }
  
  function onVideoTimeUpdate() {
    // This helps ensure video stays in sync during playback
    if (videoSyncMode && currentVideo && phase === 'display') {
      const videoTime = currentVideo.currentTime;
      const slideDisplayTime = slideDisplayStartTime + videoTime;
      
      // Small tolerance for sync differences
      const tolerance = 0.1;
      const expectedTime = elapsed - (getCurrentSlideStartTime() + slideData[current].transition);
      
      if (Math.abs(videoTime - expectedTime) > tolerance) {
        // Sync video to slide timer
        const targetVideoTime = Math.max(0, expectedTime);
        if (targetVideoTime <= currentVideo.duration) {
          currentVideo.currentTime = targetVideoTime;
        }
      }
    }
  }
  
  function onVideoEnded() {
    // Video has ended, but slide timer might still be running
    // Let the slide timer continue normally
  }
  
  function getCurrentSlideStartTime() {
    let time = 0;
    for (let i = 0; i < current; i++) {
      time += slideData[i].transition + slideData[i].display;
    }
    return time;
  }
  
  function syncVideoToSlideTime() {
    if (!videoSyncMode || !currentVideo || phase !== 'display') return;
    
    const slideStartTime = getCurrentSlideStartTime() + slideData[current].transition;
    const videoTime = elapsed - slideStartTime;
    
    if (videoTime >= 0 && videoTime <= currentVideo.duration) {
      const timeDiff = Math.abs(currentVideo.currentTime - videoTime);
      if (timeDiff > 0.1) { // Only sync if difference is significant
        currentVideo.currentTime = videoTime;
      }
    }
  }
  
  function checkInputValidation() {
    if (!slideData[current].slideInput) return true;
    
    const slideElement = slides[current];
    const requiredInputs = slideElement.querySelectorAll('input[required], textarea[required], select[required]');
    
    // Check if all required inputs are filled
    for (let input of requiredInputs) {
      if (!input.value.trim()) {
        return false;
      }
    }
    
    return true;
  }
  
  function setupInputValidation() {
    if (!slideData[current].slideInput) return;
    
    const slideElement = slides[current];
    const submitButton = slideElement.querySelector('button[type="submit"], input[type="submit"]');
    const requiredInputs = slideElement.querySelectorAll('input[required], textarea[required], select[required]');
    
    if (submitButton && requiredInputs.length > 0) {
      waitingForInput = true;
      
      // Remove existing listener if any
      if (inputValidationListener) {
        submitButton.removeEventListener('click', inputValidationListener);
      }
      
      // Add new listener
      inputValidationListener = function(event) {
        if (checkInputValidation()) {
          waitingForInput = false;
          // Resume slideshow
          if (!playing) {
            togglePlay();
          }
          submitButton.removeEventListener('click', inputValidationListener);
          inputValidationListener = null;
        }
      };
      
      submitButton.addEventListener('click', inputValidationListener);
      
      // Pause slideshow if it's playing
      if (playing) {
        togglePlay();
      }
    }
  }
  
  function showSlide(index) { 
    slides.forEach((s, i) => { 
      s.style.display = i === index ? 'block' : 'none'; 
      s.style.opacity = 0; 
      if (i === index) { 
        const { type, dir } = slideData[i]; 
        if (type === 'zoom') { 
          s.style.transform = 'translate(-50%, -50%) scale(0.8)'; 
        } else if (type === 'slide') { 
          let tx = 0, ty = 0, dist = 100; 
          if (dir === 'left') tx = -dist; 
          if (dir === 'right') tx = dist; 
          if (dir === 'up') ty = -dist; 
          if (dir === 'down') ty = dist; 
          s.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%))\`; 
        } else { 
          s.style.transform = 'translate(-50%, -50%)'; 
        } 
      } 
    }); 
    
    // Setup video sync for the new slide
    setupVideoSync();
    
    // Hide all video controls for the current slide
    const slideVideos = slides[index].querySelectorAll('video');
    slideVideos.forEach(video => {
      video.setAttribute('controls', false);
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
      video.setAttribute('disablePictureInPicture', true);
      video.addEventListener('contextmenu', preventContextMenu);
    });
  } 
  
  function renderTransition(progress) { 
    const slide = slides[current]; 
    const { type, dir } = slideData[current]; 
    if (type === 'fade') { 
      slide.style.opacity = progress; 
      slide.style.transform = 'translate(-50%, -50%)'; 
    } else if (type === 'zoom') { 
      slide.style.opacity = 1; 
      slide.style.transform = \`translate(-50%, -50%) scale(\${0.8 + 0.2 * progress})\`; 
    } else if (type === 'slide') { 
      slide.style.opacity = 1; 
      let tx = 0, ty = 0; 
      const dist = 100; 
      if (dir === 'left') tx = -dist * (1 - progress); 
      if (dir === 'right') tx = dist * (1 - progress); 
      if (dir === 'up') ty = -dist * (1 - progress); 
      if (dir === 'down') ty = dist * (1 - progress); 
      slide.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%))\`; 
    } 
  } 
  
  function run(timestamp) { 
    if (!last) last = timestamp; 
    const delta = (timestamp - last) / 1000; 
    last = timestamp; 
    
    // Don't progress if waiting for input
    if (waitingForInput) {
      if (playing) rafId = requestAnimationFrame(run);
      return;
    }
    
    remaining -= delta; 
    elapsed += delta; 
    updateProgressUI(); 
    
    if (phase === 'transition') { 
      const full = slideData[current].transition; 
      const progress = 1 - (remaining / full); 
      renderTransition(progress); 
    } else if (phase === 'display') {
      // Sync video during display phase
      syncVideoToSlideTime();
    }
    
    if (remaining <= 0) { 
      if (phase === 'transition') { 
        phase = 'display'; 
        remaining = slideData[current].display; 
        slides[current].style.opacity = 1; 
        
        // Start video playback when display phase begins
        if (videoSyncMode && currentVideo && playing) {
          slideDisplayStartTime = elapsed;
          currentVideo.currentTime = 0;
          currentVideo.play().catch(e => console.log('Video play failed:', e));
        }
        
        // Check for input validation requirement
        setupInputValidation();
      } else { 
        if (current === slideData.length - 1) { 
          playing = false; 
          document.getElementById("playBtn").innerHTML = '<i class="fas fa-play"></i>'; 
          
          // Pause video if it's playing
          if (currentVideo) {
            currentVideo.pause();
          }
          return; 
        } 
        
        // Pause current video before moving to next slide
        if (currentVideo) {
          currentVideo.pause();
        }
        
        current++; 
        phase = 'transition'; 
        remaining = slideData[current].transition; 
        showSlide(current); 
      } 
    } 
    
    if (playing) rafId = requestAnimationFrame(run); 
  } 
  
  function togglePlay() { 
    playing = !playing; 
    const btn = document.getElementById("playBtn"); 
    
    if (playing) { 
      btn.innerHTML = '<i class="fas fa-pause"></i>'; 
      last = null; 
      rafId = requestAnimationFrame(run); 
      
      // Resume video if in display phase
      if (phase === 'display' && currentVideo && videoSyncMode) {
        currentVideo.play().catch(e => console.log('Video play failed:', e));
      }
    } else { 
      btn.innerHTML = '<i class="fas fa-play"></i>'; 
      if (rafId) cancelAnimationFrame(rafId); 
      
      // Pause video
      if (currentVideo) {
        currentVideo.pause();
      }
    } 
  } 
  
  function seek(event) { 
    const rect = event.currentTarget.getBoundingClientRect(); 
    const percent = (event.clientX - rect.left) / rect.width; 
    const targetTime = percent * totalTime; 
    
    // Find which slide this time corresponds to
    let acc = 0; 
    for (let i = 0; i < slideData.length; i++) { 
      const slideEnd = acc + slideData[i].transition + slideData[i].display; 
      if (targetTime <= slideEnd) { 
        current = i; 
        const slideStart = acc; 
        const slideTime = targetTime - slideStart; 
        
        if (slideTime < slideData[i].transition) { 
          phase = 'transition'; 
          remaining = slideData[i].transition - slideTime; 
        } else { 
          phase = 'display'; 
          remaining = slideData[i].display - (slideTime - slideData[i].transition); 
        } 
        
        elapsed = targetTime; 
        showSlide(current); 
        updateProgressUI(); 
        
        // Sync video to new position
        if (videoSyncMode && currentVideo && phase === 'display') {
          const videoTime = slideTime - slideData[current].transition;
          if (videoTime >= 0 && videoTime <= currentVideo.duration) {
            currentVideo.currentTime = videoTime;
            if (playing) {
              currentVideo.play().catch(e => console.log('Video play failed:', e));
            }
          }
        }
        
        break; 
      } 
      acc = slideEnd; 
    } 
  } 
  
  function jumpToSlide(index) {
    if (index < 0 || index >= slideData.length) return;
    
    // Calculate the time at the start of the target slide
    let targetTime = 0;
    for (let i = 0; i < index; i++) {
      targetTime += slideData[i].transition + slideData[i].display;
    }
    
    current = index;
    phase = 'transition';
    remaining = slideData[index].transition;
    elapsed = targetTime;
    
    showSlide(current);
    updateProgressUI();
    
    // Reset video sync for new slide
    setupVideoSync();
  }
  
  // Mouse movement detection for UI visibility
  let mouseTimeout;
  let isMouseMoving = false;
  
  function showUI() {
    document.querySelector('.controls').classList.add('visible');
    document.getElementById('progressContainer').classList.add('visible');
    document.getElementById('timeLabel').classList.add('visible');
    document.getElementById('thumbnailContainer').classList.add('visible');
    
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(hideUI, 3000);
  }
  
  function hideUI() {
    if (!isMouseMoving) {
      document.querySelector('.controls').classList.remove('visible');
      document.getElementById('progressContainer').classList.remove('visible');
      document.getElementById('timeLabel').classList.remove('visible');
      document.getElementById('thumbnailContainer').classList.remove('visible');
    }
  }
  
  // Enhanced video control hiding
  function hideAllVideoControls() {
    slides.forEach(slide => {
      const videos = slide.querySelectorAll('video');
      videos.forEach(video => {
        // Hide native controls
        video.setAttribute('controls', false);
        video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
        video.setAttribute('disablePictureInPicture', true);
        video.style.pointerEvents = 'none';
        
        // Prevent context menu
        video.addEventListener('contextmenu', event => event.preventDefault());
        
        // Hide controls on hover/mouse events
        video.addEventListener('mouseenter', () => {
          video.setAttribute('controls', false);
        });
        
        video.addEventListener('mouseover', () => {
          video.setAttribute('controls', false);
        });
        
        video.addEventListener('focus', () => {
          video.blur();
        });
        
        // Prevent keyboard controls
        video.addEventListener('keydown', event => {
          event.preventDefault();
        });
      });
    });
  }
  
  // Mouse event listeners
  document.addEventListener('mousemove', () => {
    isMouseMoving = true;
    showUI();
    
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
      isMouseMoving = false;
      hideUI();
    }, 3000);
  });
  
  document.addEventListener('mouseenter', showUI);
  document.addEventListener('mouseleave', () => {
    isMouseMoving = false;
    hideUI();
  });
  
  // Keyboard controls
  document.addEventListener('keydown', (event) => {
    switch(event.code) {
      case 'Space':
        event.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (current > 0) jumpToSlide(current - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (current < slideData.length - 1) jumpToSlide(current + 1);
        break;
      case 'Escape':
        event.preventDefault();
        if (playing) togglePlay();
        break;
    }
  });
  
  // Initialize slideshow
  function init() {
    // Hide all video controls initially
    hideAllVideoControls();
    
    // Show first slide
    showSlide(0);
    updateProgressUI();
    
    // Start slideshow
    if (playing) {
      last = null;
      rafId = requestAnimationFrame(run);
    }
    
    // Initial UI state
    showUI();
    
    // Add additional CSS to completely hide video controls
    const style = document.createElement('style');
    style.textContent = 
    ` video::-webkit-media-controls {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      
      video::-webkit-media-controls-panel {
        display: none !important;
      }
      
      video::-webkit-media-controls-play-button {
        display: none !important;
      }
      
      video::-webkit-media-controls-start-playback-button {
        display: none !important;
      }
      
      video::-webkit-media-controls-timeline {
        display: none !important;
      }
      
      video::-webkit-media-controls-current-time-display {
        display: none !important;
      }
      
      video::-webkit-media-controls-time-remaining-display {
        display: none !important;
      }
      
      video::-webkit-media-controls-mute-button {
        display: none !important;
      }
      
      video::-webkit-media-controls-volume-slider {
        display: none !important;
      }
      
      video::-webkit-media-controls-fullscreen-button {
        display: none !important;
      }
      
      video::-webkit-media-controls-picture-in-picture-button {
        display: none !important;
      }
      
      video::-webkit-media-controls-overlay-play-button {
        display: none !important;
      }
      
      video::-webkit-media-controls-overlay-enclosure {
        display: none !important;
      }
      
      video {
        pointer-events: none !important;
      }
      
      video:focus {
        outline: none !important;
      }
      
      /* Firefox */
      video::-moz-media-controls {
        display: none !important;
      }
      
      /* Hide any form of video controls */
      video[controls] {
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
      } `;
    document.head.appendChild(style);
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  </script> 
</body> 
</html>`; 
  
  // Create and download the file
  const blob = new Blob([fullHTML], { type: 'text/html' }); 
  const url = URL.createObjectURL(blob); 
  const a = document.createElement('a'); 
  a.href = url; 
  a.download = 'interactive_slideshow.html'; 
  a.click(); 
  URL.revokeObjectURL(url); 
}