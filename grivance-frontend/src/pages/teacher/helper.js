export function feedbackCardDom(complaint) {
    // only consider these actors for comment cards
    const ACTORS = ["hod", "principal"];

    // map statuses to badge text + tailwind classes (only approved/rejected expected)
    function statusBadge(status) {
        const s = (status || "").toLowerCase();
        if (s === "approved") return { text: "Approved", classes: "bg-green-100 text-green-800" };
        if (s === "rejected") return { text: "Rejected", classes: "bg-red-100 text-red-800" };
        // fallback (shouldn't be used per your note)
        return { text: s || "Unknown", classes: "bg-gray-100 text-gray-800" };
    }

    // produce a feedback block for HOD or Principal only if there is either an approval or rejection reason
    function renderActorBlock(actorKey, approvalReasons = {}, rejectionReasons = {}) {
        const approve = approvalReasons?.[actorKey];
        const reject = rejectionReasons?.[actorKey];

        if (!approve && !reject) return ""; // nothing to show for this actor

        const isReject = Boolean(reject);
        const wrapperClasses = isReject
            ? "bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md"
            : "bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-md";

        const title = actorKey === "hod" ? "HOD's Feedback" : "Principal's Feedback";
        const reasonText = isReject ? reject : approve;

        return `
      <div class="${wrapperClasses} mt-3">
        <h4 class="font-bold mb-1">${title}:</h4>
        <p class="text-sm whitespace-pre-wrap">${reasonText}</p>
      </div>
    `;
    }

    const badge = statusBadge(complaint.status);
    const approvalReasons = complaint.approvalReasons || {};
    const rejectionReasons = complaint.rejectionReasons || {};

    // only HOD and Principal blocks (in that order)
    const actorBlocks = ACTORS.map(actor => renderActorBlock(actor, approvalReasons, rejectionReasons)).join("");

    return `
    <div class="grievance-card bg-white p-5 rounded-xl shadow-lg">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div class="flex-1 min-w-[200px]">
          <div class="flex items-center gap-3 mb-1">
            <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">${complaint.category}</span>
            <span class="text-gray-500 text-sm">From: ${complaint.createdBy?.email || ""} (${complaint.createdBy?.name || ""})</span>
          </div>

          <h3 class="text-lg font-bold text-gray-900">${complaint.title}</h3>
          <p class="text-gray-600 text-sm mt-1 whitespace-pre-wrap">${complaint.description}</p>

        </div>

        <div class="action-buttons flex-shrink-0">
          <div class="text-right">
               <span class="px-3 py-1 rounded-full text-sm font-semibold ${badge.classes}">${badge.text}</span>
            ${complaint.autoForwarded ? `<span class="text-sm text-indigo-600">Auto-forwarded</span>` : ""}
            </div>
        </div>
      </div>

      <!-- show only HOD / Principal feedback blocks (if present) -->
      ${actorBlocks}
    </div>
  `;
}
