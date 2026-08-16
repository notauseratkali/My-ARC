/**
 * Crew Terminology Helper
 * 
 * Rules:
 * - DO NOT NAME CREWS AS SUBCREWS.
 * - If it's 1 crew: "Crew"
 * - If it's more than 1 crew: "Network" or "Crew Network"
 */

export function getCrewLabel(crewCount: number = 1): string {
  if (crewCount <= 1) {
    return 'Crew';
  }
  return 'Network';
}

export function getCrewSectionTitle(crewCount: number = 1): string {
  if (crewCount <= 1) {
    return 'Crew Directory & Unit';
  }
  return 'Crew Network';
}

export function getCrewAssignmentLabel(crewCount: number = 1): string {
  if (crewCount <= 1) {
    return 'Crew Assignment';
  }
  return 'Network / Crew Assignment';
}

export function getCrewFilterPlaceholder(crewCount: number = 1): string {
  if (crewCount <= 1) {
    return 'All Crews';
  }
  return 'All Network Crews';
}
