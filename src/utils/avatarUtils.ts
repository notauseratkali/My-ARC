import explorerAvatar from '../assets/images/scout_avatar_explorer_1786010196818.jpg';
import roverAvatar from '../assets/images/scout_avatar_rover_1786010213630.jpg';
import councilAvatar from '../assets/images/scout_avatar_council_1786010224631.jpg';

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'Explorer' | 'Rover' | 'Council' | 'Dynamic';
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: 'explorer-default',
    name: 'Explorer Scout (Generated Avatar)',
    url: explorerAvatar,
    category: 'Explorer',
  },
  {
    id: 'rover-default',
    name: 'Rover Scout (Generated Avatar)',
    url: roverAvatar,
    category: 'Rover',
  },
  {
    id: 'council-default',
    name: 'Executive Council Officer (Generated Avatar)',
    url: councilAvatar,
    category: 'Council',
  },
];

/**
 * Returns a suitable placeholder avatar URL based on member details.
 */
export function getPlaceholderAvatar(
  section: 'Explorer' | 'Rover',
  councilRole?: string,
  name?: string
): string {
  if (councilRole && councilRole !== 'Member') {
    return councilAvatar;
  }
  if (section === 'Explorer') {
    return explorerAvatar;
  }
  if (section === 'Rover') {
    return roverAvatar;
  }
  // Dynamic fallback
  const seed = name ? encodeURIComponent(name) : 'scout';
  return `https://picsum.photos/seed/${seed}/200/200`;
}
