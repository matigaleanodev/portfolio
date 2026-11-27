import { computed, Signal } from '@angular/core';

import { Project } from '../../models/project.model';

export function projectLinks(project: Signal<Project | null | undefined>) {
  return computed(() => {
    const links = project()?.links ?? [];
    const primary = links.find((link) => link.primary) ?? links[0];
    const repository = links.find((link) => link !== primary && link.icon === 'code');
    const hero = primary ? [primary] : [];
    if (repository) hero.push(repository);

    return {
      hero,
      related: links.filter((link) => !hero.includes(link)),
    };
  });
}
