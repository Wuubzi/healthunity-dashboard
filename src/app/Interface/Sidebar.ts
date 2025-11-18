import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface MenuItem {
  icon: IconDefinition;
  label: string;
  route: string;
  badge?: number;
}
