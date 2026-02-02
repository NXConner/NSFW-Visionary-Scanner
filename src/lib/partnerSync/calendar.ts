import type { IntimateDateProposal } from "@/lib/nsfwAdvancedFeatures";

function formatIcsDate(date: string, time: string) {
  const value = `${date}T${time}`.replace(/[-:]/g, "");
  return value.length >= 15 ? value : `${value}00`;
}

export function buildGoogleCalendarUrl(proposal: IntimateDateProposal) {
  const start = `${proposal.proposed_date}T${proposal.proposed_time}`;
  const title = encodeURIComponent(proposal.proposal_title);
  const details = encodeURIComponent(proposal.text_message ?? "");
  const location = encodeURIComponent(proposal.location_name ?? "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start.replace(/[-:]/g, "")}/${start.replace(/[-:]/g, "")}`;
}

export function buildIcsContent(proposal: IntimateDateProposal) {
  const start = formatIcsDate(proposal.proposed_date, proposal.proposed_time);
  const summary = proposal.proposal_title.replace(/\n/g, " ");
  const description = (proposal.text_message ?? "").replace(/\n/g, " ");
  const location = (proposal.location_name ?? "").replace(/\n/g, " ");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MorphoScan//Partner Sync//EN",
    "BEGIN:VEVENT",
    `UID:${proposal.id}`,
    `DTSTART:${start}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
}

export function buildIcsDataUrl(proposal: IntimateDateProposal) {
  const content = buildIcsContent(proposal);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
