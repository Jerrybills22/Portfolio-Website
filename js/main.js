/* Wait until the page is ready, then run everything inside this function. */
document.addEventListener("DOMContentLoaded", () => {
  /* Short helper: find one element */
  const $ = (s) => document.querySelector(s);
  /* Short helper: find many elements */
  const $$ = (s) => [...document.querySelectorAll(s)];
  /* True if the visitor wants less motion */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mark the page as JavaScript-powered. CSS hides .reveal sections only
     when this class is present, so nothing stays invisible if JS fails. */
  document.documentElement.classList.add("js");

  const yearEl = $("#year");
  /* Puts the current year in the footer */
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- THEME PICKER ----
     A "Theme" button opens a small menu: Light, Darkness or Auto.
     Auto has a schedule: the visitor sets the times darkness starts and
     ends, and the site switches by itself at those times - even while
     the page is open. The default is 18:00 to 06:00. */
  const themeBtn = $("#themeBtn"),
    themeMenu = $("#themeMenu"),
    scheduleBox = $("#themeSchedule"),
    fromInput = $("#schedFrom"),
    toInput = $("#schedTo");
  if (themeBtn && themeMenu) {
    /* Which mode is saved? Falls back to "auto". */
    const savedMode = () => {
      try {
        return localStorage.getItem("theme") || "auto";
      } catch (e) {
        return "auto";
      }
    };
    /* Load the schedule, with the 18:00 -> 06:00 default */
    const loadSchedule = () => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem("themeSchedule") || "null");
      } catch (e) {}
      if (!s) s = { from: "18:00", to: "06:00" };
      return s;
    };
    /* Mark the currently active choice in the menu */
    const markActive = () => {
      const saved = savedMode();
      themeMenu
        .querySelectorAll("[data-theme-choice]")
        .forEach((b) =>
          b.classList.toggle("on", b.dataset.themeChoice === saved),
        );
      /* Only show the schedule box when Auto is the active mode */
      if (scheduleBox) scheduleBox.hidden = saved !== "auto";
      /* Fill the time boxes with the saved schedule */
      if (scheduleBox && fromInput && toInput) {
        const s = loadSchedule();
        fromInput.value = s.from;
        toInput.value = s.to;
      }
    };
    /* Open or close the menu */
    const setMenu = (open) => {
      themeMenu.hidden = !open;
      themeBtn.setAttribute("aria-expanded", String(open));
      if (open) markActive();
    };
    /* Clicking the Theme button opens or closes the menu */
    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMenu(themeMenu.hidden);
    });
    /* Pick a theme - any choice closes the menu */
    themeMenu.addEventListener("click", (e) => {
      const choice = e.target.closest("[data-theme-choice]");
      if (!choice) return;
      const mode = choice.dataset.themeChoice;
      /* Save the choice; auto uses the schedule to decide light/dark */
      try {
        localStorage.setItem("theme", mode);
      } catch (err) {}
      applyTheme();
      markActive();
      setMenu(false);
    });
    /* Auto schedule: when a time box changes, save it and re-apply.
       Wrap past midnight works too (e.g. 18:00 -> 06:00). */
    const saveSchedule = () => {
      if (!fromInput || !toInput) return;
      const s = { from: fromInput.value, to: toInput.value };
      /* Only save if both times are valid HH:MM */
      if (themeParseTime(s.from) !== null && themeParseTime(s.to) !== null) {
        try {
          localStorage.setItem("themeSchedule", JSON.stringify(s));
        } catch (err) {}
        applyTheme();
      }
    };
    if (fromInput) fromInput.addEventListener("change", saveSchedule);
    if (toInput) toInput.addEventListener("change", saveSchedule);
    /* Live switching: every minute, re-check the schedule. When the
       saved mode is "auto", the theme flips on its own at the chosen times. */
    setInterval(() => {
      if (savedMode() === "auto") applyTheme();
    }, 60000);
    /* Close when clicking anywhere outside the theme menu */
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".theme-menu")) setMenu(false);
    });
    /* Escape also closes it */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !themeMenu.hidden) {
        setMenu(false);
        themeBtn.focus();
      }
    });
  }

  /* ---- MOBILE MENU ---- */
  const nav = $("#nav"),
    menuBtn = $("#menuBtn");
  if (nav && menuBtn) {
    /* Show or hide the menu */
    menuBtn.addEventListener("click", () =>
      menuBtn.setAttribute("aria-expanded", nav.classList.toggle("open")),
    );
    /* Close after choosing a link */
    nav.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  }

  /* ---- TYPING ANIMATION ---- */
  /* Lines to type */
  const roles = [
    "IT Infrastructure & Web Engineer",
    "cloud learner on AWS",
    "network and IT support specialist",
  ];
  /* r = which line, c = letters shown, del = deleting? */
  const typed = $("#typed");
  let r = 0,
    c = 0,
    del = false;
  function type() {
    /* Show the first c letters */
    typed.textContent = roles[r].slice(0, c);
    /* Pause when a line is complete */
    if (!del && c === roles[r].length) {
      del = true;
      return setTimeout(type, 1600);
    }
    /* Move to the next line */
    if (del && c === 0) {
      del = false;
      r = (r + 1) % roles.length;
    }
    /* Add or remove one letter */
    c += del ? -1 : 1;
    /* Deleting is faster than typing */
    setTimeout(type, del ? 30 : 60);
  }
  /* No animation if the visitor prefers reduced motion */
  if (typed) {
    if (reduce) typed.textContent = roles[0];
    else type();
  }

  /* ---- FADE IN SECTIONS ---- */
  /* Watches elements entering the screen */
  const io = new IntersectionObserver(
    (list) =>
      list.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.1 },
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---- PROJECT FILTER ---- */
  $$(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      /* Highlight the clicked button */
      $$(".chip").forEach((x) => x.classList.toggle("on", x === chip));
      /* Hide cards from other categories */
      $$(".proj").forEach((p) => {
        p.hidden = chip.dataset.f !== "all" && p.dataset.c !== chip.dataset.f;
      });
    }),
  );

  /* ---- BACK TO TOP ---- */
  /* Show the button after scrolling 600px. passive keeps scrolling smooth,
     and we only touch the DOM when the visible state actually changes. */
  const toTop = $("#toTop");
  if (toTop) {
    let topShown = false;
    addEventListener(
      "scroll",
      () => {
        const show = scrollY >= 600;
        if (show !== topShown) {
          topShown = show;
          toTop.hidden = !show;
        }
      },
      { passive: true },
    );
    /* Jump to the top */
    toTop.addEventListener("click", () => scrollTo({ top: 0 }));
  }

  /* ---- CONTACT FORM ---- */
  const form = $("#form"),
    msg = $("#formMsg");
  if (form && msg)
    form.addEventListener("submit", async (e) => {
      /* Stop the normal page reload */
      e.preventDefault();
      /* Tell the visitor what is wrong */
      if (!form.checkValidity()) {
        msg.textContent = "Please fill in your name, a valid email and a message.";
        return;
      }
      /* Reminder until you add your Formspree ID */
      if (form.action.includes("YOUR_FORM_ID")) {
        msg.textContent = "The form is not connected yet. Please email me directly.";
        return;
      }
      try {
        /* Send to Formspree */
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        /* Show the result */
        msg.textContent = res.ok
          ? "Message sent. Thank you!"
          : "Sending failed. Please email me directly.";
        /* Clear the form on success */
        if (res.ok) form.reset();
        /* Network problem */
      } catch (err) {
        msg.textContent = "No connection. Please try again.";
      }
    });

  /* ---- TERMINAL EASTER EGG ---- */
  const out = $("#termOut"),
    input = $("#termIn");
  if (out && input) {
    /* Each command and its reply */
    const cmds = {
      help: "Try: whoami, skills, contact, ping, clear",
      whoami: "Jerry Ayie Ayayee. IT infrastructure and web engineer, Takoradi, Ghana.",
      skills:
        "AWS (EC2, VPC, IAM, S3), networking, Windows and Ubuntu, HTML/CSS/JS, Excel automation",
      contact: "jerryayayee@gmail.com",
      ping: "Reply from jerry: time<1ms. Always online for good ideas.",
    };
    /* Add a line and scroll down */
    const say = (t) => {
      out.textContent += t + "\n";
      out.scrollTop = out.scrollHeight;
    };
    say("Welcome. Type help to begin.");
    input.addEventListener("keydown", (e) => {
      /* Only react to the Enter key */
      if (e.key !== "Enter") return;
      /* Read and clear the input */
      const v = input.value.trim().toLowerCase();
      input.value = "";
      say("$ " + v);
      /* Empty the screen */
      if (v === "clear") out.textContent = "";
      /* Reply, or say it is unknown */
      else say(cmds[v] || "command not found: " + v);
    });
  }
});
