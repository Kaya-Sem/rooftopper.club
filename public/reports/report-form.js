// Location detail page: still-here / no-longer-here report buttons for logged-in users.
// Loaded after script.js (needs supabaseClient) and after the page markup, so it can
// run its own guard at load time instead of waiting for a separate init call.

async function initLocationReportForm() {
    const container = document.getElementById("location-report-actions");
    const section = document.querySelector(".location-report-section[data-location-id]");
    const locationId = section ? section.getAttribute("data-location-id") : null;
    const stillPresentBtn = document.getElementById("reportStillPresentBtn");
    const noLongerHereBtn = document.getElementById("reportNoLongerHereBtn");
    if (!locationId || !container || !stillPresentBtn || !noLongerHereBtn) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        container.style.display = "none";
        return;
    }

    container.style.display = "flex";
    const errorEl = document.getElementById("locationReportError");

    async function submitReport(reportType) {
        if (errorEl) errorEl.style.display = "none";
        stillPresentBtn.disabled = true;
        noLongerHereBtn.disabled = true;

        const { error } = await supabaseClient.rpc("submit_location_report", {
            p_location_id: locationId,
            p_report_type: reportType,
        });

        if (error) {
            stillPresentBtn.disabled = false;
            noLongerHereBtn.disabled = false;
            if (errorEl) {
                errorEl.textContent = error.message || "Failed to submit report.";
                errorEl.style.display = "block";
            }
            return;
        }
        window.location.reload();
    }

    stillPresentBtn.addEventListener("click", () => submitReport("still_present"));
    noLongerHereBtn.addEventListener("click", () => submitReport("no_longer_here"));
}

if (document.getElementById("location-report-actions")) {
    initLocationReportForm();
}
