// ===== FairJobs – simple vanilla JavaScript =====
// All logic in one file so it is easy to explain.

let allJobs = []; // We keep the full list here after fetching

// ---------- Helper functions ----------
function formatSalary(job) {
  return `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`;
}

function formatDate(dateStr) {
  const posted = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return dateStr;
}

function remoteBadge(remote) {
  if (remote === "yes") return '<span class="badge badge-remote">Remote</span>';
  if (remote === "hybrid") return '<span class="badge badge-hybrid">Hybrid</span>';
  return '<span class="badge badge-onsite">On-site</span>';
}

// ---------- Render job cards on homepage ----------
function renderJobs(jobs) {
  const container = document.getElementById("job-list");
  if (!container) return;

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No jobs match your filters</h3>
        <p>Try clearing some filters or check back later.</p>
      </div>`;
    return;
  }

  let html = "";
  jobs.forEach(job => {
    html += `
      <div class="job-card">
        <h2>${job.title}</h2>
        <div class="company">${job.company}</div>
        <div class="job-meta">
          ${remoteBadge(job.remote)}
          <span class="badge badge-salary">${formatSalary(job)}</span>
          <span>${job.location}</span>
          <span>${job.type}</span>
        </div>
        <div class="date">Posted ${formatDate(job.date_posted)}</div>
        <a href="job.html?id=${job.id}" class="btn" style="margin-top:12px;">View & Apply</a>
      </div>`;
  });
  container.innerHTML = html;
}

// ---------- Filter logic (client-side = fast) ----------
function applyFilters() {
  const keyword = (document.getElementById("search")?.value || "").toLowerCase();
  const location = (document.getElementById("location")?.value || "").toLowerCase();
  const minSalary = parseInt(document.getElementById("minSalary")?.value) || 0;
  const remoteFilter = document.getElementById("remote")?.value || "";

  let filtered = allJobs.filter(job => {
    // Keyword search in title, company, description
    const matchesKeyword = !keyword ||
      job.title.toLowerCase().includes(keyword) ||
      job.company.toLowerCase().includes(keyword) ||
      job.description.toLowerCase().includes(keyword);

    // Location
    const matchesLocation = !location ||
      job.location.toLowerCase().includes(location);

    // Min salary (we use salary_min)
    const matchesSalary = job.salary_min >= minSalary;

    // Remote filter
    let matchesRemote = true;
    if (remoteFilter === "yes") {
      matchesRemote = job.remote === "yes";
    } else if (remoteFilter === "hybrid") {
      matchesRemote = job.remote === "yes" || job.remote === "hybrid";
    }

    return matchesKeyword && matchesLocation && matchesSalary && matchesRemote;
  });

  // Newest first
  filtered.sort((a, b) => b.date_posted.localeCompare(a.date_posted));
  renderJobs(filtered);
}

// ---------- Load jobs from PHP API ----------
// ---------- Load jobs (tries static JSON first, then PHP) ----------
async function loadJobs() {
  const container = document.getElementById("job-list");
  
  try {
    const response = await fetch("data/jobs.json");
    if (!response.ok) throw new Error("Could not load jobs");
    allJobs = await response.json();
    applyFilters();
    console.log("Jobs loaded successfully from data/jobs.json");
  } catch (err) {
    console.error(err);
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Could not load jobs</h3>
          <p>Check that data/jobs.json exists.</p>
        </div>`;
    }
  }
}
  const container = document.getElementById("job-list");
  
  // Try 1: Static file (works perfectly on Vercel)
  try {
    const response = await fetch("data/jobs.json");
    if (response.ok) {
      allJobs = await response.json();
      applyFilters();
      console.log("Loaded jobs from static JSON");
      return;
    }
  } catch (err) {
    console.log("Static JSON failed, trying PHP...");
  }

  // Try 2: PHP API
  try {
    const response = await fetch("api/jobs.php");
    if (!response.ok) throw new Error("Could not load jobs from PHP");
    allJobs = await response.json();
    applyFilters();
    console.log("Loaded jobs from PHP");
  } catch (err) {
    console.error(err);
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Could not load jobs</h3>
          <p>Please check the browser console (F12) or try again later.</p>
        </div>`;
    }
  }
}
  try {
    const response = await fetch("api/jobs.php");
    if (!response.ok) throw new Error("Could not load jobs");
    allJobs = await response.json();
    applyFilters(); // show them (with any current filters)
  } catch (err) {
    console.error(err);
    const container = document.getElementById("job-list");
    if (container) {
      container.innerHTML = `<div class="empty-state">Sorry, could not load jobs. Make sure the PHP server is running.</div>`;
    }
  }
}

// ---------- Listings page setup ----------
function initListingsPage() {
  loadJobs();

  // Live filtering
  ["search", "location", "minSalary", "remote"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", applyFilters);
      el.addEventListener("change", applyFilters);
    }
  });
}

// ---------- Job detail page ----------
async function initJobDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  if (!id) {
    document.getElementById("job-detail").innerHTML = "<p>No job selected.</p>";
    return;
  }

  // Load all jobs then find the one we need
  try {
    const response = await fetch("api/jobs.php");
    allJobs = await response.json();
    const job = allJobs.find(j => j.id === id);

    if (!job) {
      document.getElementById("job-detail").innerHTML = "<p>Job not found.</p>";
      return;
    }

    // Fill the detail
    document.getElementById("job-detail").innerHTML = `
      <h1>${job.title}</h1>
      <div class="company">${job.company}</div>
      <div class="job-meta" style="margin: 16px 0;">
        ${remoteBadge(job.remote)}
        <span class="badge badge-salary">${formatSalary(job)}</span>
        <span>${job.location}</span>
        <span>${job.type}</span>
      </div>
      <div class="date">Posted ${formatDate(job.date_posted)}</div>

      <h3 class="section-title">Description</h3>
      <p>${job.description}</p>

      <h3 class="section-title">Requirements</h3>
      <p>${job.requirements || "See description."}</p>
    `;

    // Set hidden job_id for the form
    document.getElementById("job_id").value = job.id;

    // Handle apply form
    document.getElementById("apply-form").addEventListener("submit", submitApplication);
  } catch (err) {
    document.getElementById("job-detail").innerHTML = "<p>Error loading job.</p>";
  }
}

// ---------- Submit application ----------
async function submitApplication(e) {
  e.preventDefault();

  const form = e.target;
  const successEl = document.getElementById("apply-success");
  const errorEl = document.getElementById("apply-error");
  const name = document.getElementById("name").value;

  successEl.style.display = "none";
  errorEl.style.display = "none";

  // Demo success message (no server needed)
  successEl.textContent = `Thank you ${name}! Your application has been received. The employer will be notified. (Demo mode – no real email sent)`;
  successEl.style.display = "block";
  form.reset();
}  e.preventDefault();

  const form = e.target;
  const successEl = document.getElementById("apply-success");
  const errorEl = document.getElementById("apply-error");
  successEl.style.display = "none";
  errorEl.style.display = "none";

  const formData = new FormData(form);

  try {
    const response = await fetch("api/apply.php", {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    if (result.success) {
      successEl.textContent = result.message;
      successEl.style.display = "block";
      form.reset();
    } else {
      errorEl.textContent = result.message || "Something went wrong.";
      errorEl.style.display = "block";
    }
  } catch (err) {
    errorEl.textContent = "Network error. Try again.";
    errorEl.style.display = "block";
  }
}

// ---------- Post a new job page ----------
function initPostPage() {
  document.getElementById("post-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const successEl = document.getElementById("post-success");
    const errorEl = document.getElementById("post-error");
    successEl.style.display = "none";
    errorEl.style.display = "none";

    // Demo success
    successEl.textContent = "Job posted successfully! (Demo mode – on the live site this is simulated. Edit data/jobs.json and push to GitHub to add real jobs permanently.)";
    successEl.style.display = "block";
    e.target.reset();
  });
}  document.getElementById("post-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const successEl = document.getElementById("post-success");
    const errorEl = document.getElementById("post-error");
    successEl.style.display = "none";
    errorEl.style.display = "none";

    const formData = new FormData(e.target);

    try {
      const response = await fetch("api/add-job.php", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (result.success) {
        successEl.textContent = result.message;
        successEl.style.display = "block";
        e.target.reset();
      } else {
        errorEl.textContent = result.message || "Could not add job.";
        errorEl.style.display = "block";
      }
    } catch (err) {
      errorEl.textContent = "Network error.";
      errorEl.style.display = "block";
    }
  });
}